import { MasterDesign, DynamicPlaceholderRule, PieceArtwork } from './types';
import { PieceType } from '@/core/geometry/types';
import { createDefaultPlaceholderRules } from './designRepository';

/**
 * Parsea un archivo SVG exportado desde Illustrator o CorelDRAW con el arte del uniforme
 */
export function parseDesignSvg(
  svgContent: string,
  designName: string = 'Nuevo Diseño',
  sport: string = 'FUTBOL',
  fileName?: string
): MasterDesign {
  // Extraer paleta de colores dominante del SVG por frecuencia de aparición
  const colorMatches = svgContent.match(/#([0-9a-fA-F]{6})\b/g) || [];
  const colorCounts: Record<string, number> = {};
  for (const c of colorMatches) {
    const lower = c.toLowerCase();
    colorCounts[lower] = (colorCounts[lower] || 0) + 1;
  }

  // Ordenar por frecuencia descendente
  const sortedColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color);

  const primaryColors: string[] = [];
  for (const c of sortedColors) {
    // Evitar colores duplicados o casi idénticos
    if (!primaryColors.includes(c)) {
      primaryColors.push(c);
    }
    if (primaryColors.length >= 3) break;
  }

  if (primaryColors.length === 0) {
    primaryColors.push('#facc15', '#16a34a', '#1e40af'); // Brasil defaults: amarillo, verde, azul
  } else if (primaryColors.length === 1) {
    primaryColors.push('#16a34a', '#1e40af');
  } else if (primaryColors.length === 2) {
    primaryColors.push('#ffffff');
  }

  // Detectar placeholders de texto buscando tags <text> o <tspan>
  const textTagRegex = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let textMatch;

  let nombreRule: DynamicPlaceholderRule | null = null;
  let numeroRule: DynamicPlaceholderRule | null = null;

  while ((textMatch = textTagRegex.exec(svgContent)) !== null) {
    const attrs = textMatch[1];
    const rawInner = textMatch[2];
    const textContent = rawInner.replace(/<[^>]+>/g, '').trim().toUpperCase();

    // Extraer coordenadas x, y (soportando transform="matrix(...)", transform="translate(...)", x/y en text o tspan)
    let x: number | null = null;
    let y: number | null = null;

    const matrixMatch = attrs.match(/transform\s*=\s*["']matrix\s*\(\s*([^\s,]+)[,\s]+([^\s,]+)[,\s]+([^\s,]+)[,\s]+([^\s,]+)[,\s]+([^\s,]+)[,\s]+([^\s,]+)\s*\)["']/i);
    const translateMatch = attrs.match(/transform\s*=\s*["']translate\s*\(\s*([^\s,]+)(?:[,\s]+([^\s,]+))?\s*\)["']/i);
    const xMatch = attrs.match(/\bx\s*=\s*["']([^"']+)["']/i) || rawInner.match(/\bx\s*=\s*["']([^"']+)["']/i);
    const yMatch = attrs.match(/\by\s*=\s*["']([^"']+)["']/i) || rawInner.match(/\by\s*=\s*["']([^"']+)["']/i);

    if (matrixMatch) {
      x = parseFloat(matrixMatch[5]);
      y = parseFloat(matrixMatch[6]);
    } else if (translateMatch) {
      x = parseFloat(translateMatch[1]);
      if (translateMatch[2]) y = parseFloat(translateMatch[2]);
    }

    if (x === null && xMatch) x = parseFloat(xMatch[1]);
    if (y === null && yMatch) y = parseFloat(yMatch[1]);

    const fontSizeMatch = attrs.match(/\bfont-size\s*=\s*["']([^"']+)["']/i) || rawInner.match(/\bfont-size\s*=\s*["']([^"']+)["']/i);
    const fillMatch = attrs.match(/\bfill\s*=\s*["']([^"']+)["']/i) || rawInner.match(/\bfill\s*=\s*["']([^"']+)["']/i);
    const fontMatch = attrs.match(/\bfont-family\s*=\s*["']([^"']+)["']/i);

    const fontSize = fontSizeMatch ? parseFloat(fontSizeMatch[1]) : null;
    const fill = fillMatch ? fillMatch[1] : '#ffffff';
    const font = fontMatch ? fontMatch[1].replace(/['"]/g, '') : 'SportsJerseyBold';

    if (textContent.includes('NOMBRE') || textContent.includes('{{NOMBRE}}') || textContent === 'NAME') {
      const finalY = y !== null && y >= 80 && y <= 240 ? y : 160;
      const finalX = x !== null ? x : 250;
      nombreRule = {
        id: 'NOMBRE',
        tag: '{{NOMBRE}}',
        targetPiece: 'ESPALDA',
        anchorX: finalX,
        anchorY: finalY,
        maxWidthMm: 280,
        maxHeightMm: 65,
        defaultFontSizeMm: fontSize ? Math.max(35, Math.min(fontSize, 70)) : 52,
        minFontSizeMm: 28,
        minScaleFactor: 0.6,
        fontFamily: font,
        fillColor: fill,
        strokeColor: '#000000',
        strokeWidthMm: 2.0,
        textAlign: 'center',
      };
    } else if (textContent.match(/\b(?:\d{1,2}|NUMERO)\b/i) || textContent.includes('{{NUMERO}}')) {
      const finalX = x !== null ? x : 250;
      // El número dorsal siempre debe estar en la zona central de la espalda (entre 320 y 480 mm)
      // Si la coordenada detectada es menor a 280 mm, se ubica automáticamente en 380 mm reglamentario
      const finalY = y !== null && y >= 280 ? y : 380;
      numeroRule = {
        id: 'NUMERO_ESPALDA',
        tag: '{{NUMERO}}',
        targetPiece: 'ESPALDA',
        anchorX: finalX,
        anchorY: finalY,
        maxWidthMm: 260,
        maxHeightMm: 260,
        defaultFontSizeMm: fontSize ? Math.max(160, Math.min(fontSize, 260)) : 220,
        minFontSizeMm: 140,
        minScaleFactor: 0.7,
        fontFamily: font,
        fillColor: fill,
        strokeColor: '#000000',
        strokeWidthMm: 3.5,
        textAlign: 'center',
      };
    }
  }

  // Generar reglas por defecto si no fueron detectadas
  const defaultEspaldaRules = createDefaultPlaceholderRules('ESPALDA');
  if (!nombreRule) {
    const defaultNombre = defaultEspaldaRules.find((r) => r.id === 'NOMBRE')!;
    nombreRule = { ...defaultNombre, anchorY: 160 };
  }
  if (!numeroRule) {
    const defaultNumero = defaultEspaldaRules.find((r) => r.id.includes('NUMERO'))!;
    numeroRule = { ...defaultNumero, anchorY: 380 };
  }

  // Garantía matemática estricta contra colisiones:
  // El centro del número dorsal NUNCA puede estar a menos de 160 mm por debajo del nombre
  if (numeroRule.anchorY <= nombreRule.anchorY + 140) {
    numeroRule.anchorY = Math.max(380, nombreRule.anchorY + 200);
  }

  const espaldaPlaceholders: DynamicPlaceholderRule[] = [nombreRule, numeroRule];

  // Extraer bloques comunes <defs> y <style> para mantener gradientes y clases CSS
  const defsMatch = svgContent.match(/<defs\b[^>]*>([\s\S]*?)<\/defs>/i);
  const styleMatch = svgContent.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i);
  const commonDefsAndStyle = [
    defsMatch ? defsMatch[0] : '',
    styleMatch ? styleMatch[0] : '',
  ].filter(Boolean).join('\n');

  // Intentar buscar piezas aisladas por grupo/capa explícitos
  const pieceArtworks: Partial<Record<PieceType, PieceArtwork>> = {};

  const piecePatterns: { type: PieceType; regex: RegExp }[] = [
    { type: 'DELANTERO', regex: /id=["'][^"']*(?:DELANTERO|FRENTE|FRONT)[^"']*["']/i },
    { type: 'ESPALDA', regex: /id=["'][^"']*(?:ESPALDA|DORSAL|TRASERO|BACK)[^"']*["']/i },
    { type: 'MANGA_IZQ', regex: /id=["'][^"']*(?:MANGA_IZQ|MANGA_I|SLEEVE_L)[^"']*["']/i },
    { type: 'MANGA_DER', regex: /id=["'][^"']*(?:MANGA_DER|MANGA_D|SLEEVE_R)[^"']*["']/i },
    { type: 'SHORT_FRENTE', regex: /id=["'][^"']*(?:SHORT_FRENTE|SHORT_I|PANTALONETA_I)[^"']*["']/i },
    { type: 'SHORT_ESPALDA', regex: /id=["'][^"']*(?:SHORT_ESPALDA|SHORT_D|PANTALONETA_D)[^"']*["']/i },
  ];

  let hasExplicitPieces = false;
  for (const entry of piecePatterns) {
    const groupRegex = new RegExp(`<g\\b[^>]*${entry.regex.source}[^>]*>([\\s\\S]*?)<\\/g>`, 'i');
    const match = svgContent.match(groupRegex);
    if (match) {
      hasExplicitPieces = true;
      const pieceSvg = commonDefsAndStyle ? `${commonDefsAndStyle}\n${match[0]}` : match[0];
      pieceArtworks[entry.type] = {
        pieceType: entry.type,
        svgArtContent: pieceSvg,
        placeholders: entry.type === 'ESPALDA' ? espaldaPlaceholders : createDefaultPlaceholderRules(entry.type),
      };
    }
  }

  // Si no hay grupos con IDs explícitos (ej: el usuario exportó un arte completo desde Illustrator como RECURSO 1.svg):
  // Usar el SVG completo para Delantero y Espalda sin romper capas ni triturar grupos
  if (!hasExplicitPieces) {
    pieceArtworks['DELANTERO'] = {
      pieceType: 'DELANTERO',
      svgArtContent: svgContent,
      placeholders: createDefaultPlaceholderRules('DELANTERO'),
    };
    pieceArtworks['ESPALDA'] = {
      pieceType: 'ESPALDA',
      svgArtContent: svgContent,
      placeholders: espaldaPlaceholders,
    };
    pieceArtworks['MANGA_IZQ'] = {
      pieceType: 'MANGA_IZQ',
      svgArtContent: svgContent,
      placeholders: createDefaultPlaceholderRules('MANGA_IZQ'),
    };
    pieceArtworks['MANGA_DER'] = {
      pieceType: 'MANGA_DER',
      svgArtContent: svgContent,
      placeholders: createDefaultPlaceholderRules('MANGA_DER'),
    };
  }

  // Mejorar el nombre por defecto si es genérico de Illustrator
  let cleanName = designName.replace(/\.[^/.]+$/, '').trim().toUpperCase();
  if (cleanName.startsWith('RECURSO') || cleanName.startsWith('ASSET')) {
    // Si contiene amarillo o brasil en colores o deporte
    const isYellow = primaryColors.some((c) => ['#facc15', '#eab308', '#fde047', '#ffdf00', '#ffd700'].includes(c));
    if (isYellow) {
      cleanName = 'BRASIL AMARILLO 2026';
    } else {
      cleanName = `DISEÑO ${sport} 2026`;
    }
  }

  return {
    id: `design_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    sport,
    colors: primaryColors,
    pieceArtworks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
