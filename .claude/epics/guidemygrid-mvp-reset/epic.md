---
name: guidemygrid-mvp-reset
status: completed
created: 2026-03-08T01:31:52Z
updated: 2026-03-09T18:52:13Z
progress: 0%
prd: .claude/prds/guidemygrid-mvp-reset.md
---

# Epic: GuideMyGrid MVP Reset

## Visión general

Reescribir el plugin eliminando toda la deuda técnica acumulada. El MVP tiene una sola función: generar guías de columnas dentro de una selección o del canvas. UI mínima, sin iconos SVG en botones, 100% funcional.

## Restricciones UXP (no negociables)

- SVG dentro de `<button>` no renderiza en UXP → botones con texto plano únicamente
- `display: grid` tiene bugs en UXP → solo flexbox
- `input type="number"` renderiza stepper nativo → `type="text" inputMode="numeric"`
- CSS variables deben definirse en `:root, body, #root`
- SVG HTML width/height ignorados → tamaño siempre por CSS class

## Work Streams

### Stream A — Limpieza y store (sin dependencias)
Archivos: `src/store/`, `src/types/`, `src/styles/tokens.css`

**Tarea 1** — Simplificar store
- Eliminar: rows, margins, borderGuides, linkedMargins, applyMode, documentGuideCount del store
- Mantener: columns (count, gutter), guidesVisible
- Estado inicial: count = '' (vacío), gutter = '' (vacío)
- Tamaño: XS

**Tarea 2** — Actualizar tokens CSS
- Font: PT Sans (no JetBrains Mono)
- Agregar: `--gmg-bg-input-disabled: #3D3D3D`
- Mantener resto de tokens existentes
- Tamaño: XS

### Stream B — Lógica de negocio (depende de A)
Archivos: `src/services/gridGenerator.ts`, `src/services/photoshopBridge.ts`

**Tarea 3** — Simplificar gridGenerator
- Input: `{ columns: number, gutter: number, containerWidth: number, offsetX: number }`
- Output: array de posiciones X para guías verticales
- Fórmula: `columnWidth = (containerWidth - (columns-1) * gutter) / columns`
- Guías en: offsetX, offsetX + columnWidth, offsetX + 2*columnWidth, ... (bordes de cada columna)
- Tamaño: S

**Tarea 4** — Verificar photoshopBridge
- Confirmar que `clearAllGuides()` funciona
- Confirmar que `toggleGuidesVisibility()` funciona
- Confirmar que `applyGuides()` funciona con solo guías verticales
- Sin cambios si ya funciona, fix mínimo si no
- Tamaño: XS

### Stream C — UI (depende de A y B)
Archivos: `src/App.tsx`, `src/App.module.css`, `src/components/ColumnGrid/GridPanel.tsx`, `src/components/ColumnGrid/GridPanel.module.css`

**Tarea 5** — Reescribir App.tsx
- Eliminar: toolbar de alineación completo, múltiples tabs, update checker banner, toast
- Mantener: tab bar simplificado (solo "Grid" + eye button), panel principal
- Eye button: texto "Ocultar" / "Mostrar" o símbolo simple — NO SVG dentro de button
- Tamaño: S

**Tarea 6** — Reescribir GridPanel.tsx
- Sección Columns: 3 inputs en fila [Quantity] [Width disabled] [Gutter]
- Quantity: vacío por defecto, placeholder "Quantity"
- Width: siempre disabled, calculado, placeholder "Width"
- Gutter: disabled si quantity vacío o 0, placeholder "Gutter"
- Footer: [+ Add guides (flex:1)] [Remove]
- "Add guides" disabled si Quantity está vacío
- "Remove" siempre activo → llama clearAllGuides()
- Selection-aware: usa selección activa o canvas
- Tamaño: M

**Tarea 7** — Reescribir estilos (App.module.css + GridPanel.module.css)
- Replicar diseño Pencil "GuideForge - Plugin - MVP"
- Font: PT Sans
- Sin clases de iconos SVG
- Flexbox en todo
- Tamaño: S

### Stream D — Verificación final (depende de C)
**Tarea 8** — Build y smoke test
- `npm run build` sin errores
- Verificar en UXP Developer Tool: carga sin errores de consola
- Verificar inputs vacíos, placeholder visible
- Verificar Add guides deshabilitado sin quantity
- Verificar Gutter deshabilitado sin quantity
- Verificar Remove elimina guías
- Tamaño: XS

## Tabla de tareas

| # | Tarea | Stream | Tamaño | Depende de |
|---|-------|--------|--------|------------|
| 1 | Simplificar store | A | XS | — |
| 2 | Actualizar tokens CSS | A | XS | — |
| 3 | Simplificar gridGenerator | B | S | 1 |
| 4 | Verificar photoshopBridge | B | XS | — |
| 5 | Reescribir App.tsx | C | S | 1, 2 |
| 6 | Reescribir GridPanel.tsx | C | M | 1, 2, 3 |
| 7 | Reescribir estilos | C | S | 2 |
| 8 | Build y smoke test | D | XS | 5, 6, 7 |

**Total**: 8 tareas — estimado ~6-8h

## Criterios de aceptación

- [ ] Plugin carga sin warnings ni errores de consola en UXP
- [ ] Todos los campos vacíos por defecto con placeholder visible
- [ ] Gutter deshabilitado (bg #3D3D3D) hasta que Quantity tenga valor > 0
- [ ] Width siempre deshabilitado, muestra cálculo en tiempo real
- [ ] "Add guides" deshabilitado hasta que Quantity tenga valor
- [ ] Clic en "Add guides" crea guías de columnas en selección o canvas
- [ ] Clic en "Remove" elimina todas las guías del documento
- [ ] Eye toggle muestra/oculta guías
- [ ] Version bar muestra "GuideMyGrid v{VERSION}"
- [ ] Sin SVG dentro de buttons
- [ ] Build exitoso sin errores TypeScript
