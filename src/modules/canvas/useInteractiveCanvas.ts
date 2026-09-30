import { useState, useRef, useCallback, useEffect } from 'react';
import { useNestingStore } from '@/core/nesting/nestingStore';
import { useProfileStore } from '@/modules/settings/profileStore';
import { calculateSnapping } from './snappingService';
import { CanvasDragState, SnapGuide } from './types';

export function useInteractiveCanvas() {
  const { activeProfile } = useProfileStore();
  const {
    placedPieces,
    selectedPieceId,
    setSelectedPieceId,
    movePiece,
    rotatePiece,
    toggleLockPiece,
  } = useNestingStore();

  const [zoomLevel, setZoomLevel] = useState<number>(100); // Vista fija y legible del rollo
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [dragState, setDragState] = useState<CanvasDragState>({
    isDragging: false,
    pieceId: null,
    startClientX: 0,
    startClientY: 0,
    originalPieceX: 0,
    originalPieceY: 0,
    currentPieceX: 0,
    currentPieceY: 0,
    activeGuides: [],
  });

  const mmToPx = (zoomLevel / 100) * 0.75;

  // Iniciar arrastre de una pieza
  const handlePieceMouseDown = (
    e: React.MouseEvent,
    pieceId: string,
    initialX: number,
    initialY: number
  ) => {
    e.stopPropagation();
    if (e.button !== 0) return; // Solo clic izquierdo para arrastrar pieza

    setSelectedPieceId(pieceId);

    setDragState({
      isDragging: true,
      pieceId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originalPieceX: initialX,
      originalPieceY: initialY,
      currentPieceX: initialX,
      currentPieceY: initialY,
      activeGuides: [],
    });
  };

  // Iniciar paneo del lienzo
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Paneo con botón central (rueda) o botón secundario o clic en fondo vacío
    if (e.button === 1 || e.button === 0) {
      if (e.button === 0 && (e.target as HTMLElement).closest('[data-piece="true"]')) {
        return; // Si hizo clic en una pieza, no panear
      }
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      };
    }
  };

  // Movimiento global del ratón (paneo o arrastre)
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // 1. Manejo de Paneo
      if (isPanning) {
        setPan({
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        });
        return;
      }

      // 2. Manejo de Arrastre de Pieza con Snapping Magnético
      if (dragState.isDragging && dragState.pieceId) {
        const dxPx = e.clientX - dragState.startClientX;
        const dyPx = e.clientY - dragState.startClientY;

        const dxMm = dxPx / mmToPx;
        const dyMm = dyPx / mmToPx;

        const rawTargetX = dragState.originalPieceX + dxMm;
        const rawTargetY = dragState.originalPieceY + dyMm;

        const draggedPiece = placedPieces.find((p) => p.id === dragState.pieceId);
        if (!draggedPiece) return;

        const otherPieces = placedPieces.filter((p) => p.id !== dragState.pieceId);

        // Calcular imantación magnética
        const snap = calculateSnapping({
          currentX: rawTargetX,
          currentY: rawTargetY,
          widthMm: draggedPiece.effectiveWidthMm,
          heightMm: draggedPiece.effectiveHeightMm,
          printableWidthMm: activeProfile.printableWidthMm,
          spacingMm: activeProfile.pieceSpacingMm || 7.0,
          otherPieces,
          thresholdMm: 14.0, // Imantación perceptible
        });

        setDragState((prev) => ({
          ...prev,
          currentPieceX: snap.snappedX,
          currentPieceY: snap.snappedY,
          activeGuides: snap.guides,
        }));
      }
    },
    [isPanning, dragState, mmToPx, placedPieces, activeProfile]
  );

  // Soltar ratón
  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (dragState.isDragging && dragState.pieceId) {
      // Guardar la nueva posición en el almacén de nesting (bloquea automáticamente la pieza)
      movePiece(
        dragState.pieceId,
        dragState.currentPieceX,
        dragState.currentPieceY
      );

      setDragState({
        isDragging: false,
        pieceId: null,
        startClientX: 0,
        startClientY: 0,
        originalPieceX: 0,
        originalPieceY: 0,
        currentPieceX: 0,
        currentPieceY: 0,
        activeGuides: [],
      });
    }
  }, [isPanning, dragState, movePiece]);

  // Ajustar el rollo al ancho visible de la pantalla (Modo óptimo de taller)
  const fitToWidth = useCallback((containerWidthPx: number = 1100) => {
    const targetWidthMm = activeProfile.printableWidthMm || 1120;
    const desiredZoom = Math.round(((containerWidthPx * 0.82) / (targetWidthMm * 0.75)) * 100);
    const clampedZoom = Math.max(30, Math.min(160, desiredZoom));
    setZoomLevel(clampedZoom);
    setPan({ x: 0, y: 20 });
  }, [activeProfile.printableWidthMm]);

  // Ajustar el rollo completo (largo y ancho) para ver la bobina entera
  const fitToAll = useCallback((containerHeightPx: number = 650, rollLengthMm: number = 4000) => {
    const totalRollMm = Math.max(800, rollLengthMm);
    const desiredZoom = Math.round(((containerHeightPx * 0.85) / (totalRollMm * 0.75)) * 100);
    const clampedZoom = Math.max(12, Math.min(80, desiredZoom));
    setZoomLevel(clampedZoom);
    setPan({ x: 0, y: 10 });
  }, []);

  // Manejador de rueda: Rueda normal = scroll vertical / horizontal; Ctrl+Rueda = Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom con Ctrl + Rueda
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoomLevel((current) => {
        const next = Math.round(current * zoomFactor);
        return Math.max(12, Math.min(300, next));
      });
    } else if (e.shiftKey) {
      // Scroll horizontal con Shift + Rueda
      setPan((p) => ({ ...p, x: p.x - e.deltaY }));
    } else {
      // Scroll vertical natural con rueda del ratón
      setPan((p) => ({ ...p, y: p.y - e.deltaY }));
    }
  };

  // Registrar listeners globales para arrastre suave incluso fuera del contenedor
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Atajos de teclado: R (rotar), L (bloquear/desbloquear), Flechas (nudge de 1mm)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el foco está en un input, ignorar atajos
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (!selectedPieceId) return;

      const piece = placedPieces.find((p) => p.id === selectedPieceId);
      if (!piece) return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        rotatePiece(selectedPieceId, 180);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        toggleLockPiece(selectedPieceId);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        movePiece(selectedPieceId, piece.xMm - step, piece.yMm);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        movePiece(selectedPieceId, piece.xMm + step, piece.yMm);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        movePiece(selectedPieceId, piece.xMm, piece.yMm - step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        movePiece(selectedPieceId, piece.xMm, piece.yMm + step);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPieceId, placedPieces, rotatePiece, toggleLockPiece, movePiece]);

  return {
    zoomLevel,
    setZoomLevel,
    pan,
    setPan,
    isPanning,
    dragState,
    mmToPx,
    handlePieceMouseDown,
    handleCanvasMouseDown,
    handleWheel,
    fitToWidth,
    fitToAll,
  };
}
