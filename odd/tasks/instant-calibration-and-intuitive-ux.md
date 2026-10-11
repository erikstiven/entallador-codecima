# ODD Feature: Calibración Instantánea (< 50ms) y UI Visual Intuitiva de Calibración

## Objetivo
Eliminar por completo el congelamiento de ~60 segundos al calibrar pedidos de 40+ camisas en `GarmentInspectionTab.tsx` y rediseñar el panel de calibración para que sea 100% visual, dinámico y comprensible a simple vista para cualquier operador sin conocimientos técnicos.

## Problema y Causa Raíz
1. **Inversión de orden de caché en `garmentGenerator.ts` + bucle $O(K \times N)$ en `namespaceSvgIds.ts` (~45-50s del bloqueo):**
   - `getCachedScaledArtwork` inyectaba `y="${artOffsetY}"` antes de `getCachedNamespacedArtwork`, e incluía `artOffsetY` en la clave de caché del namespacing. Cada ajuste de 1mm invalidaba la caché de todas las tallas y volvía a ejecutar `namespaceSvgIds` sobre SVGs de Illustrator de 2–4 MB.
   - `namespaceSvgIds` ejecutaba 5 pasadas de expresiones regulares sobre todo el string SVG por cada uno de los 800–1,500 IDs del diseño (~5,000 escaneos completos por talla).
2. **Recálculo redundante por jugador en `garmentGenerator.ts` (~8-10s):**
   - Dentro del bucle de 40 jugadores se recalculaban `computeBoundingBox`, el espejado de mangas/pantalonetas y la vectorización OpenType de dorsales aunque solo hubiera cambiado el desplazamiento vertical del arte de manga o pecho.
3. **Triple re-parseo DOM de SVGs multimillonarios y regex en `GarmentInspectionTab.tsx` (~3-5s):**
   - `applyCalibrationChange` disparaba 3 renders por clic (`setSyncPulse(true)`, `rawUpdateConfig`, `setSyncPulse(false)`).
   - `<g dangerouslySetInnerHTML={{ __html: pieceSvg }} />` creaba un objeto nuevo en cada render y `pieceSvg.match(/<path.../i)` escaneaba 2 MB de SVG por tarjeta en cada render.
4. **Interfaz de Calibración Estática y Técnica:**
   - El panel anterior mostraba códigos técnicos (`Y -20mm`, `W 100% H 100%`, `Escala X/Y`) que no eran intuitivos para un operador de planta.

## Alcance Autorizado y Restricciones
- **Hardware objetivo:** Laptops comerciales de 8 GB RAM y 512 GB SSD (60 FPS constantes, uso mínimo de RAM).
- **Cero código hardcodeado ni regresiones:** Mantener compatibilidad total con los 142 tests del proyecto y el pipeline de exportación 1:1.
- **Configuración TDD / Verificación:** Modo funcional estándar (`npx vitest run` y `npx vite build`).
- **Estrategia de entrega:** `ask-on-risk` (RDD CLI `gentle-ai` estado: `unavailable`).

## Checklist de Tareas (3 Agentes en Paralelo)
- [x] **TASK-1 (Agente 1 - Implementador de Motor y Caché Instantáneo):** Ruta: `delegated direct` (Trigger: Preparation + Writer en `src/core/svg/namespaceSvgIds.ts`, `src/modules/generator/garmentGenerator.ts`, `src/modules/generator/generatorStore.ts`, `src/modules/generator/types.ts`).
  - Reescrito `namespaceSvgIds.ts` en una sola pasada $O(N)$ sobre el SVG usando búsquedas $O(1)$ en `Set`, aislando selectores CSS antes de `{` para proteger colores hexadecimales (`#fff`, `#ff00aa`).
  - Invertido el orden en `garmentGenerator.ts`: `getCachedNormalizedNamespacedArtwork` normaliza y aplica `namespaceSvgIds` una sola vez por `(designId, pieceType, preserveAspectRatioMode, artFingerprint)` antes de envolver con `<svg x="0" y="${artOffsetY}" width="${w}" height="${h}">` (limpiando `x`/`y` previos).
  - Pre-cacheada la geometría de moldes por talla (`moldGeometryCache`) y la vectorización OpenType de dorsales/tallas (`dorsalVectorCache`, `sizeMarkVectorCache`).
  - Añadido `svgPathData` en `PieceSvgTemplate` y exportada `getPieceMoldPath(piece)` para acceso $O(1)$ sin regex.
  - Evidencia: Commit `c913484` | RDD: `unavailable`.
