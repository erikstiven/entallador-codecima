import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Crear pedido_valido.xlsx
const validData = [
  ['Talla', 'Nombre', 'Numero', 'Tipo', 'Observaciones'],
  ['28', 'MATEO', '10', 'COMPLETO', 'Capitán'],
  ['28', 'CAMILA', '7', 'COMPLETO', ''],
  ['30', 'CARLOS', '21', 'CAMISETA', ''],
  ['30', 'CHRISTOPHER', '9', 'COMPLETO', 'Nombre largo'],
  ['32', 'DANIELA', '15', 'COMPLETO', 'Femenino'],
  ['32', 'ÁLVARO', '4', 'COMPLETO', 'Con tilde'],
  ['S', 'ÍÑIGO', '8', 'COMPLETO', 'Con tildes y eñe'],
  ['M', 'VALENTINA', '12', 'SHORT', 'Solo short']
];

const wbValid = XLSX.utils.book_new();
const wsValid = XLSX.utils.aoa_to_sheet(validData);
XLSX.utils.book_append_sheet(wbValid, wsValid, 'Pedido');
XLSX.writeFile(wbValid, path.join(__dirname, 'pedido_valido.xlsx'));

// 2. Crear pedido_con_errores.xlsx
const invalidData = [
  ['Talla', 'Nombre', 'Numero', 'Tipo', 'Observaciones'],
  ['28', 'MATEO', '10', 'COMPLETO', ''],
  ['T99', 'CAMILA', '7', 'COMPLETO', 'Talla no existe en molde'],
  ['30', '', '21', 'CAMISETA', 'Nombre vacío'],
  ['30', 'CARLOS#2', '', 'COMPLETO', 'Numero vacío y caracteres ilegales'],
  ['32', 'DANIELA', '10', 'COMPLETO', 'Numero 10 duplicado con Mateo'],
];

const wbInvalid = XLSX.utils.book_new();
const wsInvalid = XLSX.utils.aoa_to_sheet(invalidData);
XLSX.utils.book_append_sheet(wbInvalid, wsInvalid, 'Errores');
XLSX.writeFile(wbInvalid, path.join(__dirname, 'pedido_con_errores.xlsx'));

// 3. Crear pedido_tildes_y_enie.csv con UTF-8 BOM
const csvContent = "\uFEFF" + [
  'Talla,Nombre,Numero,Tipo,Observaciones',
  '28,SEBASTIÁN,1,COMPLETO,Portero',
  '28,CAÑETE,2,COMPLETO,Defensa',
  '30,ÁNGEL,5,CAMISETA,Medio',
  '32,MARTÍN,11,COMPLETO,Delantero'
].join('\r\n');

fs.writeFileSync(path.join(__dirname, 'pedido_tildes_y_enie.csv'), csvContent, 'utf8');

console.log('Fixtures generated successfully.');
