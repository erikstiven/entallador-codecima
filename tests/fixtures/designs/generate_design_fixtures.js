import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Arte vectorial para Delantero y Espalda de Holanda con degradado y placeholders
const holandaSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600mm" height="800mm" viewBox="0 0 600 800">
  <defs>
    <linearGradient id="holandaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>
  </defs>
  <!-- Fondo base del arte -->
  <rect width="600" height="800" fill="url(#holandaGrad)" />
  <!-- Rayas sutiles geométricas -->
  <path d="M 0,200 L 600,300 L 600,350 L 0,250 Z" fill="#0284c7" opacity="0.35" />
  <path d="M 0,400 L 600,500 L 600,550 L 0,450 Z" fill="#ffffff" opacity="0.25" />
  <!-- Identificadores de placeholders para reemplazo -->
  {{NOMBRE}}
  {{NUMERO}}
</svg>`;

fs.writeFileSync(path.join(__dirname, 'holanda_naranja_arte.svg'), holandaSvg, 'utf8');
console.log('Design fixture generated successfully.');
