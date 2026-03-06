---
name: grid-columns
status: in-progress
created: 2026-03-06T18:35:11Z
updated: 2026-03-06T21:09:43Z
progress: 78%
prd: .claude/prds/grid-columns.md
subagents_used: prd-analyzer, context-gatherer, requirement-mapper
context_optimization: true
---

# Epic: Grid de Columnas — Plugin UXP para Photoshop

## 🎯 Overview

Implementar el panel de grid de columnas de GuideMyGrid: el usuario configura número de columnas, gutter, márgenes y ancho (auto/fijo), y aplica las guías al documento activo de Photoshop con un clic. Incluye persistencia de presets, límites freemium y sistema de notificación de actualizaciones vía GitHub Releases.

**Ventaja clave de este Epic:** el 85% del código ya está diseñado en `docs/reference/technical-decisions.md`. Los servicios core (`gridGenerator`, `photoshopBridge`, stores, `updateChecker`, `presetStorage`) son copias directas del diseño. El trabajo real está en los componentes UI y la integración end-to-end.

---

## 🏗️ Architecture Decisions

### Core Engine (Pure Logic)
- `gridGenerator.ts`: función pura — toma `GridConfig` + dimensiones → devuelve posiciones de guías. Zero dependencias. 100% testeable con Jest sin PS.
- `photoshopBridge.ts`: abstracción sobre UXP APIs. Toda escritura al documento va dentro de `executeAsModal` con `batchPlay`. No llamar a `app.activeDocument.guides.add()` directamente.

### Distribution (fuera de Adobe Exchange)
- Distribución como `.ccx` descargable desde GitHub Releases
- `updateChecker.ts` consulta `api.github.com` en cada carga del panel
- `manifest.json` requiere `"network": { "domains": ["https://api.github.com"] }`

### State Management
- Zustand (3 stores: `gridStore`, `presetsStore`, `uiStore`)
- Ningún store hace llamadas a PS ni lógica de cálculo — solo estado reactivo
- `presetStorage.ts` maneja `localStorage` con `CURRENT_VERSION` para migraciones

### UI
- Adobe Spectrum Web Components (dark/light mode automático, look nativo de PS)
- CSS Modules solo para ajustes muy puntuales no cubiertos por Spectrum
- Freemium: columnas máx 12 Free / 24 Pro — gateado en UI (input) + lógica (gridGenerator)

---

## 🔄 Work Streams

### Stream A: Foundation — Servicios Core
**Paralelo:** Empieza desde el día 1
**Archivos:** `src/types/`, `src/services/`, `manifest.json`, `webpack.config.js`, `tsconfig.json`, `package.json`
**Nota:** Todo el código está en `docs/reference/technical-decisions.md` — copiar e implementar.

---

### Stream B: Estado y Hooks
**Paralelo:** Después de A2
**Archivos:** `src/store/`, `src/hooks/`
**Nota:** Código completo en las secciones 6.1-6.3 y 8.3 del technical-decisions.md.

---

### Stream C: UI Components
**Paralelo:** B1 + B2 deben estar listos
**Archivos:** `src/components/`
**Nota:** Wireframes y specs en secciones 9.1-9.6 del technical-decisions.md. Requiere implementación.

---

### Stream D: QA + Release
**Paralelo:** Después de C
**Archivos:** `dist/`, GitHub Release
**Nota:** Testing manual en PS + empaquetado `.ccx`.

---

## 📊 Task Summary

| # | Task | Stream | Size | Depende De |
|---|------|--------|------|------------|
| 001 | Project setup — estructura base del plugin | A | S | — |
| 002 | Core services — gridGenerator + photoshopBridge + updateChecker + types | A | L | 001 |
| 003 | Persistence — presetStorage + Zustand stores | A | M | 002 |
| 004 | Hooks — useDocument + useLicense | B | S | 002, 003 |
| 005 | Shared UI — NumberInput + Toggle + ProBadge + ApplyButton | B | S | 004 |
| 006 | ColumnGrid.tsx + App.tsx — panel principal | C | M | 004, 005 |
| 007 | Presets panel — Presets.tsx + PresetItem.tsx + UpdateBanner.tsx | C | M | 004, 005 |
| 008 | Integration testing — PS 22-25, macOS + Windows | D | M | 006, 007 |
| 009 | Release packaging — .ccx build + GitHub Release + accesibilidad | D | S | 008 |

