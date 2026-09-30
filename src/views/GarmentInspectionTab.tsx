import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  CheckCircle2, 
  ArrowRight, 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Sliders,
  RotateCcw,
  Type,
  Hash,
  Maximize2,
  Layers,
  Shield,
  X,
  ChevronUp,
  ChevronDown,
  Plus,
  Minus
} from 'lucide-react';
import { GeneratedPiece } from '@/modules/generator/types';
import { useNavigationStore } from '@/modules/navigation/navigationStore';
import { useProfileStore } from '@/modules/settings/profileStore';
import { useGeneratorStore } from '@/modules/generator/generatorStore';

interface GarmentInspectionTabProps {
  generatedPieces: GeneratedPiece[];
  totalGarments: number;
  onProceedToRoll: (scope?: 'ALL' | 'CAMISETA_ONLY' | 'SHORT_ONLY') => void;
}

interface PlayerGarmentGroup {
  orderItemId: string;
  playerName: string;
  playerNumber: string;
  sizeName: string;
  pieces: GeneratedPiece[];
}

export const GarmentInspectionTab: React.FC<GarmentInspectionTabProps> = ({
  generatedPieces,
  totalGarments,
  onProceedToRoll,
}) => {
  const { setCurrentView } = useNavigationStore();
  const { activeProfile } = useProfileStore();
  const { generationConfig, updateConfig } = useGeneratorStore();
  const [showCalibrationPanel, setShowCalibrationPanel] = useState<boolean>(false);

  // Agrupar piezas por cada jugador en la nómina
  const playerGroups = useMemo<PlayerGarmentGroup[]>(() => {
    const map = new Map<string, PlayerGarmentGroup>();
    for (const piece of generatedPieces) {
      const key = piece.orderItemId || `${piece.playerName}_${piece.playerNumber}_${piece.sizeName}`;
      if (!map.has(key)) {
        map.set(key, {
          orderItemId: piece.orderItemId,
          playerName: piece.playerName,
          playerNumber: piece.playerNumber,
          sizeName: piece.sizeName,
          pieces: [],
        });
      }
      map.get(key)!.pieces.push(piece);
    }
    return Array.from(map.values());
  }, [generatedPieces]);

  // Lista de todas las tallas presentes para el filtro rápido
  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    for (const g of playerGroups) {
      set.add(g.sizeName);
    }
    return Array.from(set).sort();
  }, [playerGroups]);

  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('TODAS');
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number>(0);
  const [inspectedPlayerIds, setInspectedPlayerIds] = useState<Set<string>>(new Set());
  const [garmentTypeFilter, setGarmentTypeFilter] = useState<'CAMISETA' | 'SHORT' | 'ALL'>('CAMISETA');

  // Jugadores filtrados por talla
  const filteredPlayers = useMemo(() => {
    if (selectedSizeFilter === 'TODAS') return playerGroups;
    return playerGroups.filter((g) => g.sizeName === selectedSizeFilter);
  }, [playerGroups, selectedSizeFilter]);

  // Jugador activo
  const currentPlayer = filteredPlayers[selectedPlayerIndex] || filteredPlayers[0];

  // Marcar como revisado al cambiar de jugador
  const handleSelectPlayer = (idx: number) => {
    setSelectedPlayerIndex(idx);
    const p = filteredPlayers[idx];
    if (p) {
      setInspectedPlayerIds((prev) => new Set(prev).add(p.orderItemId));
    }
  };

  const handleNextPlayer = () => {
    if (selectedPlayerIndex < filteredPlayers.length - 1) {
      handleSelectPlayer(selectedPlayerIndex + 1);
    }
  };

  const handlePrevPlayer = () => {
    if (selectedPlayerIndex > 0) {
      handleSelectPlayer(selectedPlayerIndex - 1);
    }
  };

  // Helper para traducir y ordenar piezas (Frente -> Espalda -> Mangas -> Shorts)
  const getPieceOrder = (type: string) => {
    if (type.startsWith('DELANTERO')) return 1;
    if (type.startsWith('ESPALDA')) return 2;
    if (type.startsWith('MANGA')) return 3;
    if (type.startsWith('SHORT') || type.startsWith('PANTALONETA')) return 4;
    return 5;
  };

  const sortedPieces = useMemo(() => {
    if (!currentPlayer) return [];
    let pieces = currentPlayer.pieces;
    if (garmentTypeFilter === 'CAMISETA') {
      pieces = pieces.filter((p) => p.pieceType.startsWith('DELANTERO') || p.pieceType === 'ESPALDA' || p.pieceType.startsWith('MANGA'));
    } else if (garmentTypeFilter === 'SHORT') {
      pieces = pieces.filter((p) => p.pieceType.startsWith('SHORT') || p.pieceType.startsWith('PANTALONETA'));
    }
    return [...pieces].sort((a, b) => getPieceOrder(a.pieceType) - getPieceOrder(b.pieceType));
  }, [currentPlayer, garmentTypeFilter]);

  const handleProceedToRoll = () => {
    const scope = garmentTypeFilter === 'CAMISETA'
      ? 'CAMISETA_ONLY'
      : garmentTypeFilter === 'SHORT'
      ? 'SHORT_ONLY'
      : 'ALL';
    onProceedToRoll(scope);
  };

  const hasActiveCalibration = Boolean(
    (generationConfig.nameVerticalOffsetPercent || 0) !== 0 ||
    (generationConfig.nameScaleX || 1.0) !== 1.0 ||
    (generationConfig.nameScaleY || 1.0) !== 1.0 ||
    (generationConfig.numberVerticalOffsetPercent || 0) !== 0 ||
    (generationConfig.numberScaleX || 1.0) !== 1.0 ||
    (generationConfig.numberScaleY || 1.0) !== 1.0 ||
    (generationConfig.sleeveArtOffsetYMm || 0) !== 0 ||
    (generationConfig.frontArtOffsetYMm || 0) !== 0
  );

  // Navegación con flechas del teclado (← y →)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'ArrowRight') {
        if (selectedPlayerIndex < filteredPlayers.length - 1) {
          handleSelectPlayer(selectedPlayerIndex + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (selectedPlayerIndex > 0) {
          handleSelectPlayer(selectedPlayerIndex - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPlayerIndex, filteredPlayers.length]);

  if (playerGroups.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-950">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-500">
          <Eye className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">No hay prendas generadas para revisar</h3>
        <p className="text-xs text-slate-400 max-w-md mb-6">
          Ve a la pestaña "Nuevo Pedido" para cargar tu lista de jugadores desde Excel y generar las piezas de entallado.
        </p>
        <button
          onClick={() => setCurrentView('NEW_ORDER')}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg transition-all"
        >
          Ir a Nuevo Pedido
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* 1. BARRA DE CONTROL PRINCIPAL UNIFICADA (Toolbar Compacta) */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 z-20">
        {/* Izquierda: Filtro de Prendas y Tallas */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setGarmentTypeFilter('CAMISETA')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                garmentTypeFilter === 'CAMISETA'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mostrar camisetas (Frente, Espalda y Mangas)"
            >
              👕 Camisetas
            </button>
            <button
              type="button"
              onClick={() => setGarmentTypeFilter('SHORT')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                garmentTypeFilter === 'SHORT'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mostrar shorts / pantalonetas"
            >
              🩳 Shorts
            </button>
            <button
              type="button"
              onClick={() => setGarmentTypeFilter('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                garmentTypeFilter === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mostrar todo el uniforme"
            >
              🎽 Todo el Pedido
            </button>
          </div>

          {/* Filtro rápido por Talla */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Talla:</span>
            <select
              value={selectedSizeFilter}
              onChange={(e) => {
                setSelectedSizeFilter(e.target.value);
                setSelectedPlayerIndex(0);
              }}
              className="bg-transparent text-emerald-400 font-bold font-mono focus:outline-none cursor-pointer"
            >
              <option value="TODAS" className="bg-slate-900 text-white">Todas ({playerGroups.length})</option>
              {availableSizes.map((sz) => (
                <option key={sz} value={sz} className="bg-slate-900 text-white">
                  T{sz} ({playerGroups.filter(g => g.sizeName === sz).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Centro: Navegación de Jugador con atajos de teclado */}
        {currentPlayer && (
          <div className="flex items-center gap-2 text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 font-mono">
            <button
              onClick={handlePrevPlayer}
              disabled={selectedPlayerIndex === 0}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
              title="Jugador anterior (Flecha Izquierda ←)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white font-bold px-2">
              {currentPlayer.playerName} <span className="text-emerald-400">#{currentPlayer.playerNumber}</span>
              <span className="text-slate-400 font-normal ml-2">({selectedPlayerIndex + 1} de {filteredPlayers.length})</span>
            </span>
            <button
              onClick={handleNextPlayer}
              disabled={selectedPlayerIndex === filteredPlayers.length - 1}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
              title="Siguiente jugador (Flecha Derecha →)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Derecha: Botón de Calibración Rápida y Botón Principal Único */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCalibrationPanel(!showCalibrationPanel)}
            className={`p-2 rounded-lg border transition-all relative flex items-center justify-center cursor-pointer ${
              showCalibrationPanel
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
            }`}
            title="Ajustar posiciones y dorsal (Iconos de calibración)"
          >
            <Sliders className={`w-4 h-4 ${showCalibrationPanel ? 'text-slate-950' : 'text-amber-400'}`} />
            {hasActiveCalibration && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-pulse" />
            )}
          </button>

          <button
            onClick={handleProceedToRoll}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Pasar al Rollo de Impresión</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>

      {/* 2. TIRA HORIZONTAL DE JUGADORES (Compacta) */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-6 py-2 overflow-x-auto flex items-center gap-2 flex-shrink-0 scrollbar-thin">
        {filteredPlayers.map((player, idx) => {
          const isSelected = idx === selectedPlayerIndex;
          const isChecked = inspectedPlayerIds.has(player.orderItemId);
          const hasCamiseta = player.pieces.some((p) => p.pieceType.startsWith('DELANTERO') || p.pieceType === 'ESPALDA' || p.pieceType.startsWith('MANGA'));
          const hasShort = player.pieces.some((p) => p.pieceType.startsWith('SHORT') || p.pieceType.startsWith('PANTALONETA'));
          const isShortOnly = hasShort && !hasCamiseta;
          const isCamisetaOnly = hasCamiseta && !hasShort;

          return (
            <button
              key={player.orderItemId || idx}
              onClick={() => handleSelectPlayer(idx)}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-mono transition-all flex-shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-950/90 border-emerald-500 text-white shadow-md shadow-emerald-950/50 scale-[1.02] font-bold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <User className={`w-3 h-3 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{player.playerName}</span>
              <span className="text-amber-400">#{player.playerNumber}</span>
              <span className="px-1 py-0.2 rounded bg-black/40 text-[10px] text-slate-400">
                T{player.sizeName}
              </span>
              {isShortOnly && (
                <span className="px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 text-[10px] font-sans border border-sky-800/60">
                  🩳 Short
                </span>
              )}
              {isCamisetaOnly && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 text-[10px] font-sans border border-emerald-800/60">
                  👕 Camiseta
                </span>
              )}
              {isChecked && !isSelected && (
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. BARRA DE CALIBRACIÓN COMPACTA (100% Basada en Iconos, + / - y Ajuste de Alto/Ancho) */}
      {showCalibrationPanel && (
        <div className="bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-2 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 z-10 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center gap-3">
            {/* 1. ESPALDA: NOMBRE (Posición Y, Ancho W, Alto H) */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
              <span title="Nombre del Jugador (Espalda)">
                <Type className="w-3.5 h-3.5 text-emerald-400" />
              </span>

              {/* Posición Y */}
              <div className="flex items-center gap-1" title="Posición vertical del nombre (Y: Subir / Bajar)">
                <span className="text-[10px] text-slate-500 font-mono font-bold select-none">Y</span>
                <button
                  type="button"
                  onClick={() => updateConfig({ nameVerticalOffsetPercent: Math.max(-15, (generationConfig.nameVerticalOffsetPercent || 0) - 1) })}
                  className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-colors active:scale-95"
                  title="Subir nombre (Y)"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-[11px] font-mono font-bold min-w-[26px] text-center text-emerald-300">
                  {((generationConfig.nameVerticalOffsetPercent || 0) > 0 ? '+' : '') + (generationConfig.nameVerticalOffsetPercent || 0)}%
                </span>
                <button
                  type="button"
                  onClick={() => updateConfig({ nameVerticalOffsetPercent: Math.min(15, (generationConfig.nameVerticalOffsetPercent || 0) + 1) })}
                  className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-colors active:scale-95"
                  title="Bajar nombre (Y)"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>

              <div className="w-px h-3.5 bg-slate-800" />

              {/* Ancho W */}
              <div className="flex items-center gap-1" title="Ancho del nombre (W: Reducir / Expandir horizontalmente)">
                <span className="text-[10px] text-slate-500 font-mono font-bold select-none">W</span>
                <button
                  type="button"
                  onClick={() => updateConfig({ nameScaleX: Math.max(0.60, Number(((generationConfig.nameScaleX ?? 1.0) - 0.05).toFixed(2))) })}
                  className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-colors active:scale-95"
                  title="Reducir ancho del nombre"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-[11px] font-mono font-bold min-w-[32px] text-center text-emerald-300">
                  {Math.round((generationConfig.nameScaleX ?? 1.0) * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => updateConfig({ nameScaleX: Math.min(1.60, Number(((generationConfig.nameScaleX ?? 1.0) + 0.05).toFixed(2))) })}
                  className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-colors active:scale-95"
                  title="Aumentar ancho del nombre"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>

              <div className="w-px h-3.5 bg-slate-800" />

              {/* Alto H */}
              <div className="flex items-center gap-1" title="Alto del nombre (H: Achicar / Estirar verticalmente)">
                <span className="text-[10px] text-slate-500 font-mono font-bold select-none">H</span>
                <button
                  type="button"
                  onClick={() => updateConfig({ nameScaleY: Math.max(0.60, Number(((generationConfig.nameScaleY ?? 1.0) - 0.05).toFixed(2))) })}
                  className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-colors active:scale-95"
                  title="Reducir alto del nombre"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-[11px] font-mono font-bold min-w-[32px] text-center text-emerald-300">
                  {Math.round((generationConfig.nameScaleY ?? 1.0) * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => updateConfig({ nameScaleY: Math.min(1.60, Number(((generationConfig.nameScaleY ?? 1.0) + 0.05).toFixed(2))) })}
                  className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-colors active:scale-95"
                  title="Aumentar alto del nombre"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* 2. ESPALDA: NÚMERO (Posición Y, Ancho W, Alto H) */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
              <span title="Número del Dorsal (Espalda)">
                <Hash className="w-3.5 h-3.5 text-emerald-400" />
              </span>

              {/* Posición Y */}
              <div className="flex items-center gap-1" title="Posición vertical del número (Y: Subir / Bajar)">
                <span className="text-[10px] text-slate-500 font-mono font-bold select-none">Y</span>
                <button
                  type="button"
                  onClick={() => updateConfig({ numberVerticalOffsetPercent: Math.max(-15, (generationConfig.numberVerticalOffsetPercent || 0) - 1) })}
                  className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-colors active:scale-95"
                  title="Subir número (Y)"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-[11px] font-mono font-bold min-w-[26px] text-center text-emerald-300">
                  {((generationConfig.numberVerticalOffsetPercent || 0) > 0 ? '+' : '') + (generationConfig.numberVerticalOffsetPercent || 0)}%
                </span>
                <button
                  type="button"
                  onClick={() => updateConfig({ numberVerticalOffsetPercent: Math.min(15, (generationConfig.numberVerticalOffsetPercent || 0) + 1) })}
                  className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-colors active:scale-95"
                  title="Bajar número (Y)"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>

              <div className="w-px h-3.5 bg-slate-800" />

              {/* Ancho W */}
              <div className="flex items-center gap-1" title="Ancho del número (W: Reducir / Expandir horizontalmente)">
                <span className="text-[10px] text-slate-500 font-mono font-bold select-none">W</span>
                <button
                  type="button"
                  onClick={() => updateConfig({ numberScaleX: Math.max(0.60, Number(((generationConfig.numberScaleX ?? (generationConfig.numberScaleFactor ?? 1.0)) - 0.05).toFixed(2))) })}
                  className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-colors active:scale-95"
                  title="Reducir ancho del número"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-[11px] font-mono font-bold min-w-[32px] text-center text-emerald-300">
                  {Math.round((generationConfig.numberScaleX ?? (generationConfig.numberScaleFactor ?? 1.0)) * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => updateConfig({ numberScaleX: Math.min(1.60, Number(((generationConfig.numberScaleX ?? (generationConfig.numberScaleFactor ?? 1.0)) + 0.05).toFixed(2))) })}
                  className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-colors active:scale-95"
                  title="Aumentar ancho del número"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>

              <div className="w-px h-3.5 bg-slate-800" />

              {/* Alto H */}
              <div className="flex items-center gap-1" title="Alto del número (H: Achicar / Estirar verticalmente)">
                <span className="text-[10px] text-slate-500 font-mono font-bold select-none">H</span>
                <button
                  type="button"
                  onClick={() => updateConfig({ 
                    numberScaleY: Math.max(0.60, Number(((generationConfig.numberScaleY ?? (generationConfig.numberScaleFactor ?? 1.0)) - 0.05).toFixed(2))),
                    numberScaleFactor: Math.max(0.60, Number(((generationConfig.numberScaleY ?? (generationConfig.numberScaleFactor ?? 1.0)) - 0.05).toFixed(2)))
                  })}
                  className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-colors active:scale-95"
                  title="Reducir alto del número"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-[11px] font-mono font-bold min-w-[32px] text-center text-emerald-300">
                  {Math.round((generationConfig.numberScaleY ?? (generationConfig.numberScaleFactor ?? 1.0)) * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => updateConfig({ 
                    numberScaleY: Math.min(1.60, Number(((generationConfig.numberScaleY ?? (generationConfig.numberScaleFactor ?? 1.0)) + 0.05).toFixed(2))),
                    numberScaleFactor: Math.min(1.60, Number(((generationConfig.numberScaleY ?? (generationConfig.numberScaleFactor ?? 1.0)) + 0.05).toFixed(2)))
                  })}
                  className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-colors active:scale-95"
                  title="Aumentar alto del número"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* 3. MANGA: FRANJA / PUÑO (Posición Y y presets) */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
              <div className="flex items-center gap-1" title="Posición vertical franja manga (evita costura de dobladillo)">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] text-slate-500 font-mono font-bold select-none">Y</span>
                <button
                  type="button"
                  onClick={() => updateConfig({ sleeveArtOffsetYMm: Math.max(-45, (generationConfig.sleeveArtOffsetYMm || 0) - 2) })}
                  className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-colors active:scale-95"
                  title="Subir franja (Y)"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-[11px] font-mono font-bold min-w-[38px] text-center text-amber-300">
                  {((generationConfig.sleeveArtOffsetYMm || 0) > 0 ? '+' : '') + (generationConfig.sleeveArtOffsetYMm || 0)}
                  <span className="text-[9px] text-slate-500 font-normal ml-0.5">mm</span>
                </span>
                <button
                  type="button"
                  onClick={() => updateConfig({ sleeveArtOffsetYMm: Math.min(20, (generationConfig.sleeveArtOffsetYMm || 0) + 2) })}
                  className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-colors active:scale-95"
                  title="Bajar franja (Y)"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateConfig({ sleeveArtOffsetYMm: -15 })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                    generationConfig.sleeveArtOffsetYMm === -15
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-amber-300 border border-slate-800'
                  }`}
                  title="Subir 15 mm (Dobladillo estándar)"
                >
                  -15
                </button>
                <button
                  type="button"
                  onClick={() => updateConfig({ sleeveArtOffsetYMm: -20 })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                    generationConfig.sleeveArtOffsetYMm === -20
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-amber-400 hover:text-amber-300 border border-amber-500/40'
                  }`}
                  title="Subir 20 mm (Recomendado confección: franja visible al borde de la basta)"
                >
                  -20
                </button>
                <button
                  type="button"
                  onClick={() => updateConfig({ sleeveArtOffsetYMm: -25 })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                    generationConfig.sleeveArtOffsetYMm === -25
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-amber-300 border border-slate-800'
                  }`}
                  title="Subir 25 mm (Dobladillo ancho)"
                >
                  -25
                </button>
              </div>
            </div>

            {/* 4. FRENTE: LOGOS / ESCUDO */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
              <div className="flex items-center gap-1" title="Posición vertical logos y escudo en el pecho (Y)">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[10px] text-slate-500 font-mono font-bold select-none">Y</span>
                <button
                  type="button"
                  onClick={() => updateConfig({ frontArtOffsetYMm: Math.max(-30, (generationConfig.frontArtOffsetYMm || 0) - 2) })}
                  className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-colors active:scale-95"
                  title="Subir logos frente (Y)"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-[11px] font-mono font-bold min-w-[38px] text-center text-sky-300">
                  {((generationConfig.frontArtOffsetYMm || 0) > 0 ? '+' : '') + (generationConfig.frontArtOffsetYMm || 0)}
                  <span className="text-[9px] text-slate-500 font-normal ml-0.5">mm</span>
                </span>
                <button
                  type="button"
                  onClick={() => updateConfig({ frontArtOffsetYMm: Math.min(30, (generationConfig.frontArtOffsetYMm || 0) + 2) })}
                  className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-colors active:scale-95"
                  title="Bajar logos frente (Y)"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Acciones: Restablecer y Cerrar */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => {
                updateConfig({
                  nameVerticalOffsetPercent: 0,
                  nameScaleX: 1.0,
                  nameScaleY: 1.0,
                  numberVerticalOffsetPercent: 0,
                  numberScaleFactor: 1.0,
                  numberScaleX: 1.0,
                  numberScaleY: 1.0,
                  sleeveArtOffsetYMm: 0,
                  frontArtOffsetYMm: 0,
                });
              }}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              title="Restablecer todos los ajustes a valores iniciales"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowCalibrationPanel(false)}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Cerrar barra de calibración"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. ÁREA CENTRAL: VISOR MAXIMIZADO DE LAS PRENDAS */}
      {currentPlayer && (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {sortedPieces.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[380px] p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mb-4 text-3xl shadow-inner">
                {currentPlayer.pieces.some(p => p.pieceType.startsWith('SHORT') || p.pieceType.startsWith('PANTALONETA')) ? '🩳' : '👕'}
              </div>
              <h3 className="text-base font-bold text-white mb-2 font-mono">
                {currentPlayer.playerName} (#{currentPlayer.playerNumber}) no tiene piezas de {garmentTypeFilter === 'CAMISETA' ? 'Camiseta' : 'Short'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                En el archivo Excel, este jugador está registrado con pedido de{' '}
                <span className="text-amber-400 font-bold uppercase font-mono">
                  {currentPlayer.pieces.some(p => p.pieceType.startsWith('SHORT') || p.pieceType.startsWith('PANTALONETA')) ? 'Solo Short' : 'Solo Camiseta'}
                </span>
                . Tu filtro superior está en "{garmentTypeFilter === 'CAMISETA' ? 'Camisetas' : 'Shorts'}".
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setGarmentTypeFilter(garmentTypeFilter === 'CAMISETA' ? 'SHORT' : 'CAMISETA')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>{garmentTypeFilter === 'CAMISETA' ? '🩳 Ver Shorts de este jugador' : '👕 Ver Camiseta de este jugador'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGarmentTypeFilter('ALL')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                >
                  <span>🎽 Ver Todo el Pedido</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {sortedPieces.map((piece) => {
                const isEspalda = piece.pieceType === 'ESPALDA';
                const isDelantero = piece.pieceType.startsWith('DELANTERO');
                const isManga = piece.pieceType.startsWith('MANGA');

                return (
                  <div
                    key={piece.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between transition-all group"
                  >
                    {/* Header de la tarjeta */}
                    <div className="px-3.5 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          isEspalda ? 'bg-emerald-400' : isDelantero ? 'bg-sky-400' : 'bg-amber-400'
                        }`} />
                        <span className="font-bold text-white">
                          {piece.pieceType.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {piece.bbox.width.toFixed(0)} × {piece.bbox.height.toFixed(0)} mm
                      </span>
                    </div>

                    {/* Visor SVG de la pieza: Grande, centrado y limpio */}
                    <div className="p-4 bg-[#080b11] flex items-center justify-center relative min-h-[380px] h-[430px] overflow-hidden select-none">
                      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-30 pointer-events-none" />

                      <svg
                        viewBox={`0 -4 ${piece.bbox.width} ${piece.bbox.height + 16}`}
                        className="w-full h-full max-h-[410px] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)] transition-transform duration-200 group-hover:scale-[1.02]"
                        preserveAspectRatio="xMidYMid meet"
                        dangerouslySetInnerHTML={{ __html: piece.svgContent || '' }}
                      />
                    </div>

                    {/* Footer limpio y minimalista */}
                    <div className="px-3.5 py-2 bg-slate-950 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      {isEspalda ? (
                        <span className="text-white font-bold">
                          {piece.playerName} <span className="text-emerald-400">#{piece.playerNumber}</span>
                        </span>
                      ) : isDelantero ? (
                        <span className="text-slate-300 font-medium">Delantero Sublimación</span>
                      ) : isManga ? (
                        <span className="text-slate-300 font-medium">Manga Sublimación</span>
                      ) : (
                        <span className="text-slate-300 font-medium">Pantaloneta</span>
                      )}
                      <span className="text-emerald-400/90 text-[10px] font-semibold">Corte 1:1</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
