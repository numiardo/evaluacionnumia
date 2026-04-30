import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const examPath = path.join(root, 'certificacion-numia-manager.html');
const resPath = path.join(root, 'certificacion-numia-manager-resultado.html');

const r6Exam = `  { n:25, pts:5, type:'single',
    text:'Un cliente requiere atención priorizada por tipo de cliente y por trámite. ¿Cómo se configura?',
    options:[
      'Configurar prioridades desde Base de Clientes - Tipo de cliente, definir prioridades por trámite. Indicar el algoritmo "Prioridad por trámite y cliente" en el Perfil de puesto llamado.',
      'Configurar prioridades desde Base de Clientes - Tipo de cliente. La solución siempre prioriza por trámite de forma automática.',
      'Configurar prioridades desde Base de Clientes - Tipo de cliente, definir prioridades por trámite. Indicar el algoritmo "Prioridad por trámite y cliente" a nivel compañía.',
      'Será necesario consumir esta priorización desde otro sistema ya que la solución no cuenta con esta capacidad',
      'No es posible',
    ] },`;

const r6Res = `  { n:25, pts:5, type:'single',
    text:'Un cliente requiere atención priorizada por tipo de cliente y por trámite. ¿Cómo se configura?',
    options:[
      'Configurar prioridades desde Base de Clientes - Tipo de cliente, definir prioridades por trámite. Indicar el algoritmo "Prioridad por trámite y cliente" en el Perfil de puesto llamado.',
      'Configurar prioridades desde Base de Clientes - Tipo de cliente. La solución siempre prioriza por trámite de forma automática.',
      'Configurar prioridades desde Base de Clientes - Tipo de cliente, definir prioridades por trámite. Indicar el algoritmo "Prioridad por trámite y cliente" a nivel compañía.',
      'Será necesario consumir esta priorización desde otro sistema ya que la solución no cuenta con esta capacidad',
      'No es posible',
    ], correct:[0] },`;

function patch(html, isResult) {
  for (let k = 50; k >= 25; k--) {
    html = html.replaceAll(`{ n:${k},`, `{ n:${k + 1},`);
  }
  const needle = isResult
    ? `    correct:[1,2] },\n\n  { n:26, pts:2, type:'single',`
    : `    ] },\n\n  { n:26, pts:2, type:'single',`;
  const insert = isResult
    ? `    correct:[1,2] },\n\n${r6Res}\n\n  { n:26, pts:2, type:'single',`
    : `    ] },\n\n${r6Exam}\n\n  { n:26, pts:2, type:'single',`;
  if (!html.includes(needle)) {
    throw new Error('Marcador inserción no encontrado (¿numeración ya cambió?)');
  }
  html = html.replace(needle, insert);
  const fixes = [
    ["'únicamente información", "'Únicamente información"],
    ["'Sólo es posible sí ambas", "'Sólo es posible si ambas"],
    ['pertenecen a la misma region', 'pertenecen a la misma región'],
    ["'Sí su cita fue asignada", "'Si su cita fue asignada"],
    ["'Sí es el proximo", "'Si es el próximo"],
    ['(cuando es el unico en espera)', '(cuando es el único en espera)'],
    ["text:'qué tipos de notificaciones", "text:'¿Qué tipos de notificaciones"],
    ['priorizacion de turnos', 'priorización de turnos'],
    [' en que se diferencian?', ' ¿en qué se diferencian?'],
    ['Para que sirve el Grupo', '¿Para qué sirve el Grupo'],
    [' en que situacion se activa', ' ¿en qué situación se activa'],
    [' se activa automaticamente?', ' se activa automáticamente?'],
    ['Que opciones tiene un puesto', '¿Qué opciones tiene un puesto'],
    [' no se presento?', ' no se presentó?'],
    ['Bajo que condicion?', '¿Bajo qué condición?'],
    ['Que son los Sub trámites', '¿Qué son los Subtrámites'],
    ['Para que sirve el codigo QR', '¿Para qué sirve el código QR'],
    ['Que mensaje recibe un cliente', '¿Qué mensaje recibe un cliente'],
    ['Que es la ', '¿Qué es la '],
    [' desde el modulo de citas', ' desde el módulo de citas'],
    ['automaticas puede', 'automáticas puede'],
    ['Confirmacion de la cita', 'Confirmación de la cita'],
    ['Anadir nuevos participantes', 'Añadir nuevos participantes'],
  ];
  for (const [a, b] of fixes) {
    html = html.split(a).join(b);
  }
  return html;
}

let exam = fs.readFileSync(examPath, 'utf8');
let res = fs.readFileSync(resPath, 'utf8');

exam = patch(exam, false);
res = patch(res, true);

fs.writeFileSync(examPath, exam);
fs.writeFileSync(resPath, res);
console.log('Post-merge fix OK.');