**Total tasks:** 9
**Esfuerzo estimado:** ~4-5 semanas (1 desarrollador)
**Ruta crítica:** 001 → 002 → 003 → 004 → 006 → 008 → 009
**Paralelismo:** 004 + 005 en paralelo; 006 + 007 en paralelo

---

## ✅ Acceptance Criteria (Technical)

- [ ] `gridGenerator.ts` tiene cobertura de tests ≥ 90% (casos: auto/fixed width, offsets, errores)
- [ ] `photoshopBridge.applyGuides()` crea guías correctas en PS 22.0 y PS 25.x
- [ ] El plugin carga en < 300ms medido en Adobe UXP Developer Tool
- [ ] Aplicar 24 columnas tarda < 1s en `executeAsModal`
- [ ] Los presets persisten correctamente entre sesiones de PS (localStorage)
- [ ] Preset built-in "12-col Web Standard" está disponible sin configuración
- [ ] Free tier: el input de columnas se bloquea en 12 con ProBadge visible
- [ ] Free tier: no se pueden guardar más de 3 presets de usuario
- [ ] `checkForUpdates()` no bloquea el panel si GitHub API no responde
- [ ] `manifest.json` incluye `"network": { "domains": ["https://api.github.com"] }`
- [ ] `PLUGIN_VERSION` en `updateChecker.ts` = `version` en `manifest.json` = `version` en `package.json`
- [ ] El modo Apply (Replace/Add) persiste entre sesiones
- [ ] Botón Apply deshabilitado cuando no hay documento activo en PS
- [ ] Schema de localStorage incluye `version: 1` y `migrate()` funcional
- [ ] Todos los inputs tienen `<label>` correcto (WCAG AA)
- [ ] El `.ccx` se instala correctamente con doble-clic en macOS y Windows

---

## ⚠️ Risks & Mitigations

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| `executeAsModal` se comporta diferente en PS 22 vs PS 24+ | Alto | Probar en Week 1 (task 002). Si hay diferencia, documentar workaround en `photoshopBridge.ts` |
| `batchPlay` para guías no funciona con la sintaxis del diseño | Alto | Validar task 002 antes de avanzar. Es el bloqueador más crítico del Epic. |
| GitHub API rate limit (60 req/hora sin auth) | Bajo | El check ocurre 1 vez por sesión de PS. Bien dentro del límite. |
| `uxp.entitlement` no disponible en PS sin CC cuenta | Bajo | MVP es gratuito, `useLicense` siempre devuelve 'free'. No afecta MVP. |
| Schema de localStorage corrupto por crash de PS | Bajo | `presetStorage.load()` tiene `try/catch` con fallback a built-in presets. |

---

## 🔗 Dependencies

### Internas
- `docs/reference/technical-decisions.md` — fuente de verdad del diseño. Leer antes de implementar cualquier archivo.
- No hay otros Epics que bloqueen éste (es el primero del proyecto).

### Externas
- Adobe UXP Runtime — incluido en PS 22+, sin instalación adicional
- Creative Cloud Desktop — necesario para instalar el `.ccx` (siempre presente en máquinas CC)
- GitHub — repositorio + Releases para distribución del `.ccx`
- Adobe UXP Developer Tool — para desarrollo y debugging (descarga gratuita de Adobe)

### Este Epic desbloquea
- Epic: `row-grid` — grid de filas (Pro feature)
- Epic: `apply-to-selection` — aplicar a selección activa (Pro feature)
- Epic: `preset-sharing` — compartir presets entre equipos (requiere backend)

---

## 📋 Tasks Created

Ver archivos individuales en `.claude/epics/grid-columns/`:
- `001.md` — Project setup
- `002.md` — Core services
- `003.md` — Persistence + stores
- `004.md` — Hooks
- `005.md` — Shared UI components
- `006.md` — ColumnGrid + App
- `007.md` — Presets panel + UpdateBanner
- `008.md` — Integration testing
- `009.md` — Release packaging
