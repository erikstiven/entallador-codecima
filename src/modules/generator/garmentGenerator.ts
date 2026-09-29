import { OrderItem } from '@/modules/orders/types';
import { PatternSet, PatternPiece, PieceType } from '@/modules/patterns/types';
import { MasterDesign } from '@/modules/designs/types';
import { 
  GeneratedPiece, 
  GenerationConfig, 
  GenerationResult, 
  PieceLabelInfo 
} from './types';
import { computeBoundingBox, calculatePolygonArea } from '@/core/geometry/transform';
import { computeTextFitting, applyPlaceholdersToArtwork } from '@/core/fonts/textVectorEngine';
import { normalizeSizeName } from '@/modules/orders/orderValidator';

const DEFAULT_CONFIG: GenerationConfig = {
  includeLabels: true,
  labelDistanceMm: 6.0,
  labelFontSizeMm: 5.0,
  labelColor: '#94a3b8',
};

/**
 * Determina qué tipos de piezas requiere un jugador según su tipo de prenda
 */
function getRequiredPieceTypes(garmentType: string): PieceType[] {
  switch (garmentType) {
    case 'CAMISETA':
      return [
        'DELANTERO',
        'DELANTERO_V',
        'DELANTERO_REDONDO',
        'ESPALDA',
        'MANGA_IZQ',
        'MANGA_DER',
        'CUELLO',
      ];
    case 'SHORT':
      return [
        'PANTALONETA_IZQ',
        'PANTALONETA_DER',
        'SHORT_FRENTE',
        'SHORT_ESPALDA',
      ];
    case 'COMPLETO':
    default:
      return [
        'DELANTERO',
        'DELANTERO_V',
        'DELANTERO_REDONDO',
        'ESPALDA',
        'MANGA_IZQ',
        'MANGA_DER',
        'CUELLO',
        'PANTALONETA_IZQ',
        'PANTALONETA_DER',
        'SHORT_FRENTE',
        'SHORT_ESPALDA',
      ];
  }
}

/**
 * Genera el ensamble vectorial completo de cada prenda uniendo Molde + Diseño + Jugador
 */
