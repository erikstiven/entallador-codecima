# 🧵 CimaPattern (HMB Entallador) — Documentación Técnica y Arquitectura del Sistema

> **Guía maestra para desarrolladores, colaboradores e ingenieros de software.**  
> Este documento detalla la arquitectura, módulos, algoritmos matemáticos/geométricos, flujo de datos y hoja de ruta (roadmap) para continuar el desarrollo y optimización de **CimaPattern**.

---

## 📌 1. Visión y Propósito del Sistema

**CimaPattern** es una plataforma web y de escritorio (Electron + React + Vite + TypeScript) diseñada para la **industria de confección y sublimación deportiva**. Automatiza el flujo completo de producción:

```
[ Excel con Nómina de Jugadores ]
               ↓
[ Diseños Maestros Vectoriales + Tipografía en Curvas ]
               ↓
[ Moldes y Patrones Base por Talla (cm/mm) ]
               ↓
[ Motor Generador 1:1: Fusión Vectorial de Arte + Molde + Jugador ]
               ↓
[ Motor de Nesting Industrial Continuo (Camisetas / Shorts / Mangas) ]
               ↓
[ Exportación Calibrada 1:1 (PDF RasterLink / SVG / EPS / Excel) ]
```

---

## 🏗️ 2. Stack Tecnológico

| Capa | Tecnologías | Propósito |
|---|---|---|
| **Frontend UI** | React 18, TypeScript, Tailwind CSS, Lucide Icons | Interfaz reactiva, paneles de inspección y lienzos interactivos |
| **Estado Global** | Zustand | Gestión de estado reactivo por módulos (pedidos, diseños, moldes, generador, nesting) |
| **Motor Geométrico** | Clipper2 (WASM), Polygons 2D, Bounding Boxes | Operaciones booleanas, offsets de costura e intersecciones poligonales |
| **Motor Tipográfico** | OpenType.js, Google Fonts API, FontManager | Conversión de fuentes TTF a trazados vectoriales nativos `<path d="..." />` |
| **Persistencia Local** | SQLite (sql.js WASM + IndexedDB) | Base de datos relacional embebida para guardar diseños, moldes, pedidos y configuraciones |
| **Exportación 1:1** | svg2pdf.js, pdf-lib, ExcelJS | Generación de archivos físicos 1:1 para RIPs Mimaki RasterLink, Epson y Adobe Illustrator |
| **Pruebas y QA** | Vitest (105+ tests automáticos) | Verificación matemática y de integración continua |

---

## 📂 3. Estructura de Directorios

