import { OrderItem } from '@/modules/orders/types';
import { PatternSet, PatternPiece, PieceType } from '@/modules/patterns/types';
import { MasterDesign, DynamicPlaceholderRule } from '@/modules/designs/types';
import { 
  GeneratedPiece, 
  GenerationConfig, 
  GenerationResult, 
  PieceLabelInfo 
} from './types';
import { computeBoundingBox, calculatePolygonArea, polygonToSvgPath } from '@/core/geometry/transform';
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
    let sizeObj = patternSet.sizes.find(
      (s) => normalizeSizeName(s.sizeName).toUpperCase() === targetSize
    );

    // Si la talla solicitada no existe de forma explícita, usar la talla más cercana disponible
    if (!sizeObj || sizeObj.pieces.length === 0) {
      if (patternSet.sizes.length > 0) {
        sizeObj = patternSet.sizes.find((s) => s.pieces.length > 0) || patternSet.sizes[0];
      } else {
        warnings.push(`Jugador ${orderItem.playerName}: Talla "${orderItem.sizeName}" no tiene piezas disponibles en el molde.`);
        continue;
      }
    }

    totalGarmentsCount += orderItem.quantity;
    
    // Determinar tipo de prenda efectivo considerando el alcance de producción configurado
    const effectiveGarmentType = (config.productionScope === 'CAMISETA_ONLY')
      ? 'CAMISETA'
      : (config.productionScope === 'SHORT_ONLY')
      ? 'SHORT'
      : orderItem.garmentType;

    // 1. Delantero: exactamente 1 pieza
    const delanteros = sizeObj.pieces.filter((p) =>
      p.pieceType === 'DELANTERO' || p.pieceType === 'DELANTERO_V' || p.pieceType === 'DELANTERO_REDONDO'
    );
    let chosenDelantero: PatternPiece | undefined;
    if (delanteros.length > 0) {
      const wantsV = (orderItem.notes || '').toUpperCase().includes('V');
      if (wantsV) {
        chosenDelantero = delanteros.find((p) => p.pieceType === 'DELANTERO_V') || delanteros[0];
      } else {
        chosenDelantero = delanteros.find((p) => p.pieceType === 'DELANTERO_REDONDO') || delanteros[0];
      }
    } else {
      for (const otherSize of patternSet.sizes) {
        const found = otherSize.pieces.find((p) => p.pieceType === 'DELANTERO' || p.pieceType === 'DELANTERO_V' || p.pieceType === 'DELANTERO_REDONDO');
        if (found) {
          chosenDelantero = { ...found, id: `${found.id}_borrowed_${targetSize}`, sizeName: targetSize };
          break;
        }
      }
    }

    // 2. Espalda: exactamente 1 pieza
    let espaldaPiece = sizeObj.pieces.find((p) => p.pieceType === 'ESPALDA');
    if (!espaldaPiece) {
      for (const otherSize of patternSet.sizes) {
        const found = otherSize.pieces.find((p) => p.pieceType === 'ESPALDA');
        if (found) {
          espaldaPiece = { ...found, id: `${found.id}_borrowed_${targetSize}`, sizeName: targetSize };
          break;
        }
      }
    }

    // 3. Mangas de ESTA talla: exactamente 2 piezas (izquierda y derecha en modo espejo)
    let mangaIzq = sizeObj.pieces.find((p) => p.pieceType === 'MANGA_IZQ');
    let mangaDer = sizeObj.pieces.find((p) => p.pieceType === 'MANGA_DER');
    if (!mangaIzq && !mangaDer) {
      const genericManga = sizeObj.pieces.find((p) => p.pieceType.startsWith('MANGA'));
      if (genericManga) {
        const w = genericManga.bbox.width;
        const mirroredPoly = genericManga.cutPolygon.map((pt) => ({
          x: Number((w - pt.x).toFixed(2)),
          y: pt.y,
        }));
        mangaIzq = { ...genericManga, id: `${genericManga.id}_izq`, pieceType: 'MANGA_IZQ', pieceName: `${genericManga.pieceName}_IZQ` };
        mangaDer = {
          ...genericManga,
          id: `${genericManga.id}_der`,
          pieceType: 'MANGA_DER',
          pieceName: `${genericManga.pieceName}_DER`,
          cutPolygon: mirroredPoly,
          svgPathData: polygonToSvgPath(mirroredPoly),
        };
      } else {
        for (const otherSize of patternSet.sizes) {
          const found = otherSize.pieces.find((p) => p.pieceType.startsWith('MANGA'));
          if (found) {
            const w = found.bbox.width;
            const mirroredPoly = found.cutPolygon.map((pt) => ({
              x: Number((w - pt.x).toFixed(2)),
              y: pt.y,
            }));
            mangaIzq = { ...found, id: `${found.id}_borrowed_${targetSize}_izq`, pieceType: 'MANGA_IZQ', sizeName: targetSize };
            mangaDer = {
              ...found,
              id: `${found.id}_borrowed_${targetSize}_der`,
              pieceType: 'MANGA_DER',
              sizeName: targetSize,
              cutPolygon: mirroredPoly,
              svgPathData: polygonToSvgPath(mirroredPoly),
            };
            break;
          }
        }
      }
    } else if (mangaIzq && !mangaDer) {
      const w = mangaIzq.bbox.width;
      const mirroredPoly = mangaIzq.cutPolygon.map((pt) => ({
        x: Number((w - pt.x).toFixed(2)),
        y: pt.y,
      }));
      mangaDer = {
        ...mangaIzq,
        id: `${mangaIzq.id}_der`,
        pieceType: 'MANGA_DER',
        pieceName: `${mangaIzq.pieceName}_DER`,
        cutPolygon: mirroredPoly,
        svgPathData: polygonToSvgPath(mirroredPoly),
      };
    } else if (mangaDer && !mangaIzq) {
      const w = mangaDer.bbox.width;
      const mirroredPoly = mangaDer.cutPolygon.map((pt) => ({
        x: Number((w - pt.x).toFixed(2)),
        y: pt.y,
      }));
      mangaIzq = {
        ...mangaDer,
        id: `${mangaDer.id}_izq`,
        pieceType: 'MANGA_IZQ',
        pieceName: `${mangaDer.pieceName}_IZQ`,
        cutPolygon: mirroredPoly,
        svgPathData: polygonToSvgPath(mirroredPoly),
      };
    }

    // 4. Shorts / Pantalonetas (SOLO SI effectiveGarmentType es 'SHORT' o 'COMPLETO')
    let pantaIzq: PatternPiece | undefined;
    let pantaDer: PatternPiece | undefined;
    if (effectiveGarmentType === 'SHORT' || effectiveGarmentType === 'COMPLETO') {
      pantaIzq = sizeObj.pieces.find((p) => p.pieceType === 'PANTALONETA_IZQ' || p.pieceType === 'SHORT_FRENTE');
      pantaDer = sizeObj.pieces.find((p) => p.pieceType === 'PANTALONETA_DER' || p.pieceType === 'SHORT_ESPALDA');
      if (!pantaIzq && !pantaDer) {
        const genericShort = sizeObj.pieces.find((p) => p.pieceType.startsWith('PANTALONETA') || p.pieceType.startsWith('SHORT'));
        if (genericShort) {
          pantaIzq = { ...genericShort, id: `${genericShort.id}_izq`, pieceType: 'PANTALONETA_IZQ' };
          pantaDer = { ...genericShort, id: `${genericShort.id}_der`, pieceType: 'PANTALONETA_DER' };
        } else {
          for (const otherSize of patternSet.sizes) {
            const found = otherSize.pieces.find((p) => p.pieceType.startsWith('PANTALONETA') || p.pieceType.startsWith('SHORT'));
            if (found) {
              pantaIzq = { ...found, id: `${found.id}_borrowed_${targetSize}_izq`, pieceType: 'PANTALONETA_IZQ', sizeName: targetSize };
              pantaDer = { ...found, id: `${found.id}_borrowed_${targetSize}_der`, pieceType: 'PANTALONETA_DER', sizeName: targetSize };
              break;
            }
          }
        }
      } else if (pantaIzq && !pantaDer) {
        const w = pantaIzq.bbox.width;
        const mirroredPoly = pantaIzq.cutPolygon.map((pt) => ({
          x: Number((w - pt.x).toFixed(2)),
          y: pt.y,
        }));
        pantaDer = {
          ...pantaIzq,
          id: `${pantaIzq.id}_der`,
          pieceType: 'PANTALONETA_DER',
          pieceName: `${pantaIzq.pieceName}_DER`,
          cutPolygon: mirroredPoly,
          svgPathData: polygonToSvgPath(mirroredPoly),
        };
      } else if (pantaDer && !pantaIzq) {
        const w = pantaDer.bbox.width;
        const mirroredPoly = pantaDer.cutPolygon.map((pt) => ({
          x: Number((w - pt.x).toFixed(2)),
          y: pt.y,
        }));
        pantaIzq = {
          ...pantaDer,
          id: `${pantaDer.id}_izq`,
          pieceType: 'PANTALONETA_IZQ',
          pieceName: `${pantaDer.pieceName}_IZQ`,
          cutPolygon: mirroredPoly,
          svgPathData: polygonToSvgPath(mirroredPoly),
        };
      }
    }

    // 5. Construir lista final de piezas para este jugador
    const piecesToGenerate: PatternPiece[] = [];
    if (effectiveGarmentType === 'CAMISETA' || effectiveGarmentType === 'COMPLETO') {
      if (chosenDelantero) piecesToGenerate.push(chosenDelantero);
      if (espaldaPiece) piecesToGenerate.push(espaldaPiece);
      if (mangaIzq) piecesToGenerate.push(mangaIzq);
      if (mangaDer) piecesToGenerate.push(mangaDer);
    }
    if (effectiveGarmentType === 'SHORT' || effectiveGarmentType === 'COMPLETO') {
      if (pantaIzq) piecesToGenerate.push(pantaIzq);
      if (pantaDer) piecesToGenerate.push(pantaDer);
    }

    if (piecesToGenerate.length === 0) {
      warnings.push(`Jugador ${orderItem.playerName}: No hay piezas de tipo "${effectiveGarmentType}" en la talla ${orderItem.sizeName}.`);
      continue;
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
        const artwork = masterDesign.pieceArtworks[pieceType]
          || (pieceType === 'MANGA_DER' ? (masterDesign.pieceArtworks['MANGA_IZQ'] || masterDesign.pieceArtworks['MANGA' as PieceType]) : undefined)
          || (pieceType === 'MANGA_IZQ' ? (masterDesign.pieceArtworks['MANGA' as PieceType] || masterDesign.pieceArtworks['MANGA_DER']) : undefined)
          || (pieceType.startsWith('DELANTERO') ? masterDesign.pieceArtworks['DELANTERO'] : undefined)
          || (pieceType === 'PANTALONETA_DER' ? (masterDesign.pieceArtworks['SHORT_ESPALDA' as PieceType] || masterDesign.pieceArtworks['PANTALONETA_IZQ' as PieceType]) : undefined)
          || (pieceType === 'PANTALONETA_IZQ' ? (masterDesign.pieceArtworks['SHORT_FRENTE' as PieceType] || masterDesign.pieceArtworks['PANTALONETA_DER' as PieceType]) : undefined);
        const primaryColor = masterDesign.colors[0] || '#ea580c';
        const secondaryColor = masterDesign.colors[1] || '#0284c7';
        const accentColor = masterDesign.colors[2] || '#ffffff';

        let baseArtSvg = artwork?.svgArtContent || `
          <rect width="${localBbox.width}" height="${localBbox.height}" fill="${primaryColor}" />
          <path d="M 0,${localBbox.height * 0.3} L ${localBbox.width},${localBbox.height * 0.45} L ${localBbox.width},${localBbox.height * 0.52} L 0,${localBbox.height * 0.37} Z" fill="${secondaryColor}" opacity="0.4" />
        `;

        // Extraer configuraciones de tipografía y color de espalda
        const espaldaArt = masterDesign.pieceArtworks['ESPALDA'];
        const configuredFont = artwork?.placeholders?.find((p) => p.fontFamily)?.fontFamily
          || espaldaArt?.placeholders?.find((p) => p.fontFamily)?.fontFamily
          || 'Bebas Neue';
        const configuredFill = artwork?.placeholders?.find((p) => p.fillColor)?.fillColor
          || espaldaArt?.placeholders?.find((p) => p.fillColor)?.fillColor
          || accentColor;
        const configuredStroke = artwork?.placeholders?.find((p) => p.strokeColor)?.strokeColor
          || espaldaArt?.placeholders?.find((p) => p.strokeColor)?.strokeColor
          || '#000000';
        const configuredStrokeWidth = artwork?.placeholders?.find((p) => p.strokeWidthMm !== undefined)?.strokeWidthMm
          ?? espaldaArt?.placeholders?.find((p) => p.strokeWidthMm !== undefined)?.strokeWidthMm
          ?? 2.5;

        // 3. Aplicar personalización de texto y números (DORSAL CENTRADO EN MM FÍSICOS Y PROPORCIONADO)
        let dorsalSvg = '';
        if (pieceType === 'ESPALDA') {
          // Coordenadas físicas en milímetros centradas en la pieza real
          const centerX = localBbox.width / 2;
          const isYouth = localBbox.height < 580;

          const nameOffsetRatio = (config.nameVerticalOffsetPercent ?? 0) / 100;
          const numOffsetRatio = (config.numberVerticalOffsetPercent ?? 0) / 100;
          const nameScaleX = config.nameScaleX ?? 1.0;
          const nameScaleY = config.nameScaleY ?? 1.0;
          const numScaleX = config.numberScaleX ?? (config.numberScaleFactor ?? 1.0);
          const numScaleY = config.numberScaleY ?? (config.numberScaleFactor ?? 1.0);

          // Nombre: en la espalda alta (justo debajo del escote/hombros, a ~16-17% de altura + offset)
          const baseNameRatio = isYouth ? 0.17 : 0.16;
          const nameY = localBbox.height * Math.max(0.06, Math.min(0.35, baseNameRatio + nameOffsetRatio));

          // Número: en la parte media de la espalda (a ~43-45% de altura + offset, dejando libre la zona baja)
          const baseNumRatio = isYouth ? 0.44 : 0.45;
          const numberY = localBbox.height * Math.max(0.25, Math.min(0.65, baseNumRatio + numOffsetRatio));

          const nameFontSize = isYouth 
            ? Math.min(38, Math.max(26, localBbox.width * 0.095))
            : Math.min(50, Math.max(34, localBbox.width * 0.10));

          const numberFontSize = isYouth
            ? Math.min(170, Math.max(120, localBbox.height * 0.30))
            : Math.min(235, Math.max(170, localBbox.height * 0.32));

          const nameRule: DynamicPlaceholderRule = {
            id: 'NOMBRE',
            tag: '{{NOMBRE}}',
            targetPiece: 'ESPALDA',
            anchorX: centerX,
            anchorY: nameY,
            maxWidthMm: localBbox.width * 0.70,
            maxHeightMm: isYouth ? 45 : 60,
            defaultFontSizeMm: nameFontSize,
            minFontSizeMm: 22,
            minScaleFactor: 0.50,
            fontFamily: configuredFont,
            fillColor: configuredFill,
            strokeColor: configuredStroke,
            strokeWidthMm: configuredStrokeWidth,
            textAlign: 'center',
            customScaleX: nameScaleX,
            customScaleY: nameScaleY,
          };

          const numberRule: DynamicPlaceholderRule = {
            id: 'NUMERO_ESPALDA',
            tag: '{{NUMERO}}',
            targetPiece: 'ESPALDA',
            anchorX: centerX,
            anchorY: numberY,
            maxWidthMm: localBbox.width * 0.60,
            maxHeightMm: isYouth ? 175 : 240,
            defaultFontSizeMm: numberFontSize,
            minFontSizeMm: 110,
            minScaleFactor: 0.60,
            fontFamily: configuredFont,
            fillColor: configuredFill,
            strokeColor: configuredStroke,
            strokeWidthMm: configuredStrokeWidth > 0 ? Math.max(configuredStrokeWidth, 3.0) : 0,
            textAlign: 'center',
            customScaleX: numScaleX,
            customScaleY: numScaleY,
          };

          const nameFitting = computeTextFitting(orderItem.playerName, nameRule);
          const numberFitting = computeTextFitting(orderItem.playerNumber, numberRule);

          dorsalSvg = `
            <!-- Dorsal Oficial: Nombre y Número centrados en mm reales -->
            <g id="dorsal_nombre_${uniquePieceId}">
              ${nameFitting.svgContent}
            </g>
            <g id="dorsal_numero_${uniquePieceId}">
              ${numberFitting.svgContent}
            </g>
          `;
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

        // Limpiar cualquier texto estático previo del fondo y asegurar que escale
        let cleanArtSvg = baseArtSvg.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi, '');
        let scaledArtSvg = cleanArtSvg;
        if (scaledArtSvg.includes('<svg')) {
          let artOffsetY = 0;
          if (pieceType.startsWith('MANGA')) {
            artOffsetY = config.sleeveArtOffsetYMm ?? 0;
          } else if (pieceType.startsWith('DELANTERO')) {
            artOffsetY = config.frontArtOffsetYMm ?? 0;
          } else if (pieceType === 'ESPALDA') {
            artOffsetY = config.backArtOffsetYMm ?? 0;
          }

          scaledArtSvg = scaledArtSvg.replace(/<svg\b([^>]*)>/i, (_, attrs) => {
            const clean = attrs
              .replace(/\bwidth\s*=\s*["'][^"']+["']/gi, '')
              .replace(/\bheight\s*=\s*["'][^"']+["']/gi, '')
              .replace(/\bpreserveAspectRatio\s*=\s*["'][^"']+["']/gi, '');
            return `<svg x="0" y="${artOffsetY}" width="${localBbox.width}" height="${localBbox.height}" preserveAspectRatio="xMidYMid slice" ${clean}>`;
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
              ${dorsalSvg}
            </g>
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
