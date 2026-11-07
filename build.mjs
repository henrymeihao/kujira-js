// node build.mjs  ->  index.html (one self-contained file, served by GitHub Pages)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const three = fs.readFileSync(path.join(ROOT, 'vendor/three.module.js'), 'utf8');
if (/<\/script|<!--/i.test(three)) throw new Error('three.module.js needs escaping');
const gdir = path.join(ROOT, 'glsl');
const inc = {};
for (const f of fs.readdirSync(gdir)) if (f.startsWith('inc_')) inc[f.slice(4, -5)] = fs.readFileSync(path.join(gdir, f), 'utf8');
const GLSL = {};
for (const f of fs.readdirSync(gdir).sort()) {
  if (f.startsWith('inc_')) continue;
  GLSL[f.slice(0, -5)] = fs.readFileSync(path.join(gdir, f), 'utf8').replace(/^#include (\w+)$/gm, (_, n) => { if (!(n in inc)) throw new Error(f + ': no include ' + n); return inc[n]; });
}
const code = fs.readdirSync(path.join(ROOT, 'src')).filter((f) => f.endsWith('.js')).sort().map((f) => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8')).join('\n');
if (/<\/script/i.test(code)) throw new Error('code contains </script');
const html = fs.readFileSync(path.join(ROOT, 'template.html'), 'utf8')
  .replace('%%THREE%%', () => three).replace('%%GLSL%%', () => JSON.stringify(GLSL).replace(/<\//g, '<\\/')).replace('%%CODE%%', () => code);
const out = path.resolve(ROOT, process.argv[2] || 'index.html');
fs.writeFileSync(out, html);
console.log(out, (html.length / 1e6).toFixed(2) + ' MB');
