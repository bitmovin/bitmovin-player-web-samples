// npm run build: minified player-ui.min.js and player.min.css (with source maps) in dist/
import { build } from 'esbuild';
import { statSync } from 'node:fs';

// tsconfigRaw: tsconfig.json is for type checking only; it must not change the build output
const common = { minify: true, sourcemap: true, logLevel: 'info', tsconfigRaw: '{}' };

await build({ ...common, entryPoints: ['player-ui.js'], outfile: 'dist/player-ui.min.js', target: 'es2018' });
await build({ ...common, entryPoints: ['player.css'], outfile: 'dist/player.min.css' });

for (const f of ['player-ui.js', 'dist/player-ui.min.js', 'player.css', 'dist/player.min.css']) {
  console.log(`${f.padEnd(24)} ${(statSync(f).size / 1024).toFixed(1)} KB`);
}
