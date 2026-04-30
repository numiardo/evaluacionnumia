import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
let parsedRaw = fs.readFileSync(path.join(__dirname, 'parsed-quiz.json'), 'utf8');
if (parsedRaw.charCodeAt(0) === 0xfeff) parsedRaw = parsedRaw.slice(1);
const parsed = JSON.parse(parsedRaw);

function norm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/[¿?¡!.,;:]/g, '')
    .trim();
}

const existingStems = [
  norm('Impresión de ticket. Indique cuál de las siguientes afirmaciones son correctas.'),
  norm('Un cliente desea personalizar el puesto de atención simplificando la cantidad de botones visualizados para que no sea posible derivar turnos.'),
  norm('Un cliente requiere que se obtenga información asociada a próxima mejor oferta (NBO).'),
  norm('Un cliente desea implementar perfiles de puestos que sólo se encuentren disponibles en una sucursal piloto.'),
  norm('Indique cuál de las siguientes afirmaciones son ciertas sobre el módulo de Cartelería digital.'),
  norm('Indique qué afirmaciones sobre prioridades son correctas.'),
  norm('¿Es posible establecer puestos que sólo atiendan a determinados tipos de Clientes?'),
  norm('¿Es posible manejar numeración por tipo de trámite?'),
  norm('Un cliente requiere que al momento de obtener determinadas citas, se acepten términos y condiciones.'),
  norm('Indique qué requerimientos son cubiertos por la solución (con o sin integración).'),
  norm('Indique cuál de las siguientes afirmaciones son ciertas sobre APIs y webhooks.'),
  norm('¿La solución permite integración con sistemas de accesos centralizados como Active Directory mediante el protocolo LDAP?'),
  norm('Indique cuáles de las siguientes capacidades están incluidas dentro de Numia Manager.'),
  norm('¿La solución posee integración nativa con videollamada?'),
  norm('¿Qué canales pueden ser utilizados para notificaciones?'),
  norm('Un cliente requiere poder encolar turnos a través de APIs.'),
  norm('Un cliente requiere atención priorizada por tipo de Cliente, priorizando a la persona por sobre lo que necesita hacer.'),
  norm('Indique qué afirmaciones son correctas sobre la configuración de trámites.'),
  norm('Se requiere que los puestos de atención no pasen más de 45 minutos sin actividad cuando se encuentran en estado Almuerzo.'),
  norm('Indique cuál de las siguientes afirmaciones sobre videollamadas NO son ciertas.'),
  norm('Indique cuál de las siguientes afirmaciones son correctas sobre Cartelería digital.'),
  norm('Un cliente solicita que se envíen encuestas ante la finalización y cuando el cliente no se presenta.'),
  norm('Un cliente desea enviar recordatorios personalizados a través de los canales SMS, WhatsApp y email.'),
  norm('Numia ofrece funcionalidades de Speech Analytics.'),
];

function isDuplicateExcelRow(q) {
  const t = norm(q.text);
  for (const ex of existingStems) {
    if (t.length >= 25 && ex.length >= 25 && (t.includes(ex.slice(0, 50)) || ex.includes(t.slice(0, 50)))) return true;
  }
  if (t.includes('proxima mejor oferta') || t.includes('nbo')) return true;
  if (t.includes('derivar turnos') && t.includes('botones')) return true;
  if (t.includes('webhooks') && t.includes('apis') && t.includes('plataforma')) return true;
  if (t.includes('canales pueden ser utilizados para notificaciones')) return true;
  if (t.includes('recordatorios personalizados') && t.includes('sms')) return true;
  if (t.includes('afirmaciones sobre prioridades')) return true;
  if (t.includes('puestos que solo atiendan') || t.includes('puestos que sólo atiendan')) return true;
  if (t.includes('terminos y condiciones') && t.includes('citas')) return true;
  if (t.includes('requerimientos son cubiertos por la solucion')) return true;
  if (t.includes('al momento de configurar un tramite')) return true;
  if (t.includes('encuestas') && t.includes('finalizacion')) return true;
  if (t.includes('canales y contenidos') && t.includes('vigencia para imagenes')) return true;
  return false;
}

function sanitizeCorrect(q) {
  const max = q.options.length - 1;
  let c = (q.correct || []).filter((i) => Number.isInteger(i) && i >= 0 && i <= max);
  c = [...new Set(c)].sort((a, b) => a - b);
  const r = q.r;
  if (r === 3) return [1, 2, 3];
  if (r === 4) return [0, 1, 4];
  if (r === 5) return [0];
  if (r === 7) return [1];
  if (r === 9) return [0];
  if (r === 10) return [0];
  if (r === 13) return [0, 1, 2, 3, 4];
  if (r === 14) return [1];
  return c;
}

