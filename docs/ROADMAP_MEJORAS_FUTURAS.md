# 🧭 Roadmap de Mejoras de Usabilidad para CimaTex (Pendientes de Análisis e Implementación)

Este documento recopila las oportunidades de optimización y mejoras de experiencia de usuario (UX) identificadas para el taller textil, organizadas por módulo para su evaluación e implementación en próximas fases.

---

## 1. Módulo de Molderías y Patrones (`PatternsView.tsx`)
- [ ] **Alerta visual de moldes incompletos por talla**: 
  - Checklist o badge de estado en cada talla: `Talla M: 4/4 piezas (Completa)` o `Talla L: ⚠️ Falta Manga Izquierda`.
  - Evita sorpresas antes de enviar al generador de prendas.
- [ ] **Duplicación de Moldes Maestros**:
  - Botón "Duplicar Molde" para crear variantes (ej: Cuello V a partir de Cuello Redondo) conservando mangas y espalda.
- [ ] **Curva de crecimiento visual superpuesta**:
  - Vista comparativa de siluetas de tallas superpuestas (S, M, L, XL, XXL) para validar la graduación y proporciones antes de corte.

---

## 2. Módulo de Diseños Maestros y Tipografías (`DesignsView.tsx` / `DorsalConfigModal.tsx`)
- [ ] **Limpieza y optimización automática de SVGs de Illustrator**:
  - Filtro automático de pre-procesamiento para eliminar máscaras de recorte redundantes (`clipPath`), guías y capas invisibles.
- [ ] **Placeholders de Escudos y Patrocinadores (SVG/Imagen Dinámica)**:
  - Extender los placeholders más allá de `{{NOMBRE}}` y `{{NUMERO}}` para permitir insertar logotipos de sponsors que escalen proporcionalmente con la talla.
- [ ] **Previsualización de Ensamble de Prenda (Mockup 2D Plano)**:
  - Vista combinada donde el delantero y las mangas se vean unidos para verificar la continuidad visual de degradados y franjas.

---

## 3. Módulo de Pedidos y Nóminas (`NewOrderView.tsx`)
- [ ] **Pegado Directo desde Excel (`Ctrl + V`)**:
  - Área de pegado rápido de nóminas de jugadores directamente desde el portapapeles sin necesidad de guardar y cargar el archivo `.xlsx`.
- [ ] **Alerta preventiva de dorsales duplicados**:
  - Detección inmediata en la nómina si dos jugadores tienen asignado el mismo número.
- [ ] **Cálculo previo de metraje de tela estimado**:
  - Indicador anticipado antes de generar: *"Este pedido requerirá aproximadamente ~8.5 metros de tela"*.

---

## 4. Revisión de Entallado y Calibración en Vivo (`GarmentInspectionTab.tsx`)
- [ ] **Comparativa lado a lado entre extremos de talla (S vs XXL)**:
  - Comparar la prenda más pequeña y la más grande en la misma pantalla para garantizar que los dorsales no invadan cuellos ni hombros.
- [ ] **Zona de advertencia de margen de costura**:
  - Alerta visual en naranja/rojo si el dorsal o nombre queda a menos de 15 mm del margen de corte o dobladillo.
- [ ] **Arrastre directo en canvas (Drag & Drop de Dorsales)**:
  - Posibilidad de mover el número o nombre haciendo clic y arrastrando directamente sobre la prenda en pantalla.

---

## 5. Nesting y Tizado de Rollo (`ProductionNestingView.tsx`)
- [ ] **Atajos de teclado para rotación rápida**:
  - Presionar la tecla `R` o `Barra Espaciadora` mientras se arrastra una pieza para rotarla 90° de inmediato.
- [ ] **Líneas de corte transversal (Marcas de Guillotina/Tijera)**:
  - Insertar líneas guía de corte por tandas o cada X metros para facilitar el trabajo en la calandra rotativa o plancha plana.
- [ ] **Detección visual de solapamiento en nesting manual**:
  - Resaltar en rojo brillante si dos piezas se tocan o solapan accidentalmente al ser movidas a mano.

---

## 6. Exportación para Impresión (`ExportModal.tsx`)
- [ ] **Hoja de Taller y Ficha de Control (PDF A4)**:
  - Documento imprimible en A4 con la nómina, miniaturas y casillas de verificación para que las costureras tachen las prendas conforme las arman.
- [ ] **Nomenclatura inteligente configurable**:
  - Generación de nombres de archivo con formato de taller: `[CLIENTE]_[EQUIPO]_[CANTIDAD]U_[ANCHO]MM.svg`.

---

## 7. Historial de Producción y Reimpresión (`HistoryView.tsx`)
- [ ] **Persistencia automática al exportar**:
  - Registrar en la base de datos local y central cada rollo exportado con fecha, cliente, cantidad y metraje consumido.
- [ ] **Función de "Reimpresión de Pieza Aislada / Reposición Rápida"**:
  - Buscar un pedido antiguo, seleccionar al jugador y la pieza rota o manchada (ej: "Manga Izquierda de Mateo #10") y descargar el SVG unitario en 5 segundos.
