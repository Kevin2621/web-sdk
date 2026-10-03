import importlib.util, io, json, sqlite3, tempfile, unittest, zlib
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('engine_export',Path(__file__).with_name('export-engine-math.py'))
export=importlib.util.module_from_spec(spec);spec.loader.exec_module(export)

class ExportChecks(unittest.TestCase):
 def test_low_buy_package_resume_checks_source_payloads_and_rejects_corruption(self):
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder);source=root/'standard-buy-trigger-tail200k-cost50';source.mkdir()
   output=root/'output';output.mkdir()
   (source/'experiment-config.json').write_text('{}')
   lookup=source/'lookUpTable_bonus.csv';lookup.write_text('42,1,100\n')
   events=[{'index':0,'type':'finalWin','amount':100}]
   with sqlite3.connect(source/'books.sqlite') as db:
    db.execute('create table books (id integer primary key,payout integer,data blob)')
    db.execute('insert into books values (?,?,?)',(42,100,zlib.compress(json.dumps({'fixtureOnly':True,'events':events}).encode())))
   (source/'manifest.json').write_text(json.dumps({'booksSha256':export.sha(source/'books.sqlite')}))
   metadata={'bonus':{'cost':50,'maxWinBookUnits':100,'lookupSha256':export.sha(lookup)}}
   with patch.multiple(export,WORKSPACE=root,REPORTS=root,SELECTED=metadata,CONFIG_SHA=export.sha(source/'experiment-config.json')):
    first=export.export_mode('bonus',output)
    resumed=export.export_mode('bonus',output,resume=True)
    self.assertEqual(first,resumed)
    book=output/'books_bonus.jsonl.zst'
    book.write_bytes(export.zstd.ZstdCompressor().compress(json.dumps({'id':42,'payoutMultiplier':100,'events':[{'index':0,'type':'finalWin','amount':90}]}).encode()+b'\n'))
    with self.assertRaises(ValueError):export.export_mode('bonus',output,resume=True)
 def test_fixture_envelope_transports_exact_events_with_database_identity(self):
  events=[{'index':0,'type':'finalWin','amount':100}]
  raw=json.dumps({'fixtureOnly':True,'events':events}).encode()
  actual=json.loads(export.transport_book(raw,42,100))
  self.assertEqual(actual,{'id':42,'payoutMultiplier':100,'events':events})
  encoded=json.dumps(actual).encode()
  self.assertEqual(export.transport_book(encoded,42,100),encoded)
  with self.assertRaises(ValueError):export.transport_book(encoded,43,100)
 def test_integer_lookup_contract(self):
  with tempfile.TemporaryDirectory() as folder:
   p=Path(folder)/'lookup.csv';p.write_text('0,100,0\n1,25,100\n2,0,500000\n')
   self.assertEqual(export.lookup_rows(p),{0:(100,0),1:(25,100),2:(0,500000)})
   for value in ['0,1,5\n','0,-1,0\n','0,1,500010\n','0,1,0\n0,1,0\n',f'0,{2**64},0\n']:
    p.write_text(value)
    with self.assertRaises(ValueError):export.lookup_rows(p)
 def test_readonly_database_export_preserves_lookup_order_and_source_bytes(self):
  with tempfile.TemporaryDirectory() as folder:
   p=Path(folder)/'books.sqlite'
   raw={i:json.dumps({'id':i,'payoutMultiplier':i*10,'events':[{'index':0,'type':'finalWin','amount':i*10}]}).encode() for i in [1,3]}
   with sqlite3.connect(p) as db:
    db.execute('create table books (id integer primary key,payout integer,data blob)')
    db.executemany('insert into books values (?,?,?)',[(i,i*10,zlib.compress(data)) for i,data in raw.items()])
   before=export.sha(p)
   self.assertEqual(list(export.database_rows(p,[3,1])),[(3,30,raw[3]),(1,10,raw[1])])
   self.assertEqual(export.sha(p),before)
 def test_source_hash_and_transport_mismatches_fail_closed(self):
  raw=json.dumps({'id':1,'payoutMultiplier':100,'events':[{'index':0,'type':'finalWin','amount':100}]}).encode()
  self.assertEqual(export.inspect_book(raw,1,100),1)
  with self.assertRaises(ValueError):export.inspect_book(raw,1,200)
  bad=json.loads(raw);bad['events'][0]['type']='sqlitePlayback'
  with self.assertRaises(ValueError):export.inspect_book(json.dumps(bad),1,100)
  with tempfile.TemporaryDirectory() as folder:
   p=Path(folder)/'source';p.write_bytes(b'changed')
   with self.assertRaises(ValueError):export.checked(p,'0'*64)

if __name__=='__main__':unittest.main()
