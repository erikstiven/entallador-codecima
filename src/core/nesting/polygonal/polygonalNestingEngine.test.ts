import { describe, it, expect } from 'vitest';
import { runPolygonalNesting } from './polygonalNestingEngine';
import { NestingPieceInput, NestingOptions } from '../types';
import { checkPolygonsOverlap, calculatePolygonalIntersectionArea } from '../../geometry/clipperService';
import { getOrientedPolygon } from '../../geometry/transform';
import { Polygon2D } from '../../geometry/types';

// Helper para crear piezas cóncavas tipo camiseta deportiva con axilas
function createJerseyPiece(
  id: string,
  playerName: string,
  sizeName: string,
  width: number,
  height: number
): NestingPieceInput {
  // Polígono realista con curvatura de cuello y axilas cóncavas
  const cutPolygon: Polygon2D = [
    { x: 0, y: 150 },          // Axila izquierda
    { x: 50, y: 0 },           // Hombro izquierdo
    { x: width / 2, y: 40 },    // Cuello cóncavo
    { x: width - 50, y: 0 },    // Hombro derecho
    { x: width, y: 150 },      // Axila derecha
    { x: width - 30, y: height},// Dobladillo derecho
    { x: 30, y: height },       // Dobladillo izquierdo
  ];

  return {
    id,
    orderItemId: `item_${playerName}`,
    pieceId: 'piece_jersey',
    playerName,
    playerNumber: '10',
    sizeName,
    pieceType: 'DELANTERO',
    bbox: { width, height },
    areaMm2: width * height * 0.78,
    allowedRotations: [0],
    cutPolygon,
  };
}

// Helper para crear mangas deportivas (que encajan en axilas y permiten rotación 0° y 180°)
function createSleevePiece(
  id: string,
  playerName: string,
  sizeName: string,
  width: number,
  height: number
): NestingPieceInput {
  const cutPolygon: Polygon2D = [
    { x: 40, y: 0 },
    { x: width - 40, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];

  return {
    id,
    orderItemId: `item_${playerName}`,
    pieceId: 'piece_sleeve',
    playerName,
    playerNumber: '10',
    sizeName,
    pieceType: 'MANGA_IZQ',
    bbox: { width, height },
    areaMm2: width * height * 0.85,
    allowedRotations: [0, 180],
    cutPolygon,
  };
}

describe('Motor de Nesting 2D Avanzado Poligonal (Fase B con Clipper2)', () => {
  const defaultOptions: NestingOptions = {
    printableWidthMm: 1120.0,
    spacingMm: 7.0,
    groupingMode: 'MAX_SAVINGS',
  };

  it('QA 13.2.1: Contención estricta: para toda pieza i, xi + width_i <= 1120.00 mm', async () => {
    const pieces: NestingPieceInput[] = [
      createJerseyPiece('j1', 'MATEO', '28', 520, 710),
      createJerseyPiece('j2', 'CARLOS', '32', 550, 740),
      createSleevePiece('s1', 'MATEO', '28', 380, 240),
      createSleevePiece('s2', 'CARLOS', '32', 400, 250),
    ];

    const result = await runPolygonalNesting(pieces, defaultOptions);

    expect(result.placedPieces.length).toBe(4);
    for (const piece of result.placedPieces) {
      expect(piece.xMm).toBeGreaterThanOrEqual(0);
      expect(piece.xMm + piece.effectiveWidthMm).toBeLessThanOrEqual(defaultOptions.printableWidthMm + 0.01);
      expect(piece.yMm).toBeGreaterThanOrEqual(0);
    }
  });

  it('QA 13.2.2: Test de No-Solapamiento con Clipper2: Intersección física entre pares es exactamente 0.00 mm²', async () => {
    const pieces: NestingPieceInput[] = [
      createJerseyPiece('j1', 'JUGADOR_1', '28', 500, 700),
      createJerseyPiece('j2', 'JUGADOR_2', '28', 500, 700),
      createSleevePiece('s1', 'JUGADOR_1', '28', 380, 240),
      createSleevePiece('s2', 'JUGADOR_2', '28', 380, 240),
    ];

    const result = await runPolygonalNesting(pieces, defaultOptions);
    const placed = result.placedPieces;

    // Verificar intersección booleana estricta con Clipper2 entre todos los pares posibles
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];

        const polyA = getOrientedPolygon(a.cutPolygon, a.rotationDeg, a.xMm, a.yMm);
        const polyB = getOrientedPolygon(b.cutPolygon, b.rotationDeg, b.xMm, b.yMm);

        const overlaps = await checkPolygonsOverlap(polyA, polyB);
        const area = await calculatePolygonalIntersectionArea(polyA, polyB);

        expect(overlaps).toBe(false);
        expect(area).toBe(0.0);
      }
    }
  });

  it('QA 13.2.3: Invarianza de piezas fijadas (Locked 🔒): pieza en (100, 100) permanece inmutable', async () => {
    const lockedPiece: NestingPieceInput = {
      ...createJerseyPiece('locked_1', 'CAPITAN', '32', 500, 700),
      isLocked: true,
      xMm: 100.0,
      yMm: 100.0,
      rotationDeg: 0,
    };

    const freePieces: NestingPieceInput[] = [
      createJerseyPiece('free_1', 'DELANTERO', '28', 480, 680),
      createSleevePiece('free_2', 'MANGA', '28', 360, 230),
    ];

    const result = await runPolygonalNesting([lockedPiece, ...freePieces], defaultOptions);

    const foundLocked = result.placedPieces.find((p) => p.id === 'locked_1');
    expect(foundLocked).toBeDefined();
    expect(foundLocked?.xMm).toBe(100.0);
    expect(foundLocked?.yMm).toBe(100.0);
    expect(foundLocked?.isLocked).toBe(true);

    // Ninguna pieza libre se solapa con la bloqueada
    const polyLocked = getOrientedPolygon(
      foundLocked!.cutPolygon,
      foundLocked!.rotationDeg,
      foundLocked!.xMm,
      foundLocked!.yMm
    );

    for (const pl of result.placedPieces) {
      if (pl.id === 'locked_1') continue;

      const polyFree = getOrientedPolygon(pl.cutPolygon, pl.rotationDeg, pl.xMm, pl.yMm);
      const overlaps = await checkPolygonsOverlap(polyLocked, polyFree);
      expect(overlaps).toBe(false);
    }
  });
});
