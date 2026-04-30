import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const extractDir = process.env.XLSX_EXTRACT || path.join(process.env.TEMP || '/tmp', 'xlsx_quiz_extract');
const ssPath = path.join(extractDir, 'xl', 'sharedStrings.xml');
const shPath = path.join(extractDir, 'xl', 'worksheets', 'sheet1.xml');

function parseSharedStrings(xml) {
  const strings = [];
  const re = /<si[^>]*>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = re.exec(xml))) {
    const inner = m[1];
    const texts = [...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) =>
      x[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    );
    strings.push(texts.join(''));
  }
  return strings;
}

function colLetterToIndex(col) {
  let n = 0;
  for (let i = 0; i < col.length; i++) n = n * 26 + (col.charCodeAt(i) - 64);
  return n - 1;
}

function parseSheetRows(xml, strings) {
  const rows = [];
  const rowRe = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let rm;
  while ((rm = rowRe.exec(xml))) {
    const rnum = parseInt(rm[1], 10);
    const body = rm[2];
    const cells2 = {};
    const cRe2 = /<c r="([A-Z]+)(\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cm2;
    while ((cm2 = cRe2.exec(body))) {
      const col = cm2[1];
      const row = parseInt(cm2[2], 10);
      const attrs = cm2[3];
      const inner = cm2[4] || '';
      const vm = inner.match(/<v>([^<]*)<\/v>/);
      const v = vm ? vm[1] : '';
      const isString = attrs.includes('t="s"');
      cells2[col] = { row, col, raw: v, isString };
    }
    rows.push({ r: rnum, cells: cells2 });
  }
  return rows;
}

function cellVal(c, strings) {
  if (!c) return '';
  const v = c.raw.trim();
  if (c.isString) {
    const i = parseInt(v, 10);
    return strings[i] ?? '';
  }
  return v;
}

const ssXml = fs.readFileSync(ssPath, 'utf8');
const shXml = fs.readFileSync(shPath, 'utf8');
const strings = parseSharedStrings(ssXml);
const rows = parseSheetRows(shXml, strings);

const TIPO_SINGLE = strings.indexOf('Opcion multiple (unica)');
const TIPO_MULTI = strings.indexOf('Seleccion multiple');

const questions = [];
for (const { r, cells } of rows) {
  if (r === 1) continue;
  const pts = parseFloat(cellVal(cells.B, strings)) || 0;
  const tipoStr = cellVal(cells.C, strings);
  const text = cellVal(cells.D, strings);
  if (!text || text === strings[3]) continue;

  const type = tipoStr === strings[TIPO_MULTI] ? 'multi' : tipoStr === strings[TIPO_SINGLE] ? 'single' : null;
  if (!type) continue;

  const opts = ['E', 'F', 'G', 'H', 'I'].map((col) => cellVal(cells[col], strings)).filter(Boolean);
  const ansRaw = cellVal(cells.J, strings).trim();

  const letterToIndex = (L) => L.charCodeAt(0) - 65;
  let correct = [];
  const compact = ansRaw.replace(/\s/g, '').toUpperCase();
  if (/^[A-I](,[A-I])*$/.test(compact)) {
    correct = ansRaw
      .split(/[,]/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .map((L) => letterToIndex(L.slice(0, 1)));
  } else {
    const parts = ansRaw.split(',').map((s) => s.trim().toUpperCase());
    for (const p of parts) {
      const m = p.match(/^([A-I])/);
      if (m) correct.push(letterToIndex(m[1]));
    }
  }

  questions.push({ r, pts, type, text, options: opts, correct: [...new Set(correct)].sort((a, b) => a - b), ansRaw });
}

const out = { stringsLen: strings.length, TIPO_SINGLE, TIPO_MULTI, count: questions.length, questions };
fs.writeFileSync(path.join(__dirname, 'parsed-quiz.json'), JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(out, null, 2));
