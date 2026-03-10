---
name: grid-margins
status: backlog
created: 2026-03-10T18:22:52Z
updated: 2026-03-10T18:22:52Z
progress: 0%
github: https://github.com/misterfulanito/guidemygrid/issues/28
prd: .claude/prds/grid-margins.md
---

# Epic: Grid Margins — Guías de Margen

## 🎯 Overview

Añadir la sección "margins" al panel Grid. Aparece en la parte superior (antes de Columns y rows). Tiene 4 inputs independientes (Top, Bottom, Left, Right): cada uno crea una guía a esa distancia en píxels desde el borde del canvas o selección activa. Combinable con Columns y Rows.

## 🏗️ Arquitectura

### Diseño de referencia
Frame "GuideForge - Margins" en GuideMyGrid.pen: sección margins con layout 2×2 (Top/Left | Bottom/Right), encima de Columns y rows.

### Lógica de posiciones

```ts
// Horizontales (Y)
top    → offsetY + topValue
bottom → offsetY + containerHeight - bottomValue

// Verticales (X)
left   → offsetX + leftValue
right  → offsetX + containerWidth - rightValue
```

### Capas afectadas

| Capa | Archivo | Cambio |
|------|---------|--------|
| Service | `src/services/gridGenerator.ts` | Añadir `generateMarginGuides()` |
| Store types | `src/types/store.types.ts` | Añadir `MarginsState`, extender `GridStore` |
| Store | `src/store/gridStore.ts` | Añadir margins state + `setMargins` |
| UI | `src/components/ColumnGrid/GridPanel.tsx` | Sección margins antes de Columns |
| CSS | `src/components/ColumnGrid/GridPanel.module.css` | Añadir clase `.row2` |

### `generateMarginGuides`

```ts
export function generateMarginGuides(params: {
  top?: number; bottom?: number;
  left?: number; right?: number;
  containerWidth: number; containerHeight: number;
  offsetX: number; offsetY: number;
}): { vertical: number[]; horizontal: number[] }

// Returns positions only for fields with value > 0
// top/bottom → horizontal[], left/right → vertical[]
```

### `addDisabled` actualizado

```ts
const addDisabled = (!hasCount && !hasRowCount && !hasAnyMargin) || !document || isApplying;
// hasAnyMargin = top||bottom||left||right tiene valor
```

### `handleAdd` actualizado

Combina marginGuides.vertical + columnGuides + marginGuides.horizontal + rowGuides en una sola llamada a `photoshopBridge.applyGuides`.

## 🔄 Work Streams

### Stream A: Service + Store (paralelo)
- `src/services/gridGenerator.ts` + `src/types/store.types.ts` + `src/store/gridStore.ts`

### Stream B: UI (depende de A)
- `src/components/ColumnGrid/GridPanel.tsx` + `GridPanel.module.css`

## 📊 Task Summary

| # | Task | Stream | Tamaño |
|---|------|--------|--------|
| 1 | generateMarginGuides + MarginsState + store | A | S |
| 2 | Margins section UI + CSS row2 + wiring | B | M |
| 3 | QA manual + bump versión a v1.4.0 | - | XS |

**Total:** 3 tasks · Effort estimado: ~4h · Crítico: A antes de B

## ✅ Acceptance Criteria

- [ ] Sección margins visible ANTES de Columns
- [ ] Layout 2 columnas: Top/Left — Bottom/Right
- [ ] Cada campo vacío no genera guía para ese lado
- [ ] Add guides combina margin + columns + rows
- [ ] Funciona sobre Canvas y Selection (offsets)
- [ ] Build webpack sin errores TypeScript

## Tasks Created

- #1: generateMarginGuides + MarginsState + store
- #2: Margins section UI + CSS + wiring en GridPanel
- #3: QA manual + bump versión a v1.4.0
