import { PlacedNestingPiece } from '@/core/nesting/types';
import { SnapResult, SnapGuide } from './types';

interface SnappingOptions {
  currentX: number; // en mm
  currentY: number; // en mm
  widthMm: number; // en mm
  heightMm: number; // en mm
  printableWidthMm: number; // en mm
  spacingMm: number; // en mm
  otherPieces: PlacedNestingPiece[];
  thresholdMm?: number; // tolerancia de atracción magnética en mm (por defecto 15 mm)
}

/**
 * Servicio de Snapping Magnético inteligente para el lienzo interactivo.
 * Permite que una pieza arrastrada se imante automáticamente a:
 * 1. Los bordes del rollo (izquierdo x=0, derecho x=ancho-w, superior y=0)
 * 2. El margen de seguridad de 7.0 mm con respecto a piezas vecinas
 * 3. Alineación de bordes (izquierdo con izquierdo, derecho con derecho, etc.)
 */
export function calculateSnapping(options: SnappingOptions): SnapResult {
  const {
    currentX,
    currentY,
    widthMm,
    heightMm,
    printableWidthMm,
    spacingMm,
    otherPieces,
    thresholdMm = 15.0,
  } = options;

  let bestX = currentX;
  let bestDistX = thresholdMm;
  let hasSnappedX = false;
  let activeGuideX: SnapGuide | null = null;

  let bestY = currentY;
  let bestDistY = thresholdMm;
  let hasSnappedY = false;
  let activeGuideY: SnapGuide | null = null;

  // 1. Snapping en eje X a los bordes del rollo
  // Borde izquierdo (x = 0)
  if (Math.abs(currentX - 0) < bestDistX) {
    bestDistX = Math.abs(currentX - 0);
    bestX = 0;
    hasSnappedX = true;
    activeGuideX = { type: 'vertical', positionMm: 0, label: 'Borde Izq (0 mm)' };
  }

  // Borde derecho (x + w = printableWidthMm)
  const rightEdgeX = printableWidthMm - widthMm;
  if (Math.abs(currentX - rightEdgeX) < bestDistX) {
    bestDistX = Math.abs(currentX - rightEdgeX);
    bestX = rightEdgeX;
    hasSnappedX = true;
    activeGuideX = { type: 'vertical', positionMm: printableWidthMm, label: `Borde Der (${printableWidthMm} mm)` };
  }

  // 2. Snapping en eje Y al origen superior del rollo (y = 0)
  if (Math.abs(currentY - 0) < bestDistY) {
    bestDistY = Math.abs(currentY - 0);
    bestY = 0;
    hasSnappedY = true;
    activeGuideY = { type: 'horizontal', positionMm: 0, label: 'Inicio Rollo (0 mm)' };
  }

  // 3. Snapping relativo contra las demás piezas en el lienzo (con filtrado rápido por proximidad)
  for (let i = 0; i < otherPieces.length; i++) {
    const other = otherPieces[i];
    const ox = other.xMm;
    const oy = other.yMm;
    const ow = other.effectiveWidthMm;
    const oh = other.effectiveHeightMm;

    // Descarte rápido por proximidad en el rollo: evita evaluar piezas lejanas en bobinas largas
    const proximityMarginY = Math.max(heightMm, oh) + spacingMm + thresholdMm * 4;
    if (oy > currentY + heightMm + proximityMarginY || oy + oh < currentY - proximityMarginY) {
      continue;
    }

    const maxReachX = spacingMm + bestDistX;
    const maxReachY = spacingMm + bestDistY;

    const canSnapX =
      ox <= currentX + widthMm + maxReachX &&
      ox + ow >= currentX - maxReachX;
    const canSnapY =
      oy <= currentY + heightMm + maxReachY &&
      oy + oh >= currentY - maxReachY;

    if (!canSnapX && !canSnapY) {
      continue;
    }

    // --- EJE X ---
    if (canSnapX) {
      // A. A la derecha de la otra pieza con margen de seguridad (x = ox + ow + spacingMm)
      const snapRightOfOther = ox + ow + spacingMm;
      const distRight = Math.abs(currentX - snapRightOfOther);
      if (distRight < bestDistX) {
        bestDistX = distRight;
        bestX = snapRightOfOther;
        hasSnappedX = true;
        activeGuideX = {
          type: 'vertical',
          positionMm: ox + ow,
          label: `+${spacingMm}mm separación`,
        };
      }

      // B. A la izquierda de la otra pieza con margen (x + widthMm + spacingMm = ox)
      const snapLeftOfOther = ox - widthMm - spacingMm;
      if (snapLeftOfOther >= 0) {
        const distLeft = Math.abs(currentX - snapLeftOfOther);
        if (distLeft < bestDistX) {
          bestDistX = distLeft;
          bestX = snapLeftOfOther;
          hasSnappedX = true;
          activeGuideX = {
            type: 'vertical',
            positionMm: ox,
            label: `+${spacingMm}mm separación`,
          };
        }
      }

      // C. Alineación borde izquierdo (x = ox)
      const distAlignLeft = Math.abs(currentX - ox);
      if (distAlignLeft < bestDistX) {
        bestDistX = distAlignLeft;
        bestX = ox;
        hasSnappedX = true;
        activeGuideX = { type: 'vertical', positionMm: ox, label: 'Alineado Izq' };
      }

      // D. Alineación borde derecho (x + widthMm = ox + ow)
      const alignRightX = ox + ow - widthMm;
      const distAlignRight = Math.abs(currentX - alignRightX);
      if (distAlignRight < bestDistX) {
        bestDistX = distAlignRight;
        bestX = alignRightX;
        hasSnappedX = true;
        activeGuideX = { type: 'vertical', positionMm: ox + ow, label: 'Alineado Der' };
      }
    }

    // --- EJE Y ---
    if (canSnapY) {
      // E. Debajo de la otra pieza con margen (y = oy + oh + spacingMm)
      const snapBelowOther = oy + oh + spacingMm;
      const distBelow = Math.abs(currentY - snapBelowOther);
      if (distBelow < bestDistY) {
        bestDistY = distBelow;
        bestY = snapBelowOther;
        hasSnappedY = true;
        activeGuideY = {
          type: 'horizontal',
          positionMm: oy + oh,
          label: `+${spacingMm}mm separación`,
        };
      }

      // F. Arriba de la otra pieza con margen (y + heightMm + spacingMm = oy)
      const snapAboveOther = oy - heightMm - spacingMm;
      if (snapAboveOther >= 0) {
        const distAbove = Math.abs(currentY - snapAboveOther);
        if (distAbove < bestDistY) {
          bestDistY = distAbove;
          bestY = snapAboveOther;
          hasSnappedY = true;
          activeGuideY = {
            type: 'horizontal',
            positionMm: oy,
            label: `+${spacingMm}mm separación`,
          };
        }
      }

      // G. Alineación borde superior (y = oy)
      const distAlignTop = Math.abs(currentY - oy);
      if (distAlignTop < bestDistY) {
        bestDistY = distAlignTop;
        bestY = oy;
        hasSnappedY = true;
        activeGuideY = { type: 'horizontal', positionMm: oy, label: 'Alineado Superior' };
      }
    }
  }

  // Clampear para que la pieza nunca se salga del ancho útil del rollo ni de Y=0
  const clampedX = Math.max(0, Math.min(bestX, printableWidthMm - widthMm));
  const clampedY = Math.max(0, bestY);

  const guides: SnapGuide[] = [];
  if (activeGuideX) guides.push(activeGuideX);
  if (activeGuideY) guides.push(activeGuideY);

  return {
    snappedX: Number(clampedX.toFixed(2)),
    snappedY: Number(clampedY.toFixed(2)),
    guides,
    hasSnappedX,
    hasSnappedY,
  };
}
