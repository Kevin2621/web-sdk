import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('recompress', Path(__file__).with_name('recompress-engine-math.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RecompressionChecks(unittest.TestCase):
    def test_roundtrip_preserves_exact_books_and_decoder_window(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            raw = b''.join(json.dumps({'id': i, 'payoutMultiplier': 100,
                'events': [{'index': 0, 'type': 'finalWin', 'amount': 100}]}).encode() + b'\n'
                for i in range(100))
            source = root / 'source.zst'
            source.write_bytes(module.zstd.ZstdCompressor(level=3).compress(raw))
            target = root / 'target.zst'
            metadata, report = module.recompress_file(source, target, module.sha(source),
                hashlib.sha256(raw).hexdigest(), 100)
            self.assertEqual(module.decompressed_digest(target), (hashlib.sha256(raw).hexdigest(), len(raw), 100))
            self.assertEqual(metadata['sha256'], module.sha(target))
            self.assertTrue(report['byteIdenticalDecompression'])
            with self.assertRaises(ValueError):
                module.recompress_file(source, target, module.sha(source), hashlib.sha256(raw).hexdigest(), 100)

    def test_changed_source_or_payload_fails_verification(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / 'source.zst'
            source.write_bytes(module.zstd.ZstdCompressor().compress(b'{"id":1}\n'))
            with self.assertRaisesRegex(ValueError, 'compressed book hash'):
                module.recompress_file(source, root / 'bad-source.zst', '0' * 64, '0' * 64, 1)
            with self.assertRaisesRegex(ValueError, 'uncompressed payload/count'):
                module.recompress_file(source, root / 'bad-payload.zst', module.sha(source), '0' * 64, 1)


if __name__ == '__main__':
    unittest.main()
