import { DynamicPlaceholderRule, TextFittingResult } from '@/modules/designs/types';

/**
 * Anchos relativos de glifos en tipografía deportiva condensada estándar (unidades de 1/1000 em)
 */
const GLYPH_WIDTH_MAP: Record<string, number> = {
  ' ': 350,
  'A': 650, 'Á': 650, 'B': 620, 'C': 620, 'Ç': 620, 'D': 650, 'E': 580, 'É': 580,
  'F': 550, 'G': 650, 'H': 650, 'I': 300, 'Í': 300, 'J': 450, 'K': 620, 'L': 520,
  'M': 800, 'N': 650, 'Ñ': 650, 'O': 680, 'Ó': 680, 'P': 600, 'Q': 680, 'R': 620,
  'S': 580, 'T': 580, 'U': 650, 'Ú': 650, 'Ü': 650, 'V': 620, 'W': 850, 'X': 620,
  'Y': 600, 'Z': 580,
  '0': 620, '1': 420, '2': 600, '3': 600, '4': 620, '5': 600, '6': 620, '7': 580,
  '8': 620, '9': 620,
  '-': 380, '.': 300, '\'': 250, '#': 650,
};

/**
 * Calcula el ancho natural de una cadena de texto en milímetros a un tamaño de fuente dado
 */
export function estimateTextWidthMm(text: string, fontSizeMm: number): number {
  if (!text) return 0;
  const upper = text.toUpperCase();
  let totalEm = 0;

  for (let i = 0; i < upper.length; i++) {
    const char = upper[i];
    const emWidth = GLYPH_WIDTH_MAP[char] || 600;
    totalEm += emWidth;
  }

  // Interletraje sutil de 50 em
  totalEm += (upper.length - 1) * 50;

  return (totalEm / 1000.0) * fontSizeMm;
}

/**
 * Algoritmo de auto-ajuste y compresión horizontal para nombres y números deportivos
 */
export function computeTextFitting(
  text: string,
  rule: DynamicPlaceholderRule
): TextFittingResult {
  const cleanText = (text || '').trim().toUpperCase();
  const naturalWidth = estimateTextWidthMm(cleanText, rule.defaultFontSizeMm);
  const maxWidth = rule.maxWidthMm;
  const minScale = rule.minScaleFactor || 0.60;

  let fittedWidth = naturalWidth;
  let fittedHeight = rule.defaultFontSizeMm;
  let currentFontSize = rule.defaultFontSizeMm;
  let scaleX = 1.0;
  let isCompressed = false;
  let hasOverflowWarning = false;
  let warningMessage: string | undefined = undefined;

  if (naturalWidth > maxWidth && maxWidth > 0) {
    isCompressed = true;
    const requiredScale = maxWidth / naturalWidth;

    if (requiredScale >= minScale) {
      // 1. Compresión horizontal proporcional directa (mantiene altura visual)
      scaleX = requiredScale;
      fittedWidth = naturalWidth * scaleX;
    } else {
      // 2. Si la compresión horizontal sola supera el límite, reducir además fontSize progresivamente
      scaleX = minScale;
      const widthWithMinScale = naturalWidth * minScale;
      const fontReductionFactor = maxWidth / widthWithMinScale;
      currentFontSize = Math.max(rule.defaultFontSizeMm * fontReductionFactor, rule.minFontSizeMm);
      fittedHeight = currentFontSize;
      fittedWidth = estimateTextWidthMm(cleanText, currentFontSize) * scaleX;

      if (fittedWidth > maxWidth * 1.02) {
        hasOverflowWarning = true;
        warningMessage = `El nombre "${cleanText}" supera el ancho máximo de ${maxWidth.toFixed(0)} mm tras compresión máxima.`;
      }
    }
  }

  // Generar elemento SVG vectorial
  const strokeAttrs = rule.strokeColor && rule.strokeWidthMm
    ? `stroke="${rule.strokeColor}" stroke-width="${rule.strokeWidthMm}" stroke-linejoin="round" paint-order="stroke fill"`
    : '';

  const svgContent = `
    <g transform="translate(${rule.anchorX}, ${rule.anchorY})">
      <g transform="scale(${scaleX.toFixed(4)}, 1)">
        <text
          x="0"
          y="0"
          font-family="${rule.fontFamily}, 'Impact', 'Arial Black', sans-serif"
          font-size="${currentFontSize.toFixed(2)}"
          font-weight="bold"
          text-anchor="${rule.textAlign === 'center' ? 'middle' : rule.textAlign === 'left' ? 'start' : 'end'}"
          dominant-baseline="central"
          fill="${rule.fillColor}"
          ${strokeAttrs}
        >${cleanText}</text>
      </g>
    </g>
  `.trim();

  return {
    text: cleanText,
    fittedWidthMm: fittedWidth,
    fittedHeightMm: fittedHeight,
    fontSizeMm: currentFontSize,
    scaleX,
    isCompressed,
    hasOverflowWarning,
    warningMessage,
    svgContent,
  };
}

/**
 * Reemplaza los placeholders dinámicos en una plantilla SVG con los datos del jugador
 */
export function applyPlaceholdersToArtwork(
  svgTemplate: string,
  playerName: string,
  playerNumber: string,
  rules: DynamicPlaceholderRule[]
): string {
  let resultSvg = svgTemplate;

  // 1. Inyectar o reemplazar {{NOMBRE}}
  const nameRule = rules.find((r) => r.id === 'NOMBRE' || r.tag === '{{NOMBRE}}');
  if (nameRule) {
    const fitting = computeTextFitting(playerName, nameRule);
    if (resultSvg.includes('{{NOMBRE}}')) {
      resultSvg = resultSvg.replace('{{NOMBRE}}', fitting.svgContent);
    } else if (resultSvg.includes('</svg>')) {
      resultSvg = resultSvg.replace('</svg>', `${fitting.svgContent}\n</svg>`);
    } else {
      resultSvg += `\n${fitting.svgContent}`;
    }
  }

  // 2. Inyectar o reemplazar {{NUMERO}}
  const numberRule = rules.find((r) => r.id.includes('NUMERO') || r.tag === '{{NUMERO}}');
  if (numberRule) {
    const fitting = computeTextFitting(playerNumber, numberRule);
    if (resultSvg.includes('{{NUMERO}}')) {
      resultSvg = resultSvg.replace('{{NUMERO}}', fitting.svgContent);
    } else if (resultSvg.includes('</svg>')) {
      resultSvg = resultSvg.replace('</svg>', `${fitting.svgContent}\n</svg>`);
    } else {
      resultSvg += `\n${fitting.svgContent}`;
    }
  }

  // 3. Eliminar cualquier <text> estático residual de muestra para que no se superponga
  resultSvg = resultSvg.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi, (fullMatch, _attrs, inner) => {
    const plain = inner.replace(/<[^>]+>/g, '').trim().toUpperCase();
    if (
      plain.match(/^\d{1,2}$/) ||
      plain.includes('NUMERO') ||
      plain.includes('NOMBRE') ||
      plain.includes('NAME') ||
      plain.includes('JUGADOR') ||
      plain.includes('PLAYER') ||
      plain.includes('{{')
    ) {
      if (
        plain === (playerName || '').trim().toUpperCase() ||
        plain === (playerNumber || '').trim().toUpperCase()
      ) {
        return fullMatch;
      }
      return '';
    }
    return fullMatch;
  });

  return resultSvg;
}
