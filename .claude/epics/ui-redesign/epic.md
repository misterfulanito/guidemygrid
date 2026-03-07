---
name: ui-redesign
status: in-progress
created: 2026-03-07T15:16:45Z
updated: 2026-03-07T15:16:45Z
progress: 0%
---

# Epic: UI Redesign + Full Functionality — GuideMyGrid Plugin

## 🎯 Overview

Implementar el rediseño visual completo del plugin GuideMyGrid basado en el diseño aprobado en Pencil (dark theme, acento naranja #FF5700), y dar funcionalidad real a todos los botones e interacciones que actualmente están vacíos o sin implementar.

**El diseño de referencia está en Pencil:**
- Frame `dANu0`: GuideForge - Plugin (vista estrecha)
- Frame `sMLRl`: GuideForge - Wide (480px)

**Características del nuevo diseño:**
- Dark theme (fondo ~#1E1E1E, inputs ~#2A2A2A)
- Acento naranja (#FF5700) para botón CTA, tab activo, iconos de sección
- Toolbar con iconos de alineación horizontal y vertical
- Tabs: Grid / Custom / Saved + botón eye
- Secciones colapsables: margins, columns, rows, position
- Footer: botón "+ Add guides" grande + iconos save/reset
- Versión en footer "GuideMyGrid v1.0.0"

---

## 🏗️ Work Streams

### Stream A: UX Audit
Revisar flujo de usuario, definir comportamiento de cada botón/interacción pendiente.

### Stream B: Design Tokens + Visual Layer
Implementar dark theme y CSS variables desde el diseño Pencil.

### Stream C: Functional Implementation
Dar funcionalidad real a toolbar, eye button, tabs, toggle de secciones y demás interacciones.

---

## 📊 Task Summary

| # | Task | Stream |
|---|------|--------|
| 001 | UX audit — definir comportamiento de cada botón e interacción | A |
| 002 | Design tokens — CSS variables dark theme desde diseño Pencil | B |
| 003 | App shell — toolbar + tabbar dark theme implementado | B/C |
| 004 | GridPanel — panel principal dark theme + campos | B/C |
| 005 | Funcionalidad botones — toolbar align, eye, toggle secciones | C |

**Total tasks:** 5
**Ruta crítica:** 001 → 002 → 003/004 → 005
