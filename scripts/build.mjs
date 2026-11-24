import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';

await mkdir('dist/public', { recursive: true });
await build({
  entryPoints: ['src/client/app.ts'], bundle: true, platform: 'browser',
  format: 'esm', target: 'es2022', outfile: 'dist/public/app.js',
});
await build({
  entryPoints: ['src/server/main.ts'], bundle: true, platform: 'node',
  format: 'esm', target: 'node24', packages: 'external', outfile: 'dist/server/main.js',
});
for (const name of ['index.html', 'style.css', 'audio-worklet.js']) {
  await copyFile(`src/client/${name}`, `dist/public/${name}`);
}
console.log('Compilación local completa. No se cargaron credenciales ni se conectó a OCI.');
