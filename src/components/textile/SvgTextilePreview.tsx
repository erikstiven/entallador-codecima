import React, { useLayoutEffect, useRef, useMemo } from 'react';
import { namespaceSvgIds } from '@/core/svg/namespaceSvgIds';
import { extractGarmentBBox, normalizeSvgArtboard } from '@/core/svg/svgArtboardNormalizer';

export interface SvgTextilePreviewProps {
  /** Contenido SVG en formato texto crudo */
  svgContent?: string;
  /** Identificador único para evitar colisiones de IDs (clipPath, linearGradient, mask) */
  namespace: string;
  /** Margen porcentual alrededor de la prenda (por defecto 0.02 = 2%) */
  paddingRatio?: number;
  /** Encuadra el contenido visible o conserva el lienzo original del documento. */
  fitMode?: 'content' | 'document';
  /** Clases CSS adicionales para el contenedor */
  className?: string;
}

/**
 * Motor de renderizado vectorial de alto rendimiento para prendas deportivas.
 * - Desactiva mesas de trabajo y marcos transparentes de Illustrator / CorelDraw.
 * - Calcula el Bounding Box (BBox) real mediante el motor SVG nativo del navegador.
 * - Aplica un auto-viewBox proporcional y aísla IDs para evitar interferencias cruzadas.
 */
export const SvgTextilePreview: React.FC<SvgTextilePreviewProps> = ({
  svgContent,
  namespace,
  paddingRatio = 0.02,
  fitMode = 'content',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalización del marcado SVG con cálculo inmediato de auto-viewBox y aislamiento de IDs.
  const cleanHtml = useMemo(() => {
    if (!svgContent) return '';
    const namespaced = namespaceSvgIds(svgContent.trim(), namespace);
    const normalized = fitMode === 'content'
      ? normalizeSvgArtboard(namespaced, { paddingRatio })
      : namespaced;

    if (!/<svg\b/i.test(normalized)) {
      return `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;overflow:visible" xmlns="http://www.w3.org/2000/svg">${normalized}</svg>`;
    }

    return normalized.replace(/<svg\b([^>]*)>/i, (_, attrs) => {
      const cleanAttrs = attrs
        .replace(/\bwidth\s*=\s*["'][^"']+["']/gi, '')
        .replace(/\bheight\s*=\s*["'][^"']+["']/gi, '')
        .replace(/\bstyle\s*=\s*["'][^"']+["']/gi, '')
        .replace(/\bpreserveAspectRatio\s*=\s*["'][^"']+["']/gi, '');

      return `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%; max-height: 100%; display: block; overflow: visible;" ${cleanAttrs}>`;
    });
  }, [svgContent, namespace, fitMode, paddingRatio]);

  useLayoutEffect(() => {
    if (!containerRef.current || !svgContent) return;
    const svgEl = containerRef.current.querySelector('svg');
    if (!svgEl) return;

    if (fitMode === 'document') return;

    try {
      const bbox = extractGarmentBBox(svgEl, { paddingRatio });
      if (bbox && bbox.width > 2 && bbox.height > 2 && isFinite(bbox.x) && isFinite(bbox.y)) {
        const vx = bbox.x.toFixed(2);
        const vy = bbox.y.toFixed(2);
        const vw = bbox.width.toFixed(2);
        const vh = bbox.height.toFixed(2);
        svgEl.setAttribute('viewBox', `${vx} ${vy} ${vw} ${vh}`);
      }
    } catch (_) {
      // Preservar viewBox en caso de error
    }
  }, [cleanHtml, svgContent, namespace, paddingRatio, fitMode]);

  if (!svgContent) return null;

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex items-center justify-center pointer-events-none ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};
