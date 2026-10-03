"""Package the selected immutable books/weights in the Math SDK publish format.
No simulations, probability adjustments, or source database writes.
Run with the workspace .venv Python. Outputs are excluded from the frontend build.
"""
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
from fractions import Fraction
import argparse, csv, hashlib, io, json, os, shutil, sqlite3, sys, zlib
import zstandard as zstd
from contextlib import nullcontext

APP = Path(__file__).resolve().parents[1]
WORKSPACE = APP.parents[2]
REPORTS = WORKSPACE / 'wild-pickins/reports/math'
MATH = WORKSPACE / 'math-sdk'
sys.path[:0] = [str(MATH / 'games/wild_pickins'), str(MATH)]
import template_bonus_replay
SELECTED = json.loads((APP / 'src/game/selectedModes.json').read_text())
CONFIG_SHA = hashlib.sha256((APP / 'src/game/selectedMath.json').read_bytes()).hexdigest()
ALLOWED = {'reveal','wildPickinsSpinResult','winInfo','setWin','setTotalWin','freeSpinTrigger','freeSpinEnd','finalWin'}

def sha(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream,'sha256').hexdigest()

def checked(path, expected):
    actual = sha(path)
    if actual != expected: raise ValueError(f'Changed source: {path}')
    return {'path':str(Path(path).relative_to(WORKSPACE)), 'sha256':actual}

def read(path): return json.loads(Path(path).read_text())

def lookup_rows(path):
    result = {}
    with Path(path).open(newline='') as stream:
        for row in csv.reader(stream):
            if len(row) != 3: raise ValueError('Lookup must have exactly three columns')
            identity, weight, payout = map(int,row)
            if identity in result or min(identity,weight,payout)<0 or payout%10 or payout>500000:
                raise ValueError(f'Invalid lookup row: {row}')
            result[identity]=(weight,payout)
    if not result or not 0<sum(w for w,p in result.values())<2**64:
        raise ValueError('Invalid uint64 total lookup weight')
    return result

def database_rows(path, identities):
    # A read-only, chunked indexed query preserves the exact CSV ordering.
    with sqlite3.connect(f'file:{Path(path)}?mode=ro',uri=True) as db:
        for offset in range(0,len(identities),800):
            chunk=identities[offset:offset+800]
            found={i:(p,data) for i,p,data in db.execute(
                f'SELECT id,payout,data FROM books WHERE id IN ({",".join("?" for _ in chunk)})',chunk)}
            for identity in chunk:
                if identity not in found: raise ValueError(f'Missing source book {identity}')
                payout,data=found[identity]
                yield identity,payout,zlib.decompress(data)

def compressed_rows(path):
    with Path(path).open('rb') as stream, zstd.ZstdDecompressor().stream_reader(stream) as reader:
        for raw in io.BufferedReader(reader):
            if raw.strip(): yield raw.rstrip(b'\r\n')

def inspect_book(raw, identity, payout):
    book=json.loads(raw)
    if book['id'] != identity or book['payoutMultiplier'] != payout:
        raise ValueError(f'Book/lookup mismatch {identity}')
    events=book['events']
    if not events or events[-1]['type']!='finalWin' or events[-1]['amount']!=payout:
        raise ValueError(f'Incomplete book {identity}')
    for index,event in enumerate(events):
        if event['index']!=index or event['type'] not in ALLOWED:
            raise ValueError(f'Unsupported/out-of-order event {identity}:{index}')
        if event['type']=='reveal' and event.get('goldenTarget') is not None:
            raise ValueError('Golden Picks must stay disabled')
        if event['type']=='wildPickinsSpinResult' and (
            event['harvestTopUp']!=0 or event['spinWin']!=event['lineWin']+event['scatterWin'] or
            event['roundTotal']>500000 or event['totalGranted']>30):
            raise ValueError(f'Changed selected rule contract {identity}')
    return len(events)