- [x] **TASK-2 (Agente 2 - Corrector y Diseñador de UI de Calibración Visual Intuitiva):** Ruta: `delegated direct` (Trigger: Writer en `src/views/GarmentInspectionTab.tsx`).
  - Extraída `InspectionPieceCard` con `React.memo`, memoizando `{ __html: pieceSvg }` y usando `getPieceMoldPath(piece)` en $O(1)$ sin regex sobre el SVG.
  - Eliminado el retardo artificial (`setTimeout 40ms`) y los 3 re-renders por clic en `applyCalibrationChange`.
  - Rediseñado el Panel de Calibración con guía visual paso a paso libre de tecnicismos: 4 tarjetas/zonas grandes interactivas (**👕 Mangas**, **🔢 Espalda (Nombre y Número)**, **🛡️ Pecho / Frente**, **🩳 Pantaloneta**) con resaltado dinámico de la pieza activa en la grilla inferior (`🎯 Ajustando esta pieza en vivo`), diagrama visual del margen de costura/basta en vivo, botones en lenguaje humano claro (`⬆️ Subir Dibujo`, `⬇️ Bajar Dibujo`, `🔍− Más Pequeño`, `🔍+ Más Grande`, `↔️ Más Delgado / Más Ancho`) y botones rápidos de 1 clic (`⭐ Subir 2 cm - Basta recomendada`).
  - Evidencia: Commit `20c1cb7` (Nota sobre heurística de tamaño: `GarmentInspectionTab.tsx` consolida los componentes visuales memoizados y controles paso a paso en un mismo archivo de vista auto-contenido para claridad y cohesión) | RDD: `unavailable`.
- [x] **TASK-3 (Agente 3 - Feedback en Tiempo Real, Auditoría QA y Pruebas de Rendimiento):** Ruta: `delegated direct` (Trigger: Verificación cruzada y pruebas en `src/core/svg/namespaceSvgIds.test.ts` y `src/modules/generator/garmentGenerator.test.ts`).
  - Auditada en tiempo real la integración entre `namespaceSvgIds.ts`, `svgArtboardNormalizer.ts`, `garmentGenerator.ts` y `GarmentInspectionTab.tsx`.
  - Añadidas pruebas de colores hexadecimales en `<style>`, `shortArtOffsetYMm`, roundtrip `0 -> -20 -> 0`, benchmark de 1,000 IDs de Illustrator (< 15ms vs 557ms previos) y benchmark de recalibración de 40 camisas (~15-20ms por ajuste vs 60,000ms previos).
  - Evidencia: Commit `c913484` | `npx vitest run` (29 test files passed, 142 tests passed) | `npx vite build` (exit 0) | RDD: `unavailable`.

## Evidencia de Verificación y Próximo Paso
- `npx vitest run`: **29 archivos pasados (142/142 tests en verde)**.
- Benchmark `namespaceSvgIds` (1,000 IDs + 300 clases): **11–15 ms** (antes 557.5 ms).
- Benchmark de Calibración de 40 Camisas (5 ajustes seguidos = 800 piezas): **~15–20 ms por ajuste** (antes ~60,000 ms).
- `npx vite build`: **0 errores**.
- **Próximo paso:** Listo para prueba interactiva del usuario en `http://localhost:5174/` / ventana Electron o `git push` cuando el usuario lo indique.
