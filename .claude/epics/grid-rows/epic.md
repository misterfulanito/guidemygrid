---
name: grid-rows
status: backlog
created: 2026-03-10T16:57:51Z
updated: 2026-03-10T16:57:51Z
progress: 0%
github: https://github.com/misterfulanito/guidemygrid/issues/22
prd: .claude/prds/grid-rows.md
---

# Epic: Grid Rows — Guías Horizontales

## 🎯 Overview

Añadir la sección "Rows" al panel Grid del plugin GuideMyGrid. La funcionalidad espeja exactamente la sección Columns pero en el eje Y: genera guías horizontales con los mismos tres campos (Quantity, Height auto-calculado, Gutter). Ambas secciones coexisten en el mismo panel y el botón "Add guides" genera vertical + horizontal simultáneamente cuando ambas tienen valores.

## 🏗️ Arquitectura

### Diseño de referencia
Frame "GuideForge - Rows" en GuideMyGrid.pen: Columns section + Rows section en el mismo panel, mismos estilos, footer compartido.

### Capas afectadas

| Capa | Archivo | Cambio |
|------|---------|--------|
| Service | `src/services/gridGenerator.ts` | Añadir `generateRowGuides()` |
| Store types | `src/types/store.types.ts` | Añadir `RowsState`, extender `GridStore` |
| Store | `src/store/gridStore.ts` | Añadir rows state + `setRows` |
| UI | `src/components/ColumnGrid/GridPanel.tsx` | Añadir sección Rows + wiring |

### No tocar
- `src/types/grid.types.ts` — `RowConfig` ya existe, no relevante para MVP
- `src/services/photoshopBridge.ts` — ya acepta `{ vertical, horizontal }`
- `GridPanel.module.css` — todas las clases son reutilizables sin cambios

### Lógica `generateRowGuides`

Espejo exacto de `generateColumnGuides` para el eje Y:
```ts
// rowHeight = (containerHeight - (rows-1) * gutter) / rows
// Para cada fila i: top = offsetY + i*(rowHeight+gutter), bottom = top + rowHeight
// Retorna posiciones Y absolutas únicas ordenadas
```

### Lógica `handleAdd` actualizada

```ts
const vertical = hasColCount ? generateColumnGuides({...}) : [];
const horizontal = hasRowCount ? generateRowGuides({...}) : [];
if (vertical.length === 0 && horizontal.length === 0) return;
await photoshopBridge.applyGuides({ vertical, horizontal }, 'replace');
```

### `containerHeight` y `offsetY`

Ya disponibles en GridPanel desde `useDocument` + `useSelection`:
- `containerHeight = selection ? selection.height : document.height`
- `offsetY = selection ? selection.top : 0`

## 🔄 Work Streams

### Stream A: Service Layer
**Archivos:** `src/services/gridGenerator.ts`
**Paralelo:** independiente

### Stream B: Store Layer
**Archivos:** `src/types/store.types.ts`, `src/store/gridStore.ts`
**Paralelo:** independiente de A

### Stream C: UI Layer
**Archivos:** `src/components/ColumnGrid/GridPanel.tsx`
**Depende de:** A + B completos

## 📊 Task Summary

| # | Task | Stream | Tamaño |
|---|------|--------|--------|
| 1 | `generateRowGuides` en gridGenerator.ts | A | S |
| 2 | RowsState + GridStore types + gridStore.ts | B | S |
| 3 | Rows section UI en GridPanel.tsx + wiring | C | M |
| 4 | QA manual + bump versión a v1.3.0 | - | XS |

**Total:** 4 tasks · Effort estimado: ~1 día · Crítico: A+B antes de C

## ✅ Acceptance Criteria

- [ ] Sección Rows aparece debajo de Columns con campos Quantity / Height / Gutter
- [ ] Height se auto-calcula (containerHeight - (rows-1)*gutter) / rows
- [ ] Gutter deshabilitado hasta que Quantity tenga valor
- [ ] Add guides genera horizontal + vertical según qué campos tengan valor
- [ ] Funciona sobre Canvas y sobre Selection (usa offsetY correcto)
- [ ] No rompe comportamiento actual de Columns
- [ ] Sin errores en consola UXP

## Tasks Created

- #1: generateRowGuides — servicio de generación de guías horizontales
- #2: RowsState — tipos y store para filas
- #3: Rows section UI — componente y wiring en GridPanel
- #4: QA + versión v1.3.0