def transport_book(raw, identity, payout):
    book = json.loads(raw)
    if 'id' in book or 'payoutMultiplier' in book:
        if book.get('id') != identity or book.get('payoutMultiplier') != payout:
            raise ValueError('Source book identity/payout mismatch')
        return raw
    # The low-buy database stores a fixture envelope; transport its exact events.
    return json.dumps({'id': identity, 'payoutMultiplier': payout, 'events': book['events']},
                      separators=(',', ':')).encode()

def export_mode(mode, output, resume=False):
    output=Path(output); sources=[]; metadata=SELECTED[mode]
    regular=REPORTS/'candidate-corrected-1m-1-playtest'
    if mode in ('base','bonus'):
        package=regular if mode=='base' else REPORTS/'standard-buy-trigger-tail200k-cost50'
        info=read(package/'manifest.json')
        sources.append(checked(package/'experiment-config.json',CONFIG_SHA))
        sources.append(checked(package/'books.sqlite',info['booksSha256']))
        lookup=package/('candidate-corrected-1m-1.csv' if mode=='base' else 'lookUpTable_bonus.csv')
        sources.append({'path':str((package/'manifest.json').relative_to(WORKSPACE)), 'sha256':sha(package/'manifest.json')})
        tier=None
    else:
        info,summary,config,sampler,accepted,lookup=template_bonus_replay.source(mode)
        if info['configSha256']!=CONFIG_SHA: raise ValueError('Tier configuration mismatch')
        tier=(summary,accepted)
        sources.append({'path':str((template_bonus_replay.SPECS[mode]['source']/'summary.json').relative_to(WORKSPACE)), 'sha256':info['sourceSummarySha256']})
        sources.append({'path':str((template_bonus_replay.SPECS[mode]['refinement']/'refinement.json').relative_to(WORKSPACE)), 'sha256':sha(template_bonus_replay.SPECS[mode]['refinement']/'refinement.json')})
    sources.append(checked(lookup,metadata['lookupSha256']))
    rows=lookup_rows(lookup)
    if max(p for w,p in rows.values() if w>0)!=metadata['maxWinBookUnits']:
        raise ValueError('Frontend available maximum mismatch')
    book_path=output/f'books_{mode}.jsonl.zst'; weights=output/f'lookUpTable_{mode}_0.csv'
    reuse = resume and book_path.exists() and weights.exists()
    count=0; events=0; digest=hashlib.sha256(); seen=set()
    with (nullcontext() if reuse else book_path.open('wb')) as file, (nullcontext() if reuse else zstd.ZstdCompressor(level=3).stream_writer(file)) as writer:
        def emit(identity,payout,raw):
            nonlocal count,events
            if identity in seen or identity not in rows or rows[identity][1]!=payout: raise ValueError(f'Duplicate/unexpected book {identity}')
            events+=inspect_book(raw,identity,payout)
            line=raw.rstrip(b'\r\n')+b'\n'
            if writer is not None: writer.write(line)
            digest.update(line);seen.add(identity);count+=1
            if count%100000==0: print(f'{mode}: {count:,} books {"checked" if reuse else "exported"}',flush=True)
        if tier is None:
            for identity,payout,raw in database_rows(package/'books.sqlite',list(rows)): emit(identity,payout,transport_book(raw,identity,payout))
        else:
            summary,accepted=tier
            ids=[identity for identity in rows if identity in accepted]
            if ids:
                info_regular=read(regular/'manifest.json')
                sources.append(checked(regular/'books.sqlite',info_regular['booksSha256']))
                for identity,payout,raw in database_rows(regular/'books.sqlite',ids): emit(identity,payout,transport_book(raw,identity,payout))
            for lane in summary['lanes']:
                path=template_bonus_replay.source_path(lane['path'])/'books_base.jsonl.zst'
                sources.append(checked(path,lane['booksSha256']))
                lane_count=0
                for raw in compressed_rows(path):
                    # Sources use the SDK serializer; read the identity/payout once.
                    book=json.loads(raw);identity=book['id'];payout=book['payoutMultiplier']
                    if not lane['start']<=identity<lane['start']+lane['rounds']: raise ValueError('Wrong source lane ID')
                    emit(identity,payout,raw);lane_count+=1
                if lane_count!=lane['rounds']: raise ValueError('Incomplete source lane')
    if seen!=set(rows): raise ValueError('Book/lookup coverage mismatch')
    # Lookup bytes are preserved, including the original row ordering and zero weights.
    if not reuse: shutil.copyfile(lookup,weights)
    # Independent post-write decompression proves count, ordering, payloads and payout agreement.
    actual_digest=hashlib.sha256();remaining=dict(rows);read_count=0
    for raw in compressed_rows(book_path):
        b=json.loads(raw);identity=b['id'];expected=remaining.pop(identity,None)
        if expected is None or b['payoutMultiplier']!=expected[1]: raise ValueError('Corrupt published book')
        actual_digest.update(raw+b'\n');read_count+=1
        if read_count%100000==0: print(f'{mode}: {read_count:,} published books verified',flush=True)
    if remaining or read_count!=count or digest.hexdigest()!=actual_digest.hexdigest() or sha(weights)!=metadata['lookupSha256']:
        raise ValueError('Published file verification failed')
    total=sum(w for w,p in rows.values());weighted=sum(w*p for w,p in rows.values())
    rtp=Fraction(weighted,100*metadata['cost']*total)
    report={'mode':mode,'cost':metadata['cost'],'books':count,'events':events,'positiveWeightBooks':sum(w>0 for w,p in rows.values()),
        'totalWeight':total,'exactRtp':str(rtp),'rtp':float(rtp),'maxWinBookUnits':metadata['maxWinBookUnits'],
        'sources':sources,'eventsUncompressedSha256':digest.hexdigest(),
        'files':{book_path.name:{'sha256':sha(book_path),'bytes':book_path.stat().st_size},weights.name:{'sha256':sha(weights),'bytes':weights.stat().st_size}}}
    print(f'{mode}: verified {count:,} books, RTP {float(rtp):.12%}',flush=True)
    return report

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=APP/'engine-math');parser.add_argument('--workers',type=int,default=3)
    parser.add_argument('--resume-staging',action='store_true',help='Recheck finished mode files against source payloads and finish an interrupted staging export')
    args=parser.parse_args();root=args.output;root.mkdir(parents=True,exist_ok=True)
    publish=root/'publish_files';staging=root/'publish_files.building'
    if publish.exists() or (staging.exists() and not args.resume_staging): raise SystemExit('Output already exists. Choose a new --output directory to preserve the previous package.')
    staging.mkdir(exist_ok=args.resume_staging)
    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        futures=[pool.submit(export_mode,mode,str(staging),args.resume_staging) for mode in SELECTED]
        reports=[future.result() for future in futures]
    index={'modes':[{'name':mode,'cost':SELECTED[mode]['cost'],'events':f'books_{mode}.jsonl.zst','weights':f'lookUpTable_{mode}_0.csv'} for mode in SELECTED]}
    (staging/'index.json').write_text(json.dumps(index,indent=2)+'\n')
    report={'status':'local package verified; Engine staging acceptance pending','profile':'candidate-corrected-1m-1',
      'configSha256':CONFIG_SHA,'indexSha256':sha(staging/'index.json'),'modes':reports,
      'notes':['Outcomes, original book IDs, event payloads and lookup weights are preserved.',
       'The 50x source has no 5000x outcome; its available maximum remains 2922.3x.',
       'No Engine upload or wallet acceptance has been performed.']}
    (root/'package-report.json').write_text(json.dumps(report,indent=2)+'\n')
    staging.rename(publish)
    print(f'Verified package: {publish}',flush=True)

if __name__=='__main__': main()