function escapeJsStr(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function polishText(s) {
  return s
    .replace(/\btramite\b/gi, 'trámite')
    .replace(/\btramites\b/gi, 'trámites')
    .replace(/\bcompania\b/gi, 'compañía')
    .replace(/\bgestion\b/gi, 'gestión')
    .replace(/\bconfiguracion\b/gi, 'configuración')
    .replace(/\binformacion\b/gi, 'información')
    .replace(/\bautomatica\b/gi, 'automática')
    .replace(/\bautomatico\b/gi, 'automático')
    .replace(/\banticipacion\b/gi, 'anticipación')
    .replace(/\bnotificacion\b/gi, 'notificación')
    .replace(/\bnotificaciones\b/gi, 'notificaciones')
    .replace(/\bcancelacion\b/gi, 'cancelación')
    .replace(/\bderivacion\b/gi, 'derivación')
    .replace(/\bmensajeria\b/gi, 'mensajería')
    .replace(/\bnumero\b/gi, 'número')
    .replace(/\bcuantas\b/gi, 'cuántas')
    .replace(/\bcuantos\b/gi, 'cuántos')
    .replace(/\bunicamente\b/gi, 'únicamente')
    .replace(/^Ademas\b/m, 'Además')
    .replace(/\bque tipos\b/gi, 'qué tipos')
    .replace(/^Cuales\b/m, 'Cuáles')
    .replace(/^Por que\b/m, 'Por qué')
    .replace(/\bSolo es\b/g, 'Sólo es')
    .replace(/\bsolo es\b/g, 'sólo es')
    .replace(/\bSolo /g, 'Sólo ')
    .replace(/\b solo /g, ' sólo ')
    .replace(/\bAPIs\b/g, 'APIs')
    .replace(/\bAPIS\b/g, 'APIs')
    .replace(/\(debsign\)/gi, '(design)')
    .replace(/\bSi,/g, 'Sí,')
    .replace(/\bsi,/g, 'sí,')
    .replace(/\bSi /g, 'Sí ')
    .replace(/\bsi /g, 'sí ');
}

const ptsByRow = {
  6: 5,
  15: 2,
  16: 2,
  17: 2,
  18: 4,
  19: 2,
  20: 2,
  21: 2,
  22: 4,
  23: 2,
  24: 2,
  25: 2,
  26: 5,
  27: 4,
  28: 2,
  29: 2,
  30: 2,
  31: 2,
  32: 2,
  33: 2,
  34: 3,
  35: 5,
  36: 2,
  37: 2,
  38: 2,
  39: 2,
  40: 2,
};

const additions = [];
for (const q of parsed.questions) {
  if (isDuplicateExcelRow(q)) continue;
  const text = polishText(q.text);
  const options = q.options.map(polishText);
  const correct = sanitizeCorrect({ ...q, text, options });
  const pts = q.pts > 0 ? q.pts : ptsByRow[q.r] || (q.type === 'multi' ? 4 : 2);
  additions.push({ ...q, text, options, correct, pts });
}

additions.sort((a, b) => a.r - b.r);

let n = 25;
const examBlocks = [];
const resultBlocks = [];
for (const q of additions) {
  const text = escapeJsStr(q.text);
  const optsStr = q.options.map((t) => `'${escapeJsStr(t)}'`).join(',\n      ');
  examBlocks.push(
    `  { n:${n}, pts:${q.pts}, type:'${q.type}',\n    text:'${text}',\n    options:[\n      ${optsStr},\n    ] },`
  );
  resultBlocks.push(
    `  { n:${n}, pts:${q.pts}, type:'${q.type}',\n    text:'${text}',\n    options:[\n      ${optsStr},\n    ], correct:[${q.correct.join(',')}] },`
  );
  n++;
}

console.log('Preguntas nuevas a insertar:', additions.length);

const examPath = path.join(root, 'certificacion-numia-manager.html');
const resPath = path.join(root, 'certificacion-numia-manager-resultado.html');

let examHtml = fs.readFileSync(examPath, 'utf8');
let resHtml = fs.readFileSync(resPath, 'utf8');

const examInsert = examBlocks.join('\n\n');
const resInsert = resultBlocks.join('\n\n');

const examEnd = `    ] , correct:[1,2]},
];`;
if (!examHtml.includes(examEnd)) {
  throw new Error('No se encontró el final del array questions en el examen (¿ya fue modificado?)');
}
examHtml = examHtml.replace(examEnd, `    ] },\n\n${examInsert}\n];`);

const resEnd = `    correct:[1,2] },
];`;
if (!resHtml.includes(resEnd)) {
  throw new Error('No se encontró el final del array questions en resultado');
}
resHtml = resHtml.replace(resEnd, `    correct:[1,2] },\n\n${resInsert}\n];`);

fs.writeFileSync(examPath, examHtml);
fs.writeFileSync(resPath, resHtml);
console.log('Archivos actualizados.');
