import { Polygon2D } from '@/core/geometry/types';
import { computeBoundingBox, rotatePoint } from '@/core/geometry/transform';
import { PlacedNestingPiece } from '@/core/nesting/types';
import { ExportOptions } from './types';

const LEGACY_CONTOUR_COLOR = '#22c55e';

interface EmbeddedImageAsset {
  id: string;
  definition: string;
}

function formatNumber(value: number, decimals = 3): string {
  const rounded = Number(value.toFixed(decimals));
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

function escapeXmlText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeXmlAttribute(value: string): string {
  return escapeXmlText(value)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readSvgAttribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${escapeRegExp(name)}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2]?.trim();
}

/**
 * Older generated pieces carried a visible green technical outline inside
 * svgContent. Remove only that exact signature; green artwork remains intact.
 */
export function stripLegacyTechnicalContour(svgFragment: string): string {
  const withoutLegacyPath = svgFragment.replace(/<path\b[^>]*\/?\s*>/gi, (pathTag) => {
    const fill = readSvgAttribute(pathTag, 'fill')?.toLowerCase();
    const stroke = readSvgAttribute(pathTag, 'stroke')?.toLowerCase();
    const strokeWidth = readSvgAttribute(pathTag, 'stroke-width')?.toLowerCase();
    const opacity = readSvgAttribute(pathTag, 'opacity')?.toLowerCase();

    const isLegacyWidth = strokeWidth !== undefined
      && /^1(?:\.0+)?(?:mm)?$/.test(strokeWidth);
    const isLegacyOpacity = opacity !== undefined
      && /^(?:0?\.6|0\.60+|60%)$/.test(opacity);

    return fill === 'none'
      && stroke === LEGACY_CONTOUR_COLOR
      && isLegacyWidth
      && isLegacyOpacity
      ? ''
      : pathTag;
  });

  return withoutLegacyPath.replace(
    /<!--\s*Contorno de corte visible 1:1\s*-->\s*/gi,
    ''
  );
}

/** Removes the exact workshop label emitted by older garment generations. */
export function stripLegacyWorkshopLabel(svgFragment: string): string {
  const withoutLabel = svgFragment.replace(
    /<text\b[^>]*>[\s\S]*?<\/text>/gi,
    (textTag) => {
      const fontFamily = readSvgAttribute(textTag, 'font-family')?.toLowerCase();
      const fontSize = readSvgAttribute(textTag, 'font-size')?.toLowerCase();
      const fill = readSvgAttribute(textTag, 'fill')?.toLowerCase();
      const anchor = readSvgAttribute(textTag, 'text-anchor')?.toLowerCase();
      const weight = readSvgAttribute(textTag, 'font-weight')?.toLowerCase();

      const isLegacyLabel = fontFamily === 'monospace'
        && /^5(?:\.0+)?(?:mm)?$/.test(fontSize || '')
        && fill === '#94a3b8'
        && anchor === 'middle'
        && (weight === 'bold' || weight === '700');

      return isLegacyLabel ? '' : textTag;
    }
  );

  return withoutLabel.replace(/<!--\s*Etiqueta de confección\s*-->\s*/gi, '');
}

function stripInternalPieceMask(svgFragment: string): string {
  return svgFragment
    .replace(/<defs>\s*<clipPath id="[^"]+">\s*<path[^>]*\/>\s*<\/clipPath>\s*<\/defs>/gi, '')
    .replace(/<g clip-path="url\(#[^)]+\)">/gi, '<g>')
    .replace(/^\s*<g id="gen_[^"]+">\s*/i, '')
    .replace(/\s*<\/g>\s*$/i, '');
}

function stripNestedDocumentPreamble(svgFragment: string): string {
  return svgFragment
    .replace(/^\s*<\?xml[\s\S]*?\?>\s*/i, '')
    .replace(/<!DOCTYPE\s+svg(?:\s+PUBLIC\s+["'][^"']*["']\s+["'][^"']*["']|\s+SYSTEM\s+["'][^"']*["'])?\s*(?:\[[\s\S]*?\]\s*)?>/gi, '');
}

function sanitizeXmlName(value: string): string {
  const clean = value.replace(/[^A-Za-z0-9_.-]+/g, '_').replace(/^[-.0-9]+/, '');
  return clean || 'resource';
}

/**
 * Illustrator exports commonly reuse IDs and CSS class names such as
 * "image", "Capa_1" and "cls-1". Once several pieces are assembled in one
 * SVG those names collide and references may resolve to another player's art.
 * Prefix all local resources and class selectors for each placed piece.
 */
