---
name: side-guides
status: backlog
created: 2026-03-10T22:57:08Z
updated: 2026-03-10T22:57:08Z
progress: 0%
prd: .claude/prds/side-guides.md
---

# Epic: Side Guides — Líneas en Bordes y Centro

## 🎯 Overview

Implementar una barra de 6 botones de acción inmediata que crean guías en las posiciones canónicas del canvas o selección activa (bordes izquierdo/derecho/arriba/abajo + centros horizontal/vertical). Sin configuración, sin "Add Guides" — un clic = una guía creada al instante. Introduce además `lucide-react` como librería de iconos unificada del proyecto.

**Versión objetivo:** v1.5.0

## 🏗️ Arquitectura

### No hay nuevo estado (store)

Side guides son acciones puras sin configuración. No se necesita ningún cambio en Zustand ni en `store.types.ts`. La barra recibe el contexto (documento/selección) como props derivadas del componente padre.

### Lógica de posicionamiento

```
left    → vertical   en offsetX
center-v → vertical  en offsetX + containerWidth / 2
right   → vertical   en offsetX + containerWidth
top     → horizontal en offsetY
center-h → horizontal en offsetY + containerHeight / 2
bottom  → horizontal en offsetY + containerHeight
```

### Integración con Photoshop

Usar `photoshopBridge.addGuide(position, orientation)` — método existente, **additive** (no borra guías previas). No usar `applyGuides()` que hace replace.

### Iconos (lucide-react)

| Botón | Icono Lucide |
|---|---|
| Left | `AlignStartVertical` |
| Center V | `AlignCenterVertical` |
| Right | `AlignEndVertical` |
| Top | `AlignStartHorizontal` |
| Center H | `AlignCenterHorizontal` |
| Bottom | `AlignEndHorizontal` |

**Constraint UXP crítico**: Los iconos SVG NO deben ser hijos directos de `<button>`. Envolver en `<span className={styles.iconWrap}>` dentro del botón.

### Ubicación en UI

Insertar `<SideGuidesBar>` en `GridPanel.tsx` **entre** el `contextBar` y el `content` (secciones Margins/Columns/Rows), siguiendo el diseño del frame `GuideForge - Side Guides` en Pencil (ID: `DtubC`).

## 🔄 Work Streams

### Stream A: Dependencia + Servicio (bloqueante)

**Files:** `package.json`, `src/services/gridGenerator.ts`, `src/__tests__/`
**Agent:** backend-specialist

| # | Tarea | Tamaño |
|---|---|---|
| 1 | Install lucide-react + verificar webpack bundle | XS |
| 2 | `generateSideGuide()` en gridGenerator.ts + tests | S |

### Stream B: Componente UI (depende de Stream A)

**Files:** `src/components/SideGuidesBar/SideGuidesBar.tsx`, `src/components/SideGuidesBar/SideGuidesBar.module.css`
**Agent:** frontend-specialist

| # | Tarea | Tamaño |
|---|---|---|
| 3 | Componente SideGuidesBar con 6 botones + iconos Lucide + per-button loading | M |

### Stream C: Wiring + Release (depende de Stream B)

**Files:** `src/components/ColumnGrid/GridPanel.tsx`, `src/version.ts`, `manifest.json`
**Agent:** fullstack-developer

| # | Tarea | Tamaño |
|---|---|---|
| 4 | Wire SideGuidesBar en GridPanel + bump v1.5.0 | S |

## 📊 Resumen de Tareas

| # | Tarea | Stream | Tamaño | Depende de |
|---|---|---|---|---|
| 1 | Install lucide-react | A | XS | — |
| 2 | generateSideGuide() + tests | A | S | 1 |
| 3 | SideGuidesBar component | B | M | 2 |
| 4 | Wire en GridPanel + v1.5.0 | C | S | 3 |

**Total:** 4 tareas · ~1 día · Camino crítico: 1→2→3→4

## ✅ Criterios de Aceptación

- [ ] `lucide-react` instalado, iconos renderizan en UXP (sin SVG directo en button)
- [ ] `generateSideGuide(type, params)` retorna posición correcta para los 6 tipos
- [ ] Tests unitarios para los 6 tipos con y sin selección activa
- [ ] Barra de 6 botones visible en el panel entre contextBar y secciones
- [ ] Clic en botón → guía creada inmediatamente en Photoshop (additive, no replace)
- [ ] Botones deshabilitados si no hay documento activo
- [ ] Estado loading por botón durante la operación
- [ ] Funciona sobre canvas completo y sobre selección activa
- [ ] `VERSION` = `1.5.0` en `version.ts` y `manifest.json`
- [ ] Build de producción sin errores

## ⚠️ Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| lucide-react SVG en UXP rompe render en botones | Alto | Siempre envolver icono en `<span>` dentro del `<button>` |
| `fill="none"` de Lucide cascadea en UXP a hijos fill-based | Medio | Usar solo iconos stroke (todos los Align* son stroke) — OK |
| webpack no bundlea lucide-react correctamente (tree-shaking) | Bajo | Importar por nombre: `import { AlignStartVertical } from 'lucide-react'` |

## 🔗 Dependencias

- **Bloqueado por:** ninguno — ui-redesign completado (v1.2.0)
- **Bloquea:** futuras migraciones de iconos (IconMargins, IconColumns, IconRows → Lucide post este epic)
- **Externa:** `lucide-react` npm package