```
hmb-entallador/
├── public/
│   └── fonts/                     # Fuentes TTF oficiales (Anton, Bebas Neue, Fjalla One, etc.)
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx            # Navegación principal de la aplicación
│   │   └── textile/               # Componentes visuales de prendas textiles
│   │       ├── SvgTextilePreview.tsx      # Visor SVG con normalización de artboards
│   │       ├── TextilePieceCard.tsx       # Tarjeta de pieza individual
│   │       └── TextilePieceCarousel.tsx   # Carrusel interactivo de piezas
│   ├── core/
│   │   ├── database/              # Capa de base de datos SQLite (sql.js)
│   │   │   ├── db.ts              # Inicialización, tablas y semillas
│   │   │   └── schema.sql         # Esquema de base de datos relacional
│   │   ├── fonts/                 # Motor tipográfico y conversión a curvas
│   │   │   ├── fontManager.ts     # Sincronización y caché de fuentes TTF locales
│   │   │   ├── googleFonts.ts     # Integración con Google Fonts
│   │   │   └── textVectorEngine.ts# Conversión de texto SVG a <path> curvas con OpenType
│   │   ├── geometry/              # Geometría computacional
│   │   │   ├── clipperService.ts  # Wrapper Clipper2 WASM
│   │   │   ├── transform.ts       # Rotaciones, traslaciones y bounding boxes
│   │   │   └── types.ts           # Definiciones de puntos, polígonos y bboxes
│   │   ├── nesting/               # MOTORES DE ENTALLADO / NESTING
│   │   │   ├── modularNestingEngine.ts # Motor industrial continuo por columnas y 90°
│   │   │   ├── nestingEngine.ts        # Motor guillotine / bin-packing básico
│   │   │   ├── polygonal/              # Motor poligonal NFP (No-Fit Polygon)
│   │   │   ├── nestingStore.ts         # Estado Zustand del lienzo y acomodo
│   │   │   └── types.ts                # Interfaces de piezas colocadas, pliegos y métricas
│   │   ├── svg/                   # Procesamiento y limpieza SVG
│   │   │   ├── namespaceSvgIds.ts      # Desambiguación de IDs y clases CSS para Illustrator
│   │   │   ├── svgArtboardNormalizer.ts# Eliminación no destructiva de mesas de trabajo/fondos
│   │   │   └── svgPathParser.ts        # Parser de strings SVG path a coordenadas numéricas
│   │   └── units/
│   │       └── units.ts           # Conversión mm, cm, pt (PostScript), px
│   ├── modules/
│   │   ├── canvas/                # Lienzo interactivo y guías magnéticas (snapping)
│   │   ├── designs/               # Gestión de diseños maestros y capas de corte
│   │   ├── export/                # Exportadores 1:1 a PDF, SVG, EPS, Excel y CSV
│   │   ├── generator/             # Fusión de molde + diseño + nombre/número por jugador
│   │   ├── orders/                # Parser e importador de Excel (.xlsx / .csv)
│   │   ├── patterns/              # Biblioteca de patrones y moldes graduados por talla
│   │   └── settings/              # Perfiles de producción y calibración de plotter
│   └── views/
│       ├── NewOrderView.tsx       # Paso 1: Carga de pedido Excel y preflight
│       ├── DesignsView.tsx        # Paso 2: Diseños maestros y tipografía
│       ├── GarmentInspectionTab.tsx # Paso 3: Revisión 3D/2D por jugador
│       └── ProductionNestingView.tsx# Paso 4: Lienzo de nesting, bobinas y exportación
```

---

## ⚙️ 4. Explicación Detallada de los Módulos Clave

### 📥 4.1. Importación de Pedidos (`src/modules/orders/`)
- **Archivo:** `excelParser.ts`
- **Función:** Lee archivos `.xlsx` y `.csv`, detecta dinámicamente columnas como *Nombre*, *Número*, *Talla*, *Tipo de Prenda*, *Posición* y *Observaciones*.
- **Manejo de Caracteres Especiales:** Sanitiza automáticamente caracteres UTF-8, tildes y la letra `Ñ`.

---

### 🎨 4.2. Diseños Maestros y Tipografías (`src/core/fonts/` y `src/modules/designs/`)
- **Conversión de Texto a Curvas (`textVectorEngine.ts`):**
  - Para evitar que los plotters de impresión sustituyan tipografías en el RIP, el sistema convierte todo `<text>` de nombre y número en vectores nativos `<path d="..." />` usando `opentype.js`.
- **Preflight Tipográfico:**
  - Si una fuente no tiene curvas o no está sincronizada, el sistema avisa con sugerencias sin bloquear la producción.
- **Normalizador de Mesas de Trabajo (`svgArtboardNormalizer.ts`):**
  - Remueve rectángulos blancos/transparentes generados por Adobe Illustrator o CorelDraw que causan pantallas negras o medidas incorrectas, preservando el 100% de las ilustraciones.

---

### ✂️ 4.3. Motor Generador de Uniformes (`src/modules/generator/`)
- **Archivo:** `garmentGenerator.ts`
- **Funcionamiento:**
  1. Toma la talla del jugador y busca el molde correspondiente en la base de datos.
  2. Escala el diseño maestro al bounding box del molde.
  3. Inserta el nombre y número en las posiciones relativas exactas en curvas vectoriales.
  4. Aplica la máscara de recorte del molde (`clipPath`) para crear la pieza lista para sublimación.

---

### 📐 4.4. Motor de Nesting Modular Continuo (`src/core/nesting/modularNestingEngine.ts`)

Este es el núcleo de optimización de tela para rollos continuos (1120 mm, 1600 mm, 1800 mm, 1900 mm).

