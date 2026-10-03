"""Run the Math SDK's upload format/payout checks on an existing package."""
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
import argparse
import hashlib
import json
import sys

APP = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(APP.parents[2] / 'math-sdk'))
from utils.rgs_verification import (
    verify_lookup_format, verify_books_and_payout_mults, compare_payout_values,
)

def verify_mode(mode, recorded, publish):
    assert mode['name'] == recorded['mode'] and mode['cost'] == recorded['cost']
    for name, metadata in recorded['files'].items():
        with (publish / name).open('rb') as stream:
            assert hashlib.file_digest(stream, 'sha256').hexdigest() == metadata['sha256']
    _, payouts, _, _, _ = verify_lookup_format(str(publish / mode['weights']))
    book_payouts, events = verify_books_and_payout_mults(str(publish / mode['events']))
    compare_payout_values(book_payouts, payouts)
    assert len(payouts) == recorded['books'] and events == recorded['events']
    print(f"{mode['name']}: SDK format, ordered payouts and file hashes passed", flush=True)
    return {'mode': mode['name'], 'books': len(payouts), 'events': events}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--package', type=Path, default=APP / 'engine-math')
    parser.add_argument('--workers', type=int, default=3)
    args = parser.parse_args()
    publish = args.package / 'publish_files'
    report = json.loads((args.package / 'package-report.json').read_text())
    index_path = publish / 'index.json'
    assert hashlib.sha256(index_path.read_bytes()).hexdigest() == report['indexSha256']
    index = json.loads(index_path.read_text())
    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        futures = [pool.submit(verify_mode, mode, recorded, publish)
                   for mode, recorded in zip(index['modes'], report['modes'], strict=True)]
        results = [future.result() for future in futures]
    (args.package / 'sdk-verification.json').write_text(json.dumps({
        'status': 'local SDK format checks passed; Engine staging acceptance pending',
        'indexSha256': report['indexSha256'], 'modes': results,
    }, indent=2) + '\n')


if __name__ == '__main__':
    main()
