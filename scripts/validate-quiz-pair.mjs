import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function extractArray(src) {
  const m = src.match(/const questions = \[([\s\S]*?)\];\s*\n\nfunction /);
  if (!m) throw new Error('no questions array');
  return m[1];
}

function parseMeta(body, requireCorrect) {
  const blocks = body.split(/\n  \{ n:/).slice(1);
  const out = [];
  for (const b of blocks) {
    const nm = b.match(/^(\d+)/);
    const n = parseInt(nm[1], 10);
    const pts = /pts:(\d+)/.exec(b);
    const type = /type:'(single|multi)'/.exec(b);
    const hasCorrect = /correct:\[[^\]]*\]/.test(b);
    if (requireCorrect && !hasCorrect) throw new Error('Falta correct en pregunta ' + n);
    out.push({ n, pts: +pts[1], type: type[1] });
  }
  return out;
}

const exam = fs.readFileSync(path.join(root, 'certificacion-numia-manager.html'), 'utf8');
const res = fs.readFileSync(path.join(root, 'certificacion-numia-manager-resultado.html'), 'utf8');

const eq = parseMeta(extractArray(exam), false);
const rq = parseMeta(extractArray(res), true);

if (eq.length !== rq.length) {
  console.error('LENGTH', eq.length, rq.length);
  process.exit(1);
}
let sum = 0;
for (let i = 0; i < eq.length; i++) {
  sum += rq[i].pts;
  if (eq[i].n !== rq[i].n || eq[i].type !== rq[i].type || eq[i].pts !== rq[i].pts) {
    console.error('DIFF idx', i, eq[i], rq[i]);
    process.exit(1);
  }
}
console.log('OK:', eq.length, 'preguntas · puntos máximos', sum);