export function generateGarmentPieces(
  orderItems: OrderItem[],
  patternSet: PatternSet,
  masterDesign: MasterDesign,
  customConfig: Partial<GenerationConfig> = {}
): GenerationResult {
  const config: GenerationConfig = { ...DEFAULT_CONFIG, ...customConfig };
  const generatedPieces: GeneratedPiece[] = [];
  const warnings: string[] = [];

  const bySize: Record<string, number> = {};
  const byPieceType: Record<string, number> = {};

  let totalGarmentsCount = 0;

  for (const orderItem of orderItems) {
    if (!orderItem.isValid) {
      warnings.push(`Fila #${orderItem.rowNumber} (${orderItem.playerName}): Se omitió por contener errores de validación.`);
      continue;
    }

    const targetSize = normalizeSizeName(orderItem.sizeName).toUpperCase();

    // 1. Buscar talla correspondiente en el conjunto de moldes
    const sizeObj = patternSet.sizes.find(
      (s) => normalizeSizeName(s.sizeName).toUpperCase() === targetSize
    );

    if (!sizeObj || sizeObj.pieces.length === 0) {
      warnings.push(`Jugador ${orderItem.playerName}: Talla "${orderItem.sizeName}" no tiene piezas disponibles en el molde.`);
      continue;
    }

    totalGarmentsCount += orderItem.quantity;
    const requiredTypes = getRequiredPieceTypes(orderItem.garmentType);

    // Filtrar piezas del molde que corresponden al tipo de uniforme solicitado
    const allMatchingPieces = sizeObj.pieces.filter((p) =>
      requiredTypes.includes(p.pieceType)
    );

    // Si la talla contiene tanto DELANTERO_V como DELANTERO_REDONDO:
    // Seleccionar solo una variante de cuello para evitar duplicar el delantero:
    const delanterosDisponibles = allMatchingPieces.filter((p) =>
      p.pieceType === 'DELANTERO' || p.pieceType === 'DELANTERO_V' || p.pieceType === 'DELANTERO_REDONDO'
    );

    let chosenDelantero: PatternPiece | undefined;
    if (delanterosDisponibles.length > 1) {
      const wantsV = (orderItem.notes || '').toUpperCase().includes('V') || false;
      if (wantsV) {
        chosenDelantero = delanterosDisponibles.find((p) => p.pieceType === 'DELANTERO_V') || delanterosDisponibles[0];
      } else {
        chosenDelantero = delanterosDisponibles.find((p) => p.pieceType === 'DELANTERO_REDONDO') || delanterosDisponibles[0];
      }
    } else if (delanterosDisponibles.length === 1) {
      chosenDelantero = delanterosDisponibles[0];
    }

    const availablePieces = allMatchingPieces.filter((p) => {
      if (p.pieceType === 'DELANTERO' || p.pieceType === 'DELANTERO_V' || p.pieceType === 'DELANTERO_REDONDO') {
        return p.id === chosenDelantero?.id;
      }
      return true;
    });

    if (availablePieces.length === 0) {
      warnings.push(`Jugador ${orderItem.playerName}: No hay piezas de tipo "${orderItem.garmentType}" en la talla ${orderItem.sizeName}.`);
      continue;
    }

    // Si el molde solo tiene 1 manga dibujada, duplicar para producir ambas mangas (izquierda y derecha)
    const piecesToGenerate = [...availablePieces];
    const hasMangaIzq = availablePieces.some((p) => p.pieceType === 'MANGA_IZQ');
    const hasMangaDer = availablePieces.some((p) => p.pieceType === 'MANGA_DER');
    if (hasMangaIzq && !hasMangaDer && ['CAMISETA', 'COMPLETO'].includes(orderItem.garmentType)) {
      const mangaRef = availablePieces.find((p) => p.pieceType === 'MANGA_IZQ')!;
      piecesToGenerate.push({
        ...mangaRef,
        id: `${mangaRef.id}_der`,
        pieceType: 'MANGA_DER',
        pieceName: `${mangaRef.pieceName}_DER`,
      });
    } else if (hasMangaDer && !hasMangaIzq && ['CAMISETA', 'COMPLETO'].includes(orderItem.garmentType)) {
      const mangaRef = availablePieces.find((p) => p.pieceType === 'MANGA_DER')!;
      piecesToGenerate.push({
        ...mangaRef,
        id: `${mangaRef.id}_izq`,
        pieceType: 'MANGA_IZQ',
        pieceName: `${mangaRef.pieceName}_IZQ`,
      });
    }

    // Si la pantaloneta solo tiene 1 lado dibujado, duplicar para producir ambos lados (izq y der)
    const hasPantaIzq = piecesToGenerate.some((p) => p.pieceType === 'PANTALONETA_IZQ');
    const hasPantaDer = piecesToGenerate.some((p) => p.pieceType === 'PANTALONETA_DER');
    if (hasPantaIzq && !hasPantaDer && ['SHORT', 'COMPLETO'].includes(orderItem.garmentType)) {
      const pantaRef = piecesToGenerate.find((p) => p.pieceType === 'PANTALONETA_IZQ')!;
      piecesToGenerate.push({
        ...pantaRef,
        id: `${pantaRef.id}_der`,
        pieceType: 'PANTALONETA_DER',
        pieceName: `${pantaRef.pieceName}_DER`,
      });
    } else if (hasPantaDer && !hasPantaIzq && ['SHORT', 'COMPLETO'].includes(orderItem.garmentType)) {
      const pantaRef = piecesToGenerate.find((p) => p.pieceType === 'PANTALONETA_DER')!;
      piecesToGenerate.push({
        ...pantaRef,
        id: `${pantaRef.id}_izq`,
        pieceType: 'PANTALONETA_IZQ',
        pieceName: `${pantaRef.pieceName}_IZQ`,
      });
    }

    // Para cada pieza requerida, generar las variantes según la cantidad
    for (let q = 1; q <= orderItem.quantity; q++) {
      for (const patternPiece of piecesToGenerate) {
        const pieceType = patternPiece.pieceType;
        const maskId = `mask_${orderItem.id}_${patternPiece.id}_${q}`;
        const uniquePieceId = `gen_${orderItem.id}_${pieceType}_${q}_${Math.random().toString(36).substring(2, 6)}`;

        // Normalizar polígono de corte al origen local (0, 0)
        const bbox = patternPiece.cutPolygon.length > 0
          ? computeBoundingBox(patternPiece.cutPolygon)
          : patternPiece.bbox;
        const localCutPolygon = patternPiece.cutPolygon.map((pt) => ({
          x: pt.x - bbox.minX,
          y: pt.y - bbox.minY,
        }));
        const localBbox = computeBoundingBox(localCutPolygon);
        const translateTransform = (bbox.minX !== 0 || bbox.minY !== 0)
          ? ` transform="translate(-${bbox.minX}, -${bbox.minY})"`
          : '';

        // 2. Extraer o generar arte base del diseño maestro para esta pieza
        const artwork = masterDesign.pieceArtworks[pieceType];
        const primaryColor = masterDesign.colors[0] || '#ea580c';
        const secondaryColor = masterDesign.colors[1] || '#0284c7';
        const accentColor = masterDesign.colors[2] || '#ffffff';

        let baseArtSvg = artwork?.svgArtContent || `
          <rect width="${localBbox.width}" height="${localBbox.height}" fill="${primaryColor}" />
          <path d="M 0,${localBbox.height * 0.3} L ${localBbox.width},${localBbox.height * 0.45} L ${localBbox.width},${localBbox.height * 0.52} L 0,${localBbox.height * 0.37} Z" fill="${secondaryColor}" opacity="0.4" />
        `;

        // 3. Aplicar personalización de texto y números
        if (pieceType === 'ESPALDA') {
          // Reemplazar o inyectar nombre y dorsal
          const nameRule = artwork?.placeholders.find((p) => p.id === 'NOMBRE') || {
            id: 'NOMBRE',
            tag: '{{NOMBRE}}',
            targetPiece: 'ESPALDA' as const,
            anchorX: localBbox.width / 2,
            anchorY: localBbox.height * 0.28,
            maxWidthMm: localBbox.width * 0.65,
            maxHeightMm: 65,
            defaultFontSizeMm: 55,
            minFontSizeMm: 35,
            minScaleFactor: 0.60,
            fontFamily: 'SportsJerseyBold',
            fillColor: accentColor,
            strokeColor: '#000000',
            strokeWidthMm: 2.5,
            textAlign: 'center' as const,
          };

          const numberRule = artwork?.placeholders.find((p) => p.id.includes('NUMERO')) || {
            id: 'NUMERO_ESPALDA',
            tag: '{{NUMERO}}',
            targetPiece: 'ESPALDA' as const,
            anchorX: localBbox.width / 2,
            anchorY: localBbox.height * 0.58,
            maxWidthMm: localBbox.width * 0.60,
            maxHeightMm: 260,
            defaultFontSizeMm: Math.min(localBbox.height * 0.35, 230),
            minFontSizeMm: 160,
            minScaleFactor: 0.70,
            fontFamily: 'SportsJerseyBold',
            fillColor: accentColor,
            strokeColor: '#000000',
            strokeWidthMm: 4.0,
            textAlign: 'center' as const,
          };

          const nameFitting = computeTextFitting(orderItem.playerName, nameRule);
          const numberFitting = computeTextFitting(orderItem.playerNumber, numberRule);

          baseArtSvg = applyPlaceholdersToArtwork(baseArtSvg, orderItem.playerName, orderItem.playerNumber, [nameRule, numberRule]);
          baseArtSvg += `\n${nameFitting.svgContent}\n${numberFitting.svgContent}`;
        } else if (pieceType === 'DELANTERO') {
          // Número pequeño frontal
          const frontNumRule = {
            id: 'NUMERO_FRENTE',
            tag: '{{NUMERO_FRENTE}}',
            targetPiece: 'DELANTERO' as const,
            anchorX: localBbox.width * 0.75,
            anchorY: localBbox.height * 0.35,
            maxWidthMm: 75,
            maxHeightMm: 75,
            defaultFontSizeMm: 70,
            minFontSizeMm: 50,
            minScaleFactor: 0.80,
            fontFamily: 'SportsJerseyBold',
            fillColor: accentColor,
            strokeColor: '#000000',
            strokeWidthMm: 2.0,
            textAlign: 'center' as const,
          };
          const frontFitting = computeTextFitting(orderItem.playerNumber, frontNumRule);
          baseArtSvg += `\n${frontFitting.svgContent}`;
        }

        // 4. Etiqueta de identificación para corte y confección fuera del margen de costura
        const labelText = `${orderItem.playerName} | #${orderItem.playerNumber} | T${orderItem.sizeName} | ${pieceType}`;
        const labelInfo: PieceLabelInfo = {
          text: labelText,
          anchorX: localBbox.width / 2,
          anchorY: localBbox.height + config.labelDistanceMm,
          fontSizeMm: config.labelFontSizeMm,
          isVisible: config.includeLabels,
        };

        // 5. Ensamblado del SVG con máscara exacta del molde
        const labelSvg = config.includeLabels
          ? `<text x="${labelInfo.anchorX}" y="${labelInfo.anchorY}" font-family="monospace" font-size="${labelInfo.fontSizeMm}" fill="${config.labelColor}" text-anchor="middle" font-weight="bold">${labelText}</text>`
          : '';

        // Asegurar que el arte vectorial escale y llene el ancho y alto del molde de esta talla
        let scaledArtSvg = baseArtSvg;
        if (scaledArtSvg.includes('<svg')) {
          scaledArtSvg = scaledArtSvg.replace(/<svg\b([^>]*)>/i, (_, attrs) => {
            const clean = attrs
              .replace(/\bwidth\s*=\s*["'][^"']+["']/gi, '')
              .replace(/\bheight\s*=\s*["'][^"']+["']/gi, '')
              .replace(/\bpreserveAspectRatio\s*=\s*["'][^"']+["']/gi, '');
            return `<svg x="0" y="0" width="${localBbox.width}" height="${localBbox.height}" preserveAspectRatio="none" ${clean}>`;
          });
        }

        const fullPieceSvg = `
          <g id="${uniquePieceId}">
            <defs>
              <clipPath id="${maskId}">
                <path d="${patternPiece.svgPathData}"${translateTransform} />
              </clipPath>
            </defs>
            <!-- Arte recortado exactamente con el molde -->
            <g clip-path="url(#${maskId})">
              ${scaledArtSvg}
            </g>
            <!-- Contorno de corte visible 1:1 -->
            <path d="${patternPiece.svgPathData}"${translateTransform} fill="none" stroke="#22c55e" stroke-width="1.0" opacity="0.6" />
            <!-- Etiqueta de confección -->
            ${labelSvg}
          </g>
        `.trim();

        const genPiece: GeneratedPiece = {
          id: uniquePieceId,
          orderItemId: orderItem.id,
          pieceId: patternPiece.id,
          playerName: orderItem.playerName,
          playerNumber: orderItem.playerNumber,
          sizeName: orderItem.sizeName,
          pieceType,
          pieceName: `${orderItem.playerName}_#${orderItem.playerNumber}_T${orderItem.sizeName}_${pieceType}`,
          cutPolygon: localCutPolygon,
          bbox: localBbox,
          areaMm2: patternPiece.areaMm2,
          allowedRotationsDeg: patternPiece.allowedRotationsDeg,
          svgMaskId: maskId,
          svgContent: fullPieceSvg,
          label: labelInfo,
        };

        generatedPieces.push(genPiece);

        // Contadores
        bySize[orderItem.sizeName] = (bySize[orderItem.sizeName] || 0) + 1;
        byPieceType[pieceType] = (byPieceType[pieceType] || 0) + 1;
      }
    }
  }

  return {
    pieces: generatedPieces,
    totalPieces: generatedPieces.length,
    totalGarments: totalGarmentsCount,
    bySize,
    byPieceType,
    warnings,
  };
}

/**
 * Filtra piezas para la función de Reimpresión de emergencia
 */
export function filterReprintPieces(
  allPieces: GeneratedPiece[],
  filter: {
    orderItemId?: string;
    playerName?: string;
    sizeName?: string;
    pieceType?: PieceType;
  }
): GeneratedPiece[] {
  return allPieces.filter((p) => {
    if (filter.orderItemId && p.orderItemId !== filter.orderItemId) return false;
    if (filter.playerName && p.playerName.toUpperCase() !== filter.playerName.toUpperCase()) return false;
    if (filter.sizeName && p.sizeName.toUpperCase() !== filter.sizeName.toUpperCase()) return false;
    if (filter.pieceType && p.pieceType !== filter.pieceType) return false;
    return true;
  });
}
