# entallador-codecima

**HMB Entallador** — Aplicación de escritorio (Electron + React) para automatizar la producción de uniformes deportivos por sublimación: desde el pedido en Excel hasta el nesting vectorial 1:1 sobre bobina de papel transfer para plotters Epson y Mimaki RasterLink.

## Funcionalidades

- **Nuevo Pedido**: importación de nómina de jugadores desde Excel con validación
- **Diseños**: biblioteca de diseños maestros SVG (frente, espalda y manga) con nombres y dorsales vectorizados
- **Moldes**: patrones base vectoriales por talla con medidas en cm
- **Entallado / Nesting**: optimización 2D automática sobre bobina continua
- **Exportación**: PDF vectorial 1:1 (con `/UserUnit` para rollos largos), SVG, EPS y resumen Excel/CSV
- **Apariencia**: tema claro/oscuro con persistencia y fuente Roboto en todo el sistema

## Stack

React · TypeScript · Tailwind CSS · Zustand · SQLite (sql.js + IndexedDB) · Vite · Electron · Vitest

## Scripts

```bash
npm install
npm run dev      # desarrollo (Vite + Electron)
npm run build    # build de producción
npm test         # suite de tests (Vitest)
```
