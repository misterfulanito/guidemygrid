# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# GuideMyGrid — Plugin Adobe Photoshop (UXP)

Plugin para generar retículas y líneas guía dentro de Photoshop. Target: Diseñadores, UXers, Marketing. Distribución: Adobe Creative Cloud Marketplace (freemium).

## Stack

- **Plugin SDK**: UXP (Unified Extensibility Platform) — Photoshop 22.0+
- **UI**: React 18 + TypeScript + Adobe Spectrum (sistema de diseño oficial de Adobe, incluido en UXP)
- **Build**: Webpack 5
- **Estado global**: Zustand
- **Persistencia**: `localStorage` de UXP (presets locales, sin backend en MVP)
- **Dev Tool**: Adobe UXP Developer Tool (para cargar y debuggear el plugin)

## Arquitectura del Plugin

```
guidemygrid/
├── manifest.json          # Configuración del plugin UXP
├── index.html             # Entry point del plugin
├── src/
│   ├── index.tsx          # React entry point
│   ├── components/        # Componentes UI (ColumnGrid, RowGrid, Margins, Presets)
│   ├── hooks/
│   │   └── usePhotoshop.ts  # Hook para APIs de Photoshop
│   ├── services/
│   │   └── gridGenerator.ts # Lógica core: generación de líneas guía
│   ├── store/             # Estado global (Zustand)
│   └── types/             # TypeScript types
├── webpack.config.js
└── package.json
```

## Comunicación con Photoshop

- Acceso a APIs: `require('photoshop')` desde UXP
- Gestión de guías: `app.activeDocument.guides`
- Operaciones complejas: `batchPlay`

## Comandos de Desarrollo

> El proyecto aún está en fase de documentación. Cuando el código exista:

```bash
npm run build        # Build de producción
npm run dev          # Watch mode para desarrollo
npm run lint         # Linting
```

El plugin se carga en Photoshop via **Adobe UXP Developer Tool** (no via `npm start`).

## Reglas del Proyecto

1. Documentar ANTES de codificar (Metodología Oden)
2. Consultar `docs/reference/technical-decisions.md` antes de tomar decisiones de arquitectura
3. Specs de módulos en `docs/reference/modules/` antes de implementar cada módulo
4. Sin backends — toda la lógica es local al plugin (revisable post-MVP)

## Docs

- `docs/reference/technical-decisions.md` — Stack, arquitectura, features del MVP, decisiones clave
- `docs/reference/competitive-analysis.md` — GuideGuide, Grids for Designers, Grid Systems
- `docs/reference/implementation-plan.md` — Plan semana por semana
- `docs/reference/modules/` — Specs técnicas por módulo
- `docs/development/current/` — Trabajo activo

## Comandos Oden

- `/oden:architect` — Completar arquitectura y specs de componentes
- `/oden:prd` — Crear PRD del producto
- `/oden:tasks` — Descomponer en tareas
- `/oden:sync` — Sincronizar con GitHub Issues
