---
name: grid-rows
description: Añadir sección de filas (rows) al panel Grid del plugin GuideMyGrid
status: backlog
created: 2026-03-10T16:57:51Z
updated: 2026-03-10T16:57:51Z
---

# PRD: Grid Rows — Guías Horizontales

## Objetivo

Añadir una sección de filas (rows) al panel Grid del plugin GuideMyGrid, espejando la funcionalidad de columns pero para el eje vertical (guías horizontales).

## Contexto

El panel Grid actualmente solo genera guías verticales (columns). El diseño de referencia en Pencil ("GuideForge - Rows") muestra ambas secciones — Columns y Rows — en el mismo panel, compartiendo footer y botones de acción.

## Funcionalidad requerida

### Sección Rows (debajo de Columns)

- **Quantity**: número de filas (campo editable, mismo comportamiento que columns.count)
- **Height**: altura de cada fila, auto-calculada y deshabilitada (= (containerHeight - (rows-1)*gutter) / rows)
- **Gutter**: espacio entre filas en px (deshabilitado hasta que Quantity tenga valor)

### Comportamiento del botón "Add guides"

- Si solo Columns tiene valores → genera guías verticales (comportamiento actual)
- Si solo Rows tiene valores → genera guías horizontales
- Si ambos tienen valores → genera ambas simultáneamente
- El modo siempre es 'replace' (comportamiento actual)

### Comportamiento del botón "Remove"

- Sin cambios: elimina todas las guías del documento (comportamiento actual)

## Diseño UI

Referencia: frame "GuideForge - Rows" en GuideMyGrid.pen

```
┌─────────────────────────────────┐
│ Grid                         👁 │
├─────────────────────────────────┤
│ Context: Canvas 1440 × 900 px  │
├─────────────────────────────────┤
│  ⊞ Columns                      │
│  [ Quantity ] [ Width ] [Gutter]│
│                                 │
│  ≡ rows                         │
│  [ Quantity ] [Height] [Gutter] │
├─────────────────────────────────┤
│  [   + Add guides   ] [Remove]  │
│  GuideMyGrid v1.x.x            │
└─────────────────────────────────┘
```

- Icono Rows: líneas horizontales (igual que el Rows icon del diseño Pencil)
- Mismo layout de 3 inputs `.row3`
- Mismos estilos: `.section`, `.sectionHead`, `.sectionIcon`, `.sectionLabel`

## Alcance técnico

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/services/gridGenerator.ts` | Añadir `generateRowGuides()` |
| `src/types/store.types.ts` | Añadir `RowsState`, extender `GridStore` |
| `src/store/gridStore.ts` | Añadir rows state + `setRows` action |
| `src/components/ColumnGrid/GridPanel.tsx` | Añadir sección Rows UI + wiring |

### Archivos NO modificar

- `src/types/grid.types.ts` — `RowConfig` ya definida (no se usa en MVP, no tocar)
- `src/services/photoshopBridge.ts` — ya acepta `{ vertical, horizontal }`
- `GridPanel.module.css` — reutilizar clases existentes sin cambios

## Criterios de aceptación

- [ ] Sección Rows aparece debajo de Columns en el panel
- [ ] Height se calcula automáticamente igual que Width en Columns
- [ ] Gutter deshabilitado hasta que Quantity tenga valor
- [ ] "Add guides" genera guías horizontales + verticales según campos con valor
- [ ] Funciona sobre Canvas y sobre Selection
- [ ] No rompe el comportamiento actual de Columns
- [ ] Sin errores en consola UXP
