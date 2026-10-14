# Feature: Modernización de la Vista de Pedidos (Estándar Molderías)

**Estado:** Completado  
**Ruta elegida:** Delegated direct (Writer subagent)  
**TDD:** Inactivo (Pruebas funcionales y de integración existentes)  

## Objetivo
Reestructurar la vista de Gestión de Pedidos (`src/views/NewOrderView.tsx`) y la validación de nómina (`src/modules/orders/orderValidator.ts`) para eliminar elementos engañosos y ruidosos, adoptando el estándar visual y ergonómico limpio de Molderías (`PatternsView.tsx`).

## Alcance
1. **TASK-1: Depuración de Validaciones y Advertencias Invasivas (`src/modules/orders/orderValidator.ts`)**
   - Retirar la advertencia invasiva `EMPTY_NUMBER` que marca en naranja cada fila que no tiene dorsal.
   - Mantener errores críticos reales (nombre vacío, talla no registrada en molde activo, dorsal duplicado si la unicidad estricta está activa).
2. **TASK-2: Reestructuración de la Vista de Pedidos (`src/views/NewOrderView.tsx`)**
   - Implementar el encabezado superior estandarizado con título, subtítulo y grupo de acciones principales (`+ Agregar Jugador`, `Cargar Excel`, `Descargar Plantilla`, `Guardar Nómina`, `Limpiar pedido`).
   - Rediseñar los 4 KPIs superiores a tarjetas compactas, limpias y de solo lectura.
   - Convertir la edición masiva de una franja de 140px fija a una barra de herramientas colapsable y compacta.
   - Retirar el campo engañoso "Modelo Asignado" de la edición masiva.
   - Diseñar la tabla de nómina con filas compactas (~38px), celdas limpias sin bordes agresivos y badges sutiles (`Completo`, `Solo nombre`, o error rojo si aplica).
3. **TASK-3: Verificación y QA**
   - Compilación con `npx tsc --noEmit`.
   - Pruebas automatizadas con `npx vitest run`.
