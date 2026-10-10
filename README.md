# 🧵 CimaPattern (HMB Entallador)

> **Plataforma Industrial de Entallado, Graduación Textil y Nesting 1:1 sobre Bobina Continua para Sublimación.**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white)](https://vitest.dev/)

---

## 📖 Documentación y Gestión del Proyecto

- 📘 **Guía de Arquitectura del Sistema:** 👉 **[DOCUMENTACION_SISTEMA.md](./DOCUMENTACION_SISTEMA.md)**
- 📌 **Gestión de Features, Roadmap y Tareas en Notion:** 👉 **[Espacio de Trabajo en Notion](https://www.notion.so/)** *(Revisa el panel de gestión para seguimiento de features, backlog y especificaciones de producto)*

---

## ⚡ Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Correr pruebas unitarias e integradas
npm test

# 4. Compilar aplicación
npm run build
```

---

## 🎯 Características Principales

1. **Importación Inteligente:** Carga de nóminas deportivas desde Excel (.xlsx / .csv) con soporte UTF-8 (tildes y Ñ).
2. **Diseños Maestros y Tipografías:** Vectorización automática de dorsales y nombres con OpenType.js a curvas nativas `<path>`.
3. **Moldes y Graduación 1:1:** Patrones base por talla con medidas reales en centímetros y milímetros.
4. **Nesting Modular Continuo:** Distribución en 3 columnas independientes con rotación de mangas 90° para ahorro máximo de tela sin vacíos.
5. **Particionado de Pliegos:** División automática de pedidos en pliegos de $\le 500\text{ cm}$ separando Camisetas de Shorts.
6. **Exportación Física Calibrada:** Generación de PDF (Mimaki RasterLink / Epson), SVG, EPS y resúmenes de producción en Excel/CSV.
