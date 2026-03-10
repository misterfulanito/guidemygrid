---
name: grid-margins
description: Añadir sección de márgenes (margins) al panel Grid del plugin GuideMyGrid
status: backlog
created: 2026-03-10T18:22:52Z
updated: 2026-03-10T18:22:52Z
---

# PRD: Grid Margins — Guías de Margen

## Objetivo

Añadir una sección "margins" al panel Grid del plugin GuideMyGrid. Permite al usuario definir 4 márgenes independientes (Top, Bottom, Left, Right), cada uno crea una sola guía a la distancia especificada desde el borde del canvas o selección.

## Contexto

El panel Grid actualmente tiene Columns y Rows. El diseño de referencia en Pencil ("GuideForge - Margins") muestra la sección Margins en la parte superior del panel, antes de Columns y rows.

## Funcionalidad requerida

### Sección Margins (antes de Columns)

- **Top**: crea una guía horizontal a `top` px desde el borde superior del canvas/selección
- **Bottom**: crea una guía horizontal a `bottom` px desde el borde inferior del canvas/selección
- **Left**: crea una guía vertical a `left` px desde el borde izquierdo del canvas/selección
- **Right**: crea una guía vertical a `right` px desde el borde derecho del canvas/selección

### Reglas

- Cada campo es independiente: si está vacío, no genera guía para ese lado
- Si todos los campos están vacíos, no genera guías de margen
- Valores negativos no permitidos (misma validación que otros campos numéricos)
- Combinable con Columns y Rows: "Add guides" genera todo simultáneamente

### Cálculo de posiciones

- Top → posición Y: `offsetY + topValue`
- Bottom → posición Y: `offsetY + containerHeight - bottomValue`
- Left → posición X: `offsetX + leftValue`
- Right → posición X: `offsetX + containerWidth - rightValue`

### Comportamiento del botón "Add guides"

- Genera guías de margin + columns + rows según qué campos tengan valor
- Deshabilitado si TODOS los campos (margin + columns + rows) están vacíos

## Diseño UI

Referencia: frame "GuideForge - Margins" en GuideMyGrid.pen

```
┌─────────────────────────────────┐
│ Grid                         👁 │
├─────────────────────────────────┤
│ Context: Canvas 1440 × 900 px  │
├─────────────────────────────────┤
│  ⊞ margins                      │
│  [ Top    ]  [ Left   ]         │
│  [ Bottom ]  [ Right  ]         │
│                                 │
│  ⊞ Columns                      │
│  [ Qty ] [ Width ] [ Gutter ]   │
│                                 │
│  ≡ rows                         │
│  [ Qty ] [Height] [ Gutter ]    │
├─────────────────────────────────┤
│  [   + Add guides   ] [Remove]  │
│  GuideMyGrid v1.x.x            │
└─────────────────────────────────┘
```

- Layout 2 columnas para inputs (`.row2`): Top/Left — Bottom/Right
- Icono: grid con borde interior (margins icon)
- Mismos estilos dark theme

## Alcance técnico

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/services/gridGenerator.ts` | Añadir `generateMarginGuides()` |
| `src/types/store.types.ts` | Añadir `MarginsState`, extender `GridStore` |
| `src/store/gridStore.ts` | Añadir margins state + `setMargins` |
| `src/components/ColumnGrid/GridPanel.tsx` | Añadir sección Margins + wiring |
| `src/components/ColumnGrid/GridPanel.module.css` | Añadir clase `.row2` |

### Archivos NO modificar

- `src/types/grid.types.ts` — `MarginsConfig` ya definida (no relevante para MVP store)
- `src/services/photoshopBridge.ts` — ya acepta `{ vertical, horizontal }`

## Criterios de aceptación

- [ ] Sección margins aparece ANTES de Columns en el panel
- [ ] Layout 2×2: Top/Left arriba, Bottom/Right abajo
- [ ] Cada campo vacío no genera su guía
- [ ] Add guides combina margin + columns + rows
- [ ] Funciona sobre Canvas y sobre Selection (offsets correctos)
- [ ] No rompe comportamiento de Columns ni Rows
- [ ] Sin errores en consola UXP
