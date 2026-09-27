import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Coordenadas Bézier realistas de moldes textiles en milímetros
const svgContent = `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600.00mm" height="1200.00mm" viewBox="0 0 1600.00 1200.00">
  <defs>
    <style>
      .pat { fill: none; stroke: #22c55e; stroke-width: 1.5; }
    </style>
  </defs>

  <!-- GRUPO TALLA 28 -->
  <g id="TALLA_28">
    <!-- DELANTERO T28: ~460mm ancho x 620mm alto -->
    <path id="T28_DELANTERO" class="pat" d="M 50,50 L 150,50 C 180,90 220,90 250,50 L 350,50 C 340,110 320,180 290,220 L 310,650 L 90,650 L 110,220 C 80,180 60,110 50,50 Z" />
    
    <!-- ESPALDA T28: ~460mm ancho x 640mm alto -->
    <path id="T28_ESPALDA" class="pat" d="M 400,50 L 500,50 C 530,65 570,65 600,50 L 700,50 C 690,110 670,180 640,220 L 660,670 L 440,670 L 460,220 C 430,180 410,110 400,50 Z" />

    <!-- MANGA IZQUIERDA T28: ~240mm ancho x 200mm alto -->
    <path id="T28_MANGA_I" class="pat" d="M 750,50 C 800,20 860,20 910,50 L 890,240 L 770,240 Z" />

    <!-- MANGA DERECHA T28: ~240mm ancho x 200mm alto -->
    <path id="T28_MANGA_D" class="pat" d="M 950,50 C 1000,20 1060,20 1110,50 L 1090,240 L 970,240 Z" />

    <!-- SHORT FRENTE T28: ~300mm ancho x 420mm alto -->
    <path id="T28_SHORT_F" class="pat" d="M 750,300 L 980,300 L 990,480 C 950,500 930,550 920,700 L 760,680 L 750,300 Z" />

    <!-- SHORT ESPALDA T28: ~320mm ancho x 440mm alto -->
    <path id="T28_SHORT_A" class="pat" d="M 1050,300 L 1300,300 L 1310,480 C 1270,510 1250,570 1240,720 L 1060,700 L 1050,300 Z" />
  </g>

  <!-- GRUPO TALLA 30 -->
  <g id="TALLA_30">
    <!-- DELANTERO T30: ~480mm ancho x 650mm alto -->
    <path id="T30_DELANTERO" class="pat" d="M 50,700 L 160,700 C 190,740 230,740 260,700 L 370,700 C 360,760 340,830 310,870 L 330,1330 L 90,1330 L 110,870 C 80,830 60,760 50,700 Z" />
    
    <!-- ESPALDA T30 -->
    <path id="T30_ESPALDA" class="pat" d="M 420,700 L 530,700 C 560,715 600,715 630,700 L 740,700 C 730,760 710,830 680,870 L 700,1350 L 460,1350 L 480,870 C 450,830 430,760 420,700 Z" />
  </g>

  <!-- PIEZA NO ASIGNADA (para probar configuración manual en UI) -->
  <path id="PIEZA_SUELTA_ESPALDA_EXTRA" class="pat" d="M 800,750 L 1000,750 L 1000,950 L 800,950 Z" />
</svg>`;

const outputPath = path.join(__dirname, 'moldes_futbol_2026.svg');
fs.writeFileSync(outputPath, svgContent, 'utf8');

console.log('Pattern fixture generated successfully at:', outputPath);
