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
  // Extraer paleta de colores dominante del SVG
  const colorMatches = svgContent.match(/#([0-9a-fA-F]{6})\b/g) || [];
  const uniqueColors = Array.from(new Set(colorMatches.map((c) => c.toLowerCase())));
  const primaryColors = uniqueColors.slice(0, 3);
  if (primaryColors.length === 0) {
    primaryColors.push('#ea580c', '#0284c7', '#ffffff');
  }

  // Detectar placeholders de texto buscando tags <text>
  const textTagRegex = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let textMatch;

  let nombreRule: DynamicPlaceholderRule | null = null;
  let numeroRule: DynamicPlaceholderRule | null = null;

  while ((textMatch = textTagRegex.exec(svgContent)) !== null) {
    const attrs = textMatch[1];
    const textContent = textMatch[2].replace(/<[^>]+>/g, '').trim().toUpperCase();

    // Extraer coordenadas x, y (soportando tanto atributos x,y como transform="matrix(...)")
    let x = 250;
    let y = 180;
    const matrixMatch = attrs.match(/transform\s*=\s*["']matrix\s*\(\s*([^\s,]+)[,\s]+([^\s,]+)[,\s]+([^\s,]+)[,\s]+([^\s,]+)[,\s]+([^\s,]+)[,\s]+([^\s,]+)\s*\)["']/i);
    if (matrixMatch) {
      x = parseFloat(matrixMatch[5]) || 250;
      y = parseFloat(matrixMatch[6]) || 180;
    } else {
      const xMatch = attrs.match(/\bx\s*=\s*["']([^"']+)["']/i);
      const yMatch = attrs.match(/\by\s*=\s*["']([^"']+)["']/i);
      if (xMatch) x = parseFloat(xMatch[1]);
      if (yMatch) y = parseFloat(yMatch[1]);
    }
    const fontSizeMatch = attrs.match(/\bfont-size\s*=\s*["']([^"']+)["']/i);
    const fillMatch = attrs.match(/\bfill\s*=\s*["']([^"']+)["']/i);
    const fontMatch = attrs.match(/\bfont-family\s*=\s*["']([^"']+)["']/i);

    const fontSize = fontSizeMatch ? parseFloat(fontSizeMatch[1]) : 55;
    const fill = fillMatch ? fillMatch[1] : '#ffffff';
    const font = fontMatch ? fontMatch[1].replace(/['"]/g, '') : 'SportsJerseyBold';

    if (textContent.includes('NOMBRE') || textContent.includes('{{NOMBRE}}')) {
      nombreRule = {
        id: 'NOMBRE',
        tag: '{{NOMBRE}}',
        targetPiece: 'ESPALDA',
        anchorX: x,
        anchorY: y,
        maxWidthMm: 280,
        maxHeightMm: 65,
        defaultFontSizeMm: Math.max(30, fontSize),
        minFontSizeMm: 28,
        minScaleFactor: 0.6,
        fontFamily: font,
        fillColor: fill,
        strokeColor: '#000000',
        strokeWidthMm: 2.0,
        textAlign: 'center',
      };
    } else if (textContent.match(/\b(?:\d{1,2}|NUMERO)\b/i)) {
      numeroRule = {
        id: 'NUMERO_ESPALDA',
        tag: '{{NUMERO}}',
        targetPiece: 'ESPALDA',
        anchorX: x,
        anchorY: y,
        maxWidthMm: 260,
        maxHeightMm: 260,
        defaultFontSizeMm: Math.max(80, fontSize),
        minFontSizeMm: 120,
        minScaleFactor: 0.7,
        fontFamily: font,
        fillColor: fill,
        strokeColor: '#000000',
        strokeWidthMm: 3.5,
        textAlign: 'center',
      };
    }
  }

  // Generar reglas de placeholder combinadas (detectadas o por defecto)
  const defaultEspaldaRules = createDefaultPlaceholderRules('ESPALDA');
  const espaldaPlaceholders: DynamicPlaceholderRule[] = [
    nombreRule || defaultEspaldaRules.find((r) => r.id === 'NOMBRE')!,
    numeroRule || defaultEspaldaRules.find((r) => r.id.includes('NUMERO'))!,
  ].filter(Boolean);

  // Intentar buscar piezas aisladas por grupo o usar el SVG completo
  const pieceArtworks: Partial<Record<PieceType, PieceArtwork>> = {};

  const pieceTypes: PieceType[] = [
    'DELANTERO',
    'ESPALDA',
    'MANGA_IZQ',
    'MANGA_DER',
    'SHORT_FRENTE',
    'SHORT_ESPALDA',
  ];

  for (const pt of pieceTypes) {
    // Buscar si existe un grupo <g id="...PT...">
    const groupRegex = new RegExp(`<g\\b[^>]*id=["'][^"']*${pt}[^"']*["'][^>]*>([\\s\\S]*?)<\\/g>`, 'i');
    const groupMatch = svgContent.match(groupRegex);

    if (groupMatch) {
      pieceArtworks[pt] = {
        pieceType: pt,
        svgArtContent: groupMatch[1],
        placeholders: pt === 'ESPALDA' ? espaldaPlaceholders : createDefaultPlaceholderRules(pt),
      };
    } else {
      // Si no hay grupos separados, usar el SVG completo del modelo
      pieceArtworks[pt] = {
        pieceType: pt,
        svgArtContent: svgContent,
        placeholders: pt === 'ESPALDA' ? espaldaPlaceholders : createDefaultPlaceholderRules(pt),
      };
    }
  }

  const cleanName = designName.replace(/\.[^/.]+$/, '').toUpperCase();

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
