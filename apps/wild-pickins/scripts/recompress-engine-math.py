"""Losslessly recompress an already verified package, then run SDK verification."""
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
import argparse
import copy
import hashlib
import json
import shutil
import subprocess
import sys

import zstandard as zstd

APP = Path(__file__).resolve().parents[1]
CHUNK = 2 * 1024 * 1024


def sha(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def decompressed_digest(path):
    digest = hashlib.sha256()
    size = books = 0
    with Path(path).open('rb') as file, zstd.ZstdDecompressor().stream_reader(file) as reader:
        while chunk := reader.read(CHUNK):
            digest.update(chunk)
            size += len(chunk)
            books += chunk.count(b'\n')
    return digest.hexdigest(), size, books


def recompress_file(source, destination, compressed_sha, raw_sha, books, level=15):
    source, destination = Path(source), Path(destination)
    if destination.exists():
        raise ValueError('Refusing to overwrite an existing compressed book')
    if sha(source) != compressed_sha:
        raise ValueError('Source compressed book hash mismatch')
    with source.open('rb') as file:
        original_frame = zstd.get_frame_parameters(file.read(18))
    if original_frame.dict_id:
        raise ValueError('External dictionaries are not supported')
    # Keep the original decoder window requirement while improving compression.
    window_log = max(10, (original_frame.window_size - 1).bit_length())
    parameters = zstd.ZstdCompressionParameters.from_level(level, window_log=window_log)
    content_size = original_frame.content_size
    writer_size = -1 if content_size == zstd.CONTENTSIZE_UNKNOWN else content_size
    digest = hashlib.sha256()
    size = count = 0
    with source.open('rb') as file, zstd.ZstdDecompressor().stream_reader(file) as reader, \
            destination.open('xb') as output, \
            zstd.ZstdCompressor(compression_params=parameters).stream_writer(output, size=writer_size) as writer:
        while chunk := reader.read(CHUNK):
            digest.update(chunk)
            size += len(chunk)
            count += chunk.count(b'\n')
            writer.write(chunk)
    expected = (raw_sha, size, books)
    if (digest.hexdigest(), size, count) != expected:
        raise ValueError('Source uncompressed payload/count mismatch')
    if decompressed_digest(destination) != expected:
        raise ValueError('Recompressed payload/count mismatch')
    with destination.open('rb') as file:
        frame = zstd.get_frame_parameters(file.read(18))
    if frame.dict_id or frame.window_size > original_frame.window_size:
        raise ValueError('Unexpected dictionary or increased decoder window')
    return {'sha256': sha(destination), 'bytes': destination.stat().st_size}, {
        'level': level, 'windowBytes': frame.window_size,
        'sourceCompressedSha256': compressed_sha, 'sourceBytes': source.stat().st_size,
        'uncompressedBytes': size, 'byteIdenticalDecompression': True,
    }


def recompress_mode(mode, original, staging, level):
    result = copy.deepcopy(mode)
    name = f"books_{mode['mode']}.jsonl.zst"
    print(f"{mode['mode']}: recompressing at level {level}", flush=True)
    metadata, compression = recompress_file(
        original / name, staging / name, mode['files'][name]['sha256'],
        mode['eventsUncompressedSha256'], mode['books'], level,
    )
    result['files'][name] = metadata
    result['compression'] = compression
    for filename, recorded in mode['files'].items():
        if filename == name:
            continue
        if sha(original / filename) != recorded['sha256']:
            raise ValueError('Source lookup hash mismatch')
        shutil.copyfile(original / filename, staging / filename)
        if sha(staging / filename) != recorded['sha256']:
            raise ValueError('Copied lookup hash mismatch')
    reduction = 1 - metadata['bytes'] / compression['sourceBytes']
    print(f"{mode['mode']}: byte-identical books verified, {reduction:.1%} smaller", flush=True)
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=APP / 'engine-math')
    parser.add_argument('--output', type=Path, default=APP / 'engine-math/compressed-level15')
    parser.add_argument('--level', type=int, choices=range(1, 20), default=15)
    parser.add_argument('--workers', type=int, default=3)
    args = parser.parse_args()
    original = args.source / 'publish_files'
    report = json.loads((args.source / 'package-report.json').read_text())
    verified = json.loads((args.source / 'sdk-verification.json').read_text())
    if sha(original / 'index.json') != report['indexSha256'] or verified['indexSha256'] != report['indexSha256']:
        raise ValueError('Source index verification mismatch')
    expected_counts = [(m['mode'], m['books'], m['events']) for m in report['modes']]
    if expected_counts != [(m['mode'], m['books'], m['events']) for m in verified['modes']]:
        raise ValueError('Source SDK count verification mismatch')
    if args.output.exists():
        raise SystemExit('Output exists; choose a fresh directory')
    staging = args.output / 'publish_files.building'
    staging.mkdir(parents=True)
    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        futures = [pool.submit(recompress_mode, mode, original, staging, args.level)
                   for mode in report['modes']]
        report['modes'] = [future.result() for future in futures]
    shutil.copyfile(original / 'index.json', staging / 'index.json')
    if sha(staging / 'index.json') != report['indexSha256']:
        raise ValueError('Copied index hash mismatch')
    report['status'] = 'byte-identical recompression verified; local SDK verification pending'
    report['recompressedFrom'] = str(args.source.resolve())
    (args.output / 'package-report.json').write_text(json.dumps(report, indent=2) + '\n')
    staging.rename(args.output / 'publish_files')
    print('Recompression complete; starting Math SDK verification', flush=True)
    subprocess.run([sys.executable, str(APP / 'scripts/verify-engine-math.py'),
                    '--package', str(args.output), '--workers', str(args.workers)], check=True)
    report['status'] = 'byte-identical recompression and local SDK checks passed; Engine staging acceptance pending'
    (args.output / 'package-report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'Verified compressed package: {args.output / "publish_files"}', flush=True)


if __name__ == '__main__':
    main()