#### Lógica del Algoritmo:
1. **Separación por Prenda:** Las Camisetas y las Pantalonetas/Shorts se dividen automáticamente en pliegos/archivos independientes (`PARTE 1 — Camisetas`, `PARTE 2 — Shorts`).
2. **Distribución en 3 Columnas Continuas:**
   - **Columna 1 (Izquierda, $X \approx 5\text{ mm}$):** Delanteros apilados verticalmente de forma continua.
   - **Columna 2 (Centro, $X \approx 420\text{ mm}$):** Espaldas apiladas verticalmente de forma continua.
   - **Columna 3 (Derecha, $X \approx 820\text{ mm}$):** Mangas **rotadas 90° en vertical** pegadas al margen derecho con el dobladillo recto hacia el interior y la copa hacia el borde.
3. **Flujo Continuo sin Vacíos:** Las piezas fluyen de manera continua sin encerrar al jugador en cajas rectangulares ficticias, logrando un **aprovechamiento superior al 85-90%**.
4. **Particionado Automático $\le 500\text{ cm}$:** Cada pliego se limita al largo máximo configurado (por ejemplo, 5.0 metros) para evitar archivos excesivamente pesados en el RIP.

---

### 🖨️ 4.5. Motor de Exportación 1:1 (`src/modules/export/`)
- **Formatos Disponibles:**
  - **PDF Industrial 1:1 (`pdfExporter.ts`):** Compatible con Mimaki RasterLink 6/7 y Epson Edge Print. Utiliza `/UserUnit` para rollos largos que superen los 14.400 puntos PostScript.
  - **SVG Limpio 1:1 (`svgExporter.ts`):** Con unidades físicas milimétricas explícitas (`width="1120mm"` y `viewBox="0 0 1120 ..."`).
  - **EPS Level 3 (`epsExporter.ts`):** Con encabezados `%%BoundingBox` y `%%HiResBoundingBox` calibrados para Adobe Illustrator y CorelDraw.
  - **Excel y CSV (`productionSummaryExporter.ts`):** Ficha técnica con desglose por jugador, talla, piezas y consumo de metros lineales.

---

## 🚀 5. Guía de Puesta en Marcha (Para Nuevos Desarrolladores)

### Prerrequisitos
- **Node.js:** v18 o superior
- **NPM:** v9 o superior

### Instalación y Ejecución
```bash
# 1. Clonar el repositorio
git clone https://github.com/CodeCima/entallador-codecima.git
cd entallador-codecima

# 2. Instalar dependencias
npm install

# 3. Iniciar entorno de desarrollo web
npm run dev
# Disponible en: http://localhost:5173

# 4. Ejecutar suite de pruebas automáticas
npm test

# 5. Comprobar tipos de TypeScript (0 errores requerido)
npx tsc --noEmit
```

---

## 🗺️ 6. Hoja de Ruta y Próximas Mejoras (Roadmap)

Si eres un desarrollador integrándote al proyecto, estas son las áreas prioritarias de mejora y expansión:

### 1. Algoritmo de Nesting Poligonal con Rotaciones Libres (Clipper2 NFP)
- **Objetivo:** Para piezas irregulares accesorias (cuellos en V, vivos, ribetes, medias), implementar un empaquetado poligonal que encaje piezas dentro de las concavidades de los cuellos de las camisetas.
- **Ubicación:** `src/core/nesting/polygonal/`

### 2. Editor Visual de Puntos de Molde (Graduación Interactiva)
- **Objetivo:** Permitir al usuario arrastrar nodos vectoriales en el navegador para ajustar el ancho de hombro, largo de talle o curvatura de sisa directamente en la vista de Moldes.
- **Ubicación:** `src/views/` y `src/modules/patterns/`

### 3. Integración Directa con RIPs mediante Hot Folders
- **Objetivo:** En la versión Electron, permitir configurar una carpeta de red compartida (Hot Folder de RasterLink / Caldera) para que al pulsar "Exportar" el PDF se guarde directamente en la cola de impresión del plotter.
- **Ubicación:** `src/modules/export/`

### 4. Soporte Multi-Prenda Avanzado
- **Objetivo:** Añadir presets oficiales para buzos con capucha, chaquetas rompevientos, chalecos y uniformes de baloncesto (básquet).

---

## 📄 7. Licencia y Créditos
- **Desarrollado para:** CodeCima / HMB Sublimación Textil.
- **Licencia:** Propietaria / Comercial.
