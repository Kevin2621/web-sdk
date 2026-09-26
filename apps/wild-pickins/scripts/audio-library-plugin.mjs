import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Serve only catalogued recordings, only in development; never ship the asset library.
export function audioLibraryPlugin() {
 return { name:'wild-pickins-audio-library', apply:'serve', configureServer(server) {
  server.middlewares.use('/__audio_library', async (req,res,next)=>{
   try {
    const library=JSON.parse(await readFile(new URL('../src/game/audioLibrary.json',import.meta.url),'utf8'));
    const entry=Object.values(library).find(item=>item.src==='/__audio_library'+req.url?.split('?')[0]);
    if(!entry)return next();
    const root=new URL('../../../../audio-assets/',import.meta.url);
    const stream=createReadStream(fileURLToPath(new URL(entry.path.split('/').map(encodeURIComponent).join('/'),root)));
    stream.on('error',()=>{res.statusCode=404;res.end('Recording not found');});
    res.setHeader('Content-Type','audio/mpeg');
    stream.pipe(res);
   }catch(error){next(error);}
  });
 }};
}