export function namespaceSvgFragment(svgFragment: string, namespace: string): { fragment: string; styles: string; defs: string } {
  const safeNamespace = sanitizeXmlName(namespace);
  const idMap = new Map<string, string>();
  const classMap = new Map<string, string>();
  let hoistedStyles = '';
  let hoistedDefs = '';

  let result = stripNestedDocumentPreamble(
    stripInternalPieceMask(
      stripLegacyWorkshopLabel(stripLegacyTechnicalContour(svgFragment))
    )
  );

  // 1. Map all IDs across whole fragment (including defs)
  result.replace(/\bid\s*=\s*(["'])([^"']+)\1/gi, (_match, _quote, id: string) => {
    if (!idMap.has(id)) {
      idMap.set(id, `${safeNamespace}_id_${idMap.size + 1}_${sanitizeXmlName(id)}`);
    }
    return _match;
  });

  // 2. Map all Class names
  result.replace(/\bclass\s*=\s*(["'])([^"']+)\1/gi, (_match, _quote, classes: string) => {
    for (const className of classes.split(/\s+/).filter(Boolean)) {
      if (!classMap.has(className)) {
        classMap.set(
          className,
          `${safeNamespace}_class_${classMap.size + 1}_${sanitizeXmlName(className)}`
        );
      }
    }
    return _match;
  });

  // 3. Replace IDs and Classes in XML
  result = result.replace(
    /\bid\s*=\s*(["'])([^"']+)\1/gi,
    (match, quote: string, id: string) => {
      const mapped = idMap.get(id);
      return mapped ? `id=${quote}${mapped}${quote}` : match;
    }
  );

  result = result.replace(
    /\bclass\s*=\s*(["'])([^"']+)\1/gi,
    (match, quote: string, classes: string) => {
      const mapped = classes
        .split(/\s+/)
        .filter(Boolean)
        .map((className) => classMap.get(className) || className)
        .join(' ');
      return mapped ? `class=${quote}${mapped}${quote}` : match;
    }
  );

  // 4. Parse CSS rules from <style> blocks
  const cssRules: { selector: string; properties: Record<string, string> }[] = [];
  result = result.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (_, _styleAttrs, cssContent) => {
    let namespacedCss = cssContent;
    for (const [origId, mappedId] of idMap) {
      namespacedCss = namespacedCss.replace(
        new RegExp(`url\\(\\s*(['"]?)#${escapeRegExp(origId)}\\1\\s*\\)`, 'g'),
        `url(#${mappedId})`
      );
      namespacedCss = namespacedCss.replace(
        new RegExp(`#${escapeRegExp(origId)}(?=\\s*[,>+~:{.\\[])`, 'g'),
        `#${mappedId}`
      );
    }
    for (const [origClass, mappedClass] of classMap) {
      namespacedCss = namespacedCss.replace(
        new RegExp(`\\.${escapeRegExp(origClass)}(?=\\s*[,>+~:{.\\[])`, 'g'),
        `.${mappedClass}`
      );
    }
    hoistedStyles += namespacedCss + '\n';

    // Parse rules for inlining
    const ruleRegex = /([^{]+)\{([^}]+)\}/g;
    let match;
    while ((match = ruleRegex.exec(cssContent)) !== null) {
      const selectors = match[1].split(',').map((s) => s.trim());
      const decls = match[2].split(';').map((d) => d.trim()).filter(Boolean);
      const props: Record<string, string> = {};
      for (const decl of decls) {
        const colonIdx = decl.indexOf(':');
        if (colonIdx > 0) {
          const prop = decl.substring(0, colonIdx).trim().toLowerCase();
          const val = decl.substring(colonIdx + 1).trim();
          if (prop && val) {
            props[prop] = val;
          }
        }
      }
      for (const sel of selectors) {
        if (sel) {
          cssRules.push({ selector: sel, properties: props });
        }
      }
    }
    return ''; // Remove from body so Illustrator doesn't choke on child styles
  });

  // 5. Inline CSS rules directly as presentation attributes (fill, stroke, opacity...)
  for (const rule of cssRules) {
    if (rule.selector.startsWith('.')) {
      const origClass = rule.selector.substring(1).trim();
      const mappedClass = classMap.get(origClass) || origClass;
      const classRegex = new RegExp(`(<(?:path|rect|circle|ellipse|polygon|polyline|text|g)\\b[^>]*?\\bclass\\s*=\\s*["'][^"']*?\\b${escapeRegExp(mappedClass)}\\b[^"']*?["'][^>]*?)>`, 'gi');
      result = result.replace(classRegex, (tag) => {
        let updatedTag = tag;
        for (const [prop, val] of Object.entries(rule.properties)) {
          if (!new RegExp(`\\b${escapeRegExp(prop)}\\s*=`, 'i').test(updatedTag)) {
            updatedTag = updatedTag.replace(/>$/, ` ${prop}="${escapeXmlAttribute(val)}">`);
          }
        }
        return updatedTag;
      });
    }
  }

  // 6. Update URI references
  for (const [originalId, mappedId] of idMap) {
    const escapedId = escapeRegExp(originalId);

    result = result.replace(
      new RegExp(`url\\(\\s*(["']?)#${escapedId}\\1\\s*\\)`, 'g'),
      `url(#${mappedId})`
    );

    result = result.replace(
      new RegExp(`\\b(href|xlink:href)\\s*=\\s*(["'])\\s*#${escapedId}\\s*\\2`, 'gi'),
      (_match, attributeName: string, quote: string) => `${attributeName}=${quote}#${mappedId}${quote}`
    );
  }

  // 7. Extract and hoist internal <defs> after renaming
  result = result.replace(/<defs\b[^>]*>([\s\S]*?)<\/defs>/gi, (_, defsInner) => {
    hoistedDefs += defsInner + '\n';
    return '';
  });

  return { fragment: result.trim(), styles: hoistedStyles, defs: hoistedDefs };
}

/**
 * Hoists repeated, self-contained data-URI images into the root <defs>. The
 * same source artwork is commonly repeated once per player; keeping one copy
 * avoids SVG files with dozens of identical PNG payloads. Complex images with
 * CSS, masks or transforms stay untouched so their appearance cannot change.
 */
function hoistEmbeddedImages(
  svgFragment: string,
  assets: Map<string, EmbeddedImageAsset>
): string {
  return svgFragment.replace(
    /<image\b[^>]*(?:\/\s*>|>\s*<\/image>)/gi,
    (imageTag) => {
      const href = readSvgAttribute(imageTag, 'href')
        || readSvgAttribute(imageTag, 'xlink:href');
      if (!href || !/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(href)) {
        return imageTag;
      }

      if (/\b(?:class|style|transform|clip-path|mask|filter|opacity|on[a-z]+)\s*=/i.test(imageTag)) {
        return imageTag;
      }

      const originalId = readSvgAttribute(imageTag, 'id');
      const canonical = imageTag
        .replace(/\s+id\s*=\s*(["'])[^"']*\1/i, '')
        .replace(/\s+/g, ' ')
        .trim();

      let asset = assets.get(canonical);
      if (!asset) {
        const assetId = `hmb_embedded_image_${assets.size + 1}`;
        const definition = canonical.replace(
          /^<image\b/i,
          `<image id="${assetId}"`
        );
        asset = { id: assetId, definition };
        assets.set(canonical, asset);
      }

      const useId = originalId ? ` id="${escapeXmlAttribute(originalId)}"` : '';
      return `<use${useId} href="#${asset.id}" xlink:href="#${asset.id}" />`;
    }
  );
}

/** Converts a local millimetre polygon to SVG path data. */
export function polygonToSvgPath(polygon: Polygon2D): string {
  const validPoints = (polygon || []).filter(
    (point) => Number.isFinite(point?.x) && Number.isFinite(point?.y)
  );
  if (validPoints.length < 3) return '';

  const [first, ...rest] = validPoints;
  const commands = [`M ${formatNumber(first.x)} ${formatNumber(first.y)}`];
  for (const point of rest) {
    commands.push(`L ${formatNumber(point.x)} ${formatNumber(point.y)}`);
  }
  commands.push('Z');
  return commands.join(' ');
}

/**
 * Matches getOrientedPolygon(): rotate around local (0,0), normalize the
 * rotated bounding box back to (0,0), and finally place it in the roll.
 */
export function getSvgPlacementTransform(piece: PlacedNestingPiece): string {
  const rawRotation = Number.isFinite(piece.rotationDeg) ? piece.rotationDeg : 0;
  const rotation = ((rawRotation % 360) + 360) % 360;
  const x = Number.isFinite(piece.xMm) ? piece.xMm : 0;
  const y = Number.isFinite(piece.yMm) ? piece.yMm : 0;

  if (rotation === 0 || piece.cutPolygon.length === 0) {
    return `translate(${formatNumber(x)} ${formatNumber(y)})`;
  }

  const rotatedPolygon = piece.cutPolygon.map((point) =>
    rotatePoint(point, rotation, { x: 0, y: 0 })
  );
  const rotatedBounds = computeBoundingBox(rotatedPolygon);
  const translateX = x - rotatedBounds.minX;
  const translateY = y - rotatedBounds.minY;

  return `translate(${formatNumber(translateX)} ${formatNumber(translateY)}) rotate(${formatNumber(rotation)})`;
}

function assertValidRollDimension(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} debe ser un número positivo en milímetros.`);
  }
  return value;
}

/**
 * Generates one continuous SVG at a physical 1:1 scale.
 * Root viewBox units are millimetres and match width/height exactly.
 */
export function generateFullRollSvg(
  placedPieces: PlacedNestingPiece[],
  widthMm: number,
  heightMm: number,
  options: Partial<ExportOptions> = {}
): string {
  const safeWidthMm = assertValidRollDimension(widthMm, 'El ancho del rollo');
  const safeHeightMm = assertValidRollDimension(heightMm, 'El largo del rollo');

  const includeContour = options.includeCutContour === true;
  const includeLabels = options.includeSeamLabels === true;
  const contourColor = escapeXmlAttribute(options.cutContourColor || '#ff0000');
  const contourWidth = Number.isFinite(options.cutContourWidthMm)
    ? Math.max(0.01, options.cutContourWidthMm as number)
    : 0.25;

  const wStr = safeWidthMm.toFixed(2);
  const hStr = safeHeightMm.toFixed(2);
  let defsContent = '';
  let allHoistedStyles = '';
  let allHoistedDefs = '';
  let piecesContent = '';
  const embeddedImageAssets = new Map<string, EmbeddedImageAsset>();

  placedPieces.forEach((piece, index) => {
    const namespace = `hmb_piece_${index + 1}`;
    const clipId = `${namespace}_clip`;
    const pathD = polygonToSvgPath(piece.cutPolygon);

    if (!pathD) return;

    defsContent += `    <clipPath id="${clipId}" clipPathUnits="userSpaceOnUse">\n`;
    defsContent += `      <path d="${pathD}" />\n`;
    defsContent += '    </clipPath>\n';

    const transform = getSvgPlacementTransform(piece);
    const player = escapeXmlText(piece.playerName || '');
    const number = escapeXmlText(piece.playerNumber || '');
    const size = escapeXmlText(piece.sizeName || '');
    const pieceType = escapeXmlText(piece.pieceType || '');

    piecesContent += `  <g id="${namespace}" data-player="${escapeXmlAttribute(piece.playerName || '')}" data-number="${escapeXmlAttribute(piece.playerNumber || '')}" data-size="${escapeXmlAttribute(piece.sizeName || '')}" data-piece-type="${escapeXmlAttribute(piece.pieceType || '')}" transform="${transform}">\n`;

    if (piece.svgContent?.trim()) {
      const { fragment, styles, defs } = namespaceSvgFragment(piece.svgContent, namespace);
      if (styles) allHoistedStyles += styles + '\n';
      if (defs) allHoistedDefs += defs + '\n';

      const cleanFragment = hoistEmbeddedImages(fragment, embeddedImageAssets);
      piecesContent += `    <g clip-path="url(#${clipId})">\n`;
      piecesContent += `      ${cleanFragment}\n`;
      piecesContent += '    </g>\n';
    } else {
      piecesContent += `    <path d="${pathD}" fill="#1e293b" fill-opacity="0.9" />\n`;
    }

    if (includeContour) {
      piecesContent += `    <path d="${pathD}" fill="none" stroke="${contourColor}" stroke-width="${formatNumber(contourWidth)}" stroke-miterlimit="4" data-hmb-role="technical-cut-contour" />\n`;
    }

    if (includeLabels) {
      const labelText = `${player} | #${number} | T${size} | ${pieceType}`;
      piecesContent += `    <text x="${formatNumber(piece.bbox.width / 2)}" y="-3.5" font-family="Arial, Helvetica, sans-serif" font-size="4.5" font-weight="700" fill="#0f172a" text-anchor="middle" stroke="#ffffff" stroke-width="0.6" stroke-linejoin="round" paint-order="stroke fill" data-hmb-role="workshop-label">${labelText}</text>\n`;
    }

    piecesContent += '  </g>\n';
  });

  const embeddedImageDefs = Array.from(embeddedImageAssets.values())
    .map((asset) => `    ${asset.definition}\n`)
    .join('');

  const styleTag = allHoistedStyles.trim()
    ? `    <style type="text/css">\n<![CDATA[\n${allHoistedStyles}\n]]>\n    </style>\n`
    : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- HMB Entallador: escala física 1:1; una unidad de viewBox equivale a un milímetro. -->
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${wStr}mm"
     height="${hStr}mm"
     viewBox="0 0 ${wStr} ${hStr}"
     version="1.1"
     color-interpolation="sRGB">
  <defs>
${styleTag}${allHoistedDefs}${embeddedImageDefs}${defsContent}  </defs>
${piecesContent}</svg>`;
}
