---
name: saved-tab
status: backlog
created: 2026-03-07T16:16:12Z
updated: 2026-03-07T16:16:12Z
progress: 0%
iteration: post-MVP
---

# Epic: Saved Tab — Gestión de Presets

## 🎯 Overview

Implementar la pestaña "Saved" del plugin GuideMyGrid. Permite guardar, cargar y gestionar presets de configuración de grids.

**Estado:** Backlog — post-MVP. No implementar hasta que el Grid tab (epic ui-redesign) esté completo.

## ⏳ Bloqueado por

- Epic `ui-redesign` completado
- Decisión sobre límite de presets en plan Free vs Pro

## 📋 Features a definir (siguiente iteración)

- Guardar configuración actual como preset con nombre
- Lista de presets guardados con preview
- Presets built-in (12-col Web Standard, 8-col Mobile, etc.)
- Free tier: máx 3 presets usuario / Pro: ilimitados
- Importar/exportar presets como JSON

## Notas

El componente `Presets.tsx` ya existe pero la UI necesita rediseño para coincidir con el dark theme del epic `ui-redesign`. Actualmente accesible vía la tab "Saved" en el código.
