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

function stripInvalidXmlCharacters(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function escapeSvgText(value: string): string {
  return stripInvalidXmlCharacters(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeSvgAttribute(value: string): string {
  return escapeSvgText(value)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function safeScale(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0.05, value as number) : 1;
}

function safeCoordinate(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function safePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeFontFamily(value: string | undefined): string {
  const clean = stripInvalidXmlCharacters(value || '')
    .replace(/[^\p{L}\p{N}\s_.-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean || 'Bebas Neue';
}

function normalizeColor(value: string | undefined, fallback: string): string {
  const clean = stripInvalidXmlCharacters(value || '').trim();
  return /^(?:#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([0-9.,%\s+-]+\)|[a-z]+)$/i.test(clean)
    ? clean
    : fallback;
}

function normalizeText(value: string): string {
  return stripInvalidXmlCharacters(value || '').trim().toUpperCase();
}

function textAnchorFor(rule: DynamicPlaceholderRule): 'middle' | 'start' | 'end' {
  if (rule.textAlign === 'left') return 'start';
  if (rule.textAlign === 'right') return 'end';
  return 'middle';
}

function formatSvgNumber(value: number, decimals = 4): string {
  const rounded = Number(value.toFixed(decimals));
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

function buildStrokeAttributes(rule: DynamicPlaceholderRule): string {
  const strokeWidth = Number.isFinite(rule.strokeWidthMm)
    ? Math.max(0, rule.strokeWidthMm as number)
    : 0;
  if (!rule.strokeColor || strokeWidth <= 0) return '';

  return [
    `stroke="${escapeSvgAttribute(normalizeColor(rule.strokeColor, '#000000'))}"`,
    `stroke-width="${formatSvgNumber(strokeWidth)}"`,
    'stroke-linejoin="round"',
    'stroke-miterlimit="4"',
    'paint-order="stroke fill"',
  ].join(' ');
}

function calculateCurrentTextWidth(text: string, fontSizeMm: number): number {
  return Math.max(0.1, estimateTextWidthMm(text, fontSizeMm));
}

function calculateVisualTextWidth(
  text: string,
  fontSizeMm: number,
  autoScaleX: number,
  customScaleX: number
): number {
  return calculateCurrentTextWidth(text, fontSizeMm) * autoScaleX * customScaleX;
}

/**
 * Kept as explicit text instead of pretending to contain vector outlines.
 * textLength fixes the physical width in Illustrator even when it substitutes
 * a missing font; converting arbitrary user-selected fonts to paths requires
 * the original font file, which is not available synchronously here.
 */
function buildSvgText(
  text: string,
  rule: DynamicPlaceholderRule,
  fontSizeMm: number,
  visualWidthMm: number,
  customScaleY: number
): string {
  const safeText = escapeSvgText(text);
  const fontFamily = escapeSvgAttribute(normalizeFontFamily(rule.fontFamily));
  const fillColor = escapeSvgAttribute(normalizeColor(rule.fillColor, '#ffffff'));
  const strokeAttrs = buildStrokeAttributes(rule);
  const anchorX = safeCoordinate(rule.anchorX);
  const anchorY = safeCoordinate(rule.anchorY);

  return `
    <g transform="translate(${formatSvgNumber(anchorX)} ${formatSvgNumber(anchorY)})">
      <g transform="scale(1 ${formatSvgNumber(customScaleY)})">
        <text
          x="0"
          y="0"
          font-family="'${fontFamily}', Impact, 'Arial Narrow', Arial, sans-serif"
          font-size="${formatSvgNumber(fontSizeMm)}"
          font-weight="700"
          font-style="normal"
          font-variant="normal"
          letter-spacing="0"
          text-anchor="${textAnchorFor(rule)}"
          textLength="${formatSvgNumber(Math.max(0.1, visualWidthMm))}"
          lengthAdjust="spacingAndGlyphs"
          dy="0.35em"
          text-rendering="geometricPrecision"
          fill="${fillColor}"
          ${strokeAttrs}
        >${safeText}</text>
      </g>
    </g>
  `.trim();
}

/*
 * Calculates the natural width using a deterministic sports-font metric map.
 * This value becomes an explicit SVG textLength, so browsers and Illustrator
 * agree on physical width despite minor font-engine differences.
 */
function normalizedMinimumScale(value: number | undefined): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0.05, value as number)) : 0.6;
}

function normalizedMaxWidth(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalizedMinimumFontSize(value: number, defaultSize: number): number {
  const safe = safePositive(value, Math.min(defaultSize, 1));
  return Math.min(safe, defaultSize);
}

function normalizedDefaultFontSize(value: number): number {
  return safePositive(value, 1);
}

function escapedWarningText(value: string): string {
  return stripInvalidXmlCharacters(value);
}

function createOverflowWarning(cleanText: string, maxWidth: number): string {
  return `El nombre "${escapedWarningText(cleanText)}" supera el ancho máximo de ${maxWidth.toFixed(0)} mm tras compresión máxima.`;
}

/**
 * Calcula el ancho natural de una cadena de texto en milímetros a un tamaño de fuente dado
 */
export function estimateTextWidthMm(text: string, fontSizeMm: number): number {
  if (!text || !Number.isFinite(fontSizeMm) || fontSizeMm <= 0) return 0;
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
  const cleanText = normalizeText(text);
  const defaultFontSize = normalizedDefaultFontSize(rule.defaultFontSizeMm);
  const minimumFontSize = normalizedMinimumFontSize(rule.minFontSizeMm, defaultFontSize);
  const naturalWidth = estimateTextWidthMm(cleanText, defaultFontSize);
  const maxWidth = normalizedMaxWidth(rule.maxWidthMm);
  const minScale = normalizedMinimumScale(rule.minScaleFactor);

  let currentFontSize = defaultFontSize;
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
    } else {
      // 2. Si la compresión horizontal sola supera el límite, reducir además fontSize progresivamente
      scaleX = minScale;
      const widthWithMinScale = naturalWidth * minScale;
      const fontReductionFactor = maxWidth / widthWithMinScale;
      currentFontSize = Math.max(defaultFontSize * fontReductionFactor, minimumFontSize);
      const fittedWidth = estimateTextWidthMm(cleanText, currentFontSize) * scaleX;

      if (fittedWidth > maxWidth * 1.02) {
        hasOverflowWarning = true;
        warningMessage = createOverflowWarning(cleanText, maxWidth);
      }
    }
  }

  const effectiveCustomScaleX = safeScale(rule.customScaleX);
  const effectiveCustomScaleY = safeScale(rule.customScaleY);
  const visualWidth = calculateVisualTextWidth(
    cleanText,
    currentFontSize,
    scaleX,
    effectiveCustomScaleX
  );
  const visualHeight = currentFontSize * effectiveCustomScaleY;
  const svgContent = buildSvgText(
    cleanText,
    rule,
    currentFontSize,
    visualWidth,
    effectiveCustomScaleY
  );

  return {
    text: cleanText,
    fittedWidthMm: visualWidth,
    fittedHeightMm: visualHeight,
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
