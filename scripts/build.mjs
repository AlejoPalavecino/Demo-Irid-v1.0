import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,join} from 'node:path';
import {createHash} from 'node:crypto';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(path,encoding='utf8')=>readFile(join(root,path),encoding);
const modules=[['domain','Domain'],['operations','Operations'],['management','Management'],['finance','Finance']];
const parts=[];
for(const [file,name] of modules){
  const source=await read(`src/${file}.js`);
  const exports=[...source.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)/gm)].map(m=>m[1]);
  if(!exports.length||/^import /m.test(source))throw Error(`Módulo no compatible: ${file}`);
  parts.push(`const ${name}=(()=>{\n${source.replace(/^export\s+/gm,'')}\nreturn {${exports.join(',')}};\n})();`);
}
parts.push(await read('src/main.js'));
const font=(await read('assets/fonts/Montserrat-variable.ttf',null)).toString('base64');
const logo=(await read('assets/brand/logo-original.jpg',null)).toString('base64');
const css=(await read('src/styles.css')).replace('%%FONT%%',font);
const js=parts.join('\n').replaceAll('</script','<\\/script');
const html=(await read('src/template.html')).replace('%%CSS%%',()=>css).replace('%%LOGO%%',()=>logo).replace('%%JS%%',()=>js);
if(/%%(?:FONT|CSS|LOGO|JS)%%/.test(html))throw Error('Quedan recursos sin incrustar.');
await writeFile(join(root,'index.html'),html);
await mkdir(join(root,'dist'),{recursive:true});
await writeFile(join(root,'dist/IRID-maqueta-interactiva.html'),html);
const manifest={file:'index.html',bytes:Buffer.byteLength(html),sha256:createHash('sha256').update(html).digest('hex')};
await writeFile(join(root,'dist/build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`HTML autónomo generado: ${manifest.bytes.toLocaleString('es-AR')} bytes · ${manifest.sha256}`);
