"""Extract small, provenance-checked Storybook examples; never alter source math.

Run with the existing workspace Python environment:
  PYTHONDONTWRITEBYTECODE=1 ../../../../.venv/bin/python import-selected-books.py
The full Engine book/weight export is a later migration checkpoint.
"""
from pathlib import Path
import csv
import hashlib
import json
import sqlite3
import sys
import zlib

APP = Path(__file__).resolve().parents[1]
WORKSPACE = APP.parents[2]
MATH = WORKSPACE / 'math-sdk'
REPORTS = WORKSPACE / 'wild-pickins/reports/math'
sys.path[:0] = [str(MATH / 'games/wild_pickins'), str(MATH), str(WORKSPACE / 'wild-pickins/tools')]
from contract import validate
import template_bonus_replay

PROFILE = 'candidate-corrected-1m-1'
DEST = APP / 'src/stories/data/selected'

def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def read(path):
    return json.loads(path.read_text())

def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()

regular = REPORTS / f'{PROFILE}-playtest'
regular_manifest = read(regular / 'manifest.json')
config_path = regular / 'experiment-config.json'
assert sha(config_path) == regular_manifest['configSha256']
config = read(config_path)
assert config['fixtureMath']['settlementPolicy'] == 'accumulation'
assert all(rate[0] == 0 for rate in config['goldenRates'].values())
DEST.mkdir(parents=True, exist_ok=True)
(APP / 'src/game/selectedMath.json').write_bytes(config_path.read_bytes())
mode_metadata = {}
manifest = {'profile': PROFILE, 'configSha256': sha(config_path),
            'bookPayoutScale': 100, 'books': {}}

def store(label, mode, cost, identity, payout, events, weight, lookup, source_manifest):
    envelope = {key: config[key] for key in (
        'schemaVersion', 'gameId', 'lineSetId', 'mathVersion', 'assetMapVersion',
        'spinBudget', 'roundCap', 'fixtureMath')}
    envelope.update(fixtureOnly=True, events=events)
    validate(envelope)
    assert events[-1]['amount'] == payout
    assert weight > 0
    book = {'id': identity, 'payoutMultiplier': payout, 'events': events}
    encoded = canonical(book) + b'\n'
    (DEST / f'{label}.json').write_bytes(encoded)
    manifest['books'][label] = {
        'mode': mode, 'cost': cost, 'sourceBookId': identity,
        'payoutBookUnits': payout, 'lookupWeight': weight,
        'bookSha256': hashlib.sha256(encoded).hexdigest(),
        'eventsSha256': hashlib.sha256(canonical(events)).hexdigest(),
        'lookup': str(lookup.relative_to(WORKSPACE)), 'lookupSha256': sha(lookup),
        'sourceManifest': str(source_manifest.relative_to(WORKSPACE)),
        'sourceManifestSha256': sha(source_manifest),
    }
    print(f'{label}: mode={mode}, book={identity}, payout={payout / 100}x, events={len(events)}')

def from_database(package, lookup, expected_lookup, requests, mode, cost):
    source_manifest = package / 'manifest.json'
    info = read(source_manifest)
    assert sha(package / 'books.sqlite') == info['booksSha256']
    assert sha(lookup) == expected_lookup
    assert sha(package / 'experiment-config.json') == manifest['configSha256']
    # Only keep positive-weight IDs needed for these previews. Selection is for
    # coverage, not a probability sampler and not evidence of session RTP.
    with lookup.open() as stream:
        weights = {int(i): (int(w), int(p)) for i, w, p in csv.reader(stream) if int(w) > 0}
    mode_metadata[mode] = {'cost': cost, 'initialSpins': 10 if mode == 'bonus' else 0,
        'maxWinBookUnits': max(p for w, p in weights.values()),
        'lookupSha256': sha(lookup)}
    with sqlite3.connect(f'file:{package / "books.sqlite"}?mode=ro', uri=True) as db:
        for label, condition, predicate in requests:
            found = False
            for identity, payout, data in db.execute(
                f'SELECT id,payout,data FROM books WHERE {condition} ORDER BY id'):
                if identity not in weights:
                    continue
                weight, expected_payout = weights[identity]
                assert payout == expected_payout
                book = json.loads(zlib.decompress(data))
                if not predicate(book['events']):
                    continue
                store(label, mode, cost, identity, payout, book['events'], weight, lookup, source_manifest)
                found = True
                break
            if not found:
                raise ValueError(f'No source book covers {label}')

has_bonus = lambda events: any(e['type'] == 'freeSpinTrigger' for e in events)
has_collision = lambda events: any(e.get('grantedExtraSpins', 0) > 0 for e in events)
from_database(regular, regular / regular_manifest['profiles'][PROFILE]['lookup'],
    regular_manifest['profiles'][PROFILE]['lookupSha256'], [
        ('base-loss', 'payout=0', lambda e: not has_bonus(e)),
        ('base-win', 'payout>0 AND payout<1000', lambda e: not has_bonus(e)),
        ('natural-bonus-collision', 'payout>1000', lambda e: has_bonus(e) and has_collision(e)),
        ('round-cap', 'payout=500000', has_bonus),
    ], 'base', 1)
low = REPORTS / 'standard-buy-trigger-tail200k-cost50'
from_database(low, low / 'lookUpTable_bonus.csv', read(low / 'manifest.json')['lookupSha256'],
    [('buy-50', 'payout>0', has_bonus)], 'bonus', 50)
for mode, label, cost in [('standard_bonus_buy_medium', 'buy-200', 200),
                           ('standard_bonus_buy_high', 'buy-500', 500)]:
    info, summary, tier_config, _, _, lookup = template_bonus_replay.source(mode)
    assert info['configSha256'] == manifest['configSha256']
    with lookup.open() as stream:
        rows = [tuple(map(int, row)) for row in csv.reader(stream) if int(row[1]) > 0]
        identity, weight, payout = next(row for row in rows if row[0] >= summary['start'])
        mode_metadata[mode] = {'cost': cost, 'initialSpins': info['initialSpins'],
            'maxWinBookUnits': max(row[2] for row in rows), 'lookupSha256': sha(lookup)}
    envelope, actual = template_bonus_replay.book(mode, identity)
    assert actual == payout
    store(label, mode, cost, identity, payout, envelope['events'], weight, lookup,
          template_bonus_replay.SPECS[mode]['refinement'] / 'refinement.json')
(APP / 'src/game/selectedModes.json').write_text(json.dumps(mode_metadata, indent=2) + '\n')
(DEST / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
