import json, subprocess, wave, tempfile, hashlib
from pathlib import Path
import os
app=Path(__file__).resolve().parent.parent
root=app.parents[2]/'audio-assets'
out=app/'src/game/audioLibrary.json'
entries={}
with tempfile.TemporaryDirectory() as tmp:
 for p in sorted(root.rglob('*')):
  if p.suffix.lower()!='.mp3': continue
  rel=p.relative_to(root).as_posix(); id='library:'+hashlib.sha256(rel.encode()).hexdigest()[:16]
  target=Path(tmp)/'clip.wav'
  subprocess.run([os.environ.get('FFMPEG_BINARY','ffmpeg'),'-v','error','-y','-i',str(p),'-ar','44100','-ac','2',str(target)],check=True)
  with wave.open(str(target)) as w: duration=w.getnframes()/w.getframerate()*1000
  entries[id]={'label':p.stem,'path':rel,'duration':duration,'src':'/__audio_library/'+id.split(':')[1]+'.mp3'}
out.write_text(json.dumps(entries,indent=2)+'\n')
print(len(entries))
