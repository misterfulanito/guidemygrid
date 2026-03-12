# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# GuideMyGrid — Plugin Adobe Photoshop (UXP)

Plugin for generating grids and guides inside Photoshop. Target: Designers, UXers, Marketing. Distribution: Adobe Creative Cloud Marketplace (freemium).

## Stack

- **Plugin SDK**: UXP (Unified Extensibility Platform) — Photoshop 22.0+
- **UI**: React 18 + TypeScript + Adobe Spectrum (Adobe's official design system, included in UXP)
- **Build**: Webpack 5
- **Global state**: Zustand
- **Persistence**: UXP `localStorage` (local presets, no backend in MVP)
- **Dev Tool**: Adobe UXP Developer Tool (for loading and debugging the plugin)

## Plugin Architecture

```
guidemygrid/
├── manifest.json          # UXP plugin configuration
├── index.html             # Plugin entry point
├── src/
│   ├── index.tsx          # React entry point
│   ├── components/        # UI components (ColumnGrid, RowGrid, Margins, Presets)
│   ├── hooks/
│   │   └── usePhotoshop.ts  # Hook for Photoshop APIs
│   ├── services/
│   │   └── gridGenerator.ts # Core logic: guide generation
│   ├── store/             # Global state (Zustand)
│   └── types/             # TypeScript types
├── webpack.config.js
└── package.json
```

## Photoshop Communication

- API access: `require('photoshop')` from UXP
- Guide management: `app.activeDocument.guides`
- Complex operations: `batchPlay`

## Development Commands

> The project is still in the documentation phase. When the code exists:

```bash
npm run build        # Production build
npm run dev          # Watch mode for development
npm run lint         # Linting
```

The plugin is loaded into Photoshop via **Adobe UXP Developer Tool** (not via `npm start`).

## Project Rules

1. Document BEFORE coding (Oden Methodology)
2. Consult `docs/reference/technical-decisions.md` before making architecture decisions
3. Module specs in `docs/reference/modules/` before implementing each module
4. No backends — all logic is local to the plugin (revisable post-MVP)

## Docs

- `docs/reference/technical-decisions.md` — Stack, architecture, MVP features, key decisions
- `docs/reference/competitive-analysis.md` — GuideGuide, Grids for Designers, Grid Systems
- `docs/reference/implementation-plan.md` — Week-by-week plan
- `docs/reference/modules/` — Technical specs per module
- `docs/development/current/` — Active work

## Oden Commands

- `/oden:architect` — Complete architecture and component specs
- `/oden:prd` — Create product PRD
- `/oden:tasks` — Decompose into tasks
- `/oden:sync` — Sync with GitHub Issues
