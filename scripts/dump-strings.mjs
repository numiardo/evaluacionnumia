import fs from 'fs';
import path from 'path';
const p = path.join(process.env.TEMP, 'xlsx_quiz_extract', 'xl', 'sharedStrings.xml');
const x = fs.readFileSync(p, 'utf8');
const a = [];
const re = /<si[^>]*>([\s\S]*?)<\/si>/g;
let m;
while ((m = re.exec(x))) {
  const t = [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((z) => z[1].replace(/&amp;/g, '&'));
  a.push(t.join(''));
}
[16, 23, 30, 39, 43].forEach((i) => console.log(i, JSON.stringify(a[i])));
