# Codebase Structure

**Analysis Date:** 2026-07-04

## Directory Layout

```
guidemygrid/
├── src/                         # TypeScript source code
│   ├── index.tsx                # React DOM mount point
│   ├── App.tsx                  # Root component (shell, tab bar)
│   ├── App.module.css           # Styles for App shell
│   ├── version.ts               # VERSION constant (synced on build)
│   ├── components/              # React components
│   │   ├── ColumnGrid/          # Main grid form panel
│   │   │   ├── GridPanel.tsx    # Grid/row/margin form
│   │   │   ├── GridPanel.module.css
│   │   │   └── index.ts         # Barrel export
│   │   ├── SideGuidesBar/       # Quick-access guide buttons
│   │   │   ├── SideGuidesBar.tsx
│   │   │   └── SideGuidesBar.module.css
│   │   └── shared/              # Shared components
│   │       └── UpdateBanner.tsx # Update notification
│   ├── store/                   # Zustand state management
│   │   ├── index.ts             # Barrel export (useGridStore, useUIStore)
│   │   ├── gridStore.ts         # Column, row, margin state
│   │   └── uiStore.ts           # UI state (loading, error, visibility)
│   ├── services/                # Business logic & integrations
│   │   ├── gridGenerator.ts     # Pure functions: guide position math
│   │   ├── photoshopBridge.ts   # Singleton class wrapping UXP API
│   │   └── updateChecker.ts     # GitHub API client
│   ├── hooks/                   # Custom React hooks
│   │   └── useDocument.ts       # Sync Photoshop doc + selection
│   ├── types/                   # TypeScript type definitions
│   │   ├── index.ts             # Barrel export
│   │   ├── grid.types.ts        # Grid config & generation types
│   │   ├── store.types.ts       # Zustand store interfaces
│   │   ├── photoshop.types.ts   # Photoshop API types
│   │   ├── preset.types.ts      # (unused; for future features)
│   │   ├── license.types.ts     # (unused; for future features)
│   │   ├── spectrum.d.ts        # Adobe Spectrum CSS types
│   │   └── css-modules.d.ts     # CSS Module type helpers
│   ├── styles/                  # Global styles
│   │   └── tokens.css           # CSS custom properties (colors, spacing)
│   └── __tests__/               # Test files (co-located pattern)
│       └── gridGenerator.sideGuide.test.ts
├── index.html                   # UXP plugin entry point (DOM root)
├── manifest.json                # UXP plugin manifest (Photoshop metadata)
├── package.json                 # Dependencies & build scripts
├── tsconfig.json                # TypeScript compiler options
├── webpack.config.js            # Webpack build configuration
├── icons/                       # Plugin icons
│   ├── icon-23.png              # Small icon (panel header)
│   └── icon-96.png              # Large icon (marketplace)
├── scripts/                     # Build & packaging scripts
│   ├── sync-version.js          # Sync version.ts from package.json
│   └── package.js               # Package plugin as .ccx file
├── .gitignore
├── .claude/
│   └── settings.local.json      # Project-specific Claude settings
├── README.md                    # Plugin documentation
└── LICENSE

# Generated (not committed)
dist/                            # Bundled output (index.js, styles.css)
coverage/                        # Jest coverage reports
node_modules/
```

## Directory Purposes

**src/**
- Purpose: All TypeScript/TSX source code
- Contains: Components, services, state, types, styles, hooks, tests
- Entry: `src/index.tsx` (React mount) → `src/App.tsx` (root component)

**src/components/**
- Purpose: React functional components
- Contains: UI markup, event handlers, inline styles/SVG icons
- Subdirectories: `ColumnGrid/` (main form), `SideGuidesBar/` (quick buttons), `shared/` (reusables)
- Pattern: PascalCase `.tsx` + corresponding `.module.css` file

**src/store/**
- Purpose: Zustand state management
- Contains: Two stores: gridStore (form values), uiStore (UI state)
- Pattern: `export const useGridStore = create<GridStore>((set) => ({ ... }))`
- Accessed: Via hooks in components (`const { columns, setColumns } = useGridStore()`)

**src/services/**
- Purpose: Business logic isolated from React
- Contains: 
  - `gridGenerator.ts` — Pure functions (no side effects)
  - `photoshopBridge.ts` — Singleton class wrapping UXP API
  - `updateChecker.ts` — GitHub API client with validation
- Pattern: Imported directly by components; never instantiated per-render

**src/hooks/**
- Purpose: Custom React hooks for side effects
- Contains: `useDocument()` listening to Photoshop events, syncing to React state
- Pattern: Hook returns `{ document, selection, loading, refresh }`

**src/types/**
- Purpose: TypeScript interfaces and type definitions
- Contains: Grid config types, Photoshop API response types, Zustand store types
- Pattern: `domain.types.ts` for each domain
- Accessed: Via `export * from './index.ts'` barrel export

**src/styles/**
- Purpose: Global CSS custom properties
- Contains: `tokens.css` with `--gmg-*` CSS variables (colors, spacing, fonts)
- Accessed: Referenced in component `.module.css` files and inline styles

**src/__tests__/**
- Purpose: Jest test files
- Contains: Unit tests for services (gridGenerator currently)
- Pattern: `feature.test.ts` naming, same structure as src/

**index.html**
- Purpose: HTML entry point for UXP plugin
- Contains: Single `<div id="root">` mount point
- Not a typical web app root — UXP loads this in a sandboxed panel within Photoshop

**manifest.json**
- Purpose: UXP plugin metadata
- Contains: Plugin name, version, required Photoshop version, permissions
- Updated manually or via packaging script

**package.json**
- Purpose: npm dependencies and build scripts
- Key scripts:
  - `npm run dev`: webpack watch + TypeScript
  - `npm run build`: production webpack build
  - `npm test`: Jest with ts-jest
  - `npm run package`: Create distributable .ccx file
  - `npm run release:patch/minor/major`: Version bump + package

**tsconfig.json**
- Purpose: TypeScript compiler configuration
- Key settings:
  - `target: ES2020`, `lib: ["ES2020", "DOM"]`
  - `jsx: "react-jsx"`
  - `strict: true` (all strict flags enabled)
  - No path aliases (no `@/*` mapping)

**webpack.config.js**
- Purpose: Bundle configuration
- Outputs: `dist/index.js` (single bundle), `dist/styles.css` (extracted styles)
- Loaders: ts-loader for TypeScript, css-loader + MiniCssExtractPlugin for CSS Modules
- Input: `src/index.tsx`

**icons/**
- Purpose: Plugin branding images
- `icon-23.png`: Shown in Photoshop panel header
- `icon-96.png`: Shown in UXP marketplace

**scripts/**
- Purpose: Build-time utilities
- `sync-version.js`: Reads version from package.json, updates src/version.ts before build
- `package.js`: Creates .ccx (UXP plugin archive) from dist/ + manifest + icons

## Key File Locations

**Entry Points:**
- `src/index.tsx`: React DOM mount; called by UXP runtime when panel loads
- `src/App.tsx`: Root React component; defines shell layout and App context
- `index.html`: HTML skeleton; UXP injects this into panel

**Configuration:**
- `package.json`: npm dependencies, build scripts, Jest config
- `tsconfig.json`: TypeScript compiler options
- `webpack.config.js`: Bundle configuration
- `manifest.json`: UXP plugin metadata
- `src/styles/tokens.css`: CSS custom properties (design tokens)

**Core Logic:**
- `src/services/gridGenerator.ts`: Grid position calculation (pure functions)
- `src/services/photoshopBridge.ts`: Photoshop UXP API wrapper (singleton)
- `src/store/gridStore.ts`: Form state (Zustand)
- `src/store/uiStore.ts`: UI state (Zustand)

**UI Components:**
- `src/App.tsx`: Shell with tab bar and toggle guides button
- `src/components/ColumnGrid/GridPanel.tsx`: Main form for grid/row/margin config
- `src/components/SideGuidesBar/SideGuidesBar.tsx`: Quick-access buttons for edge/center guides

**Hooks & Utilities:**
- `src/hooks/useDocument.ts`: Sync Photoshop document context into React
- `src/services/updateChecker.ts`: GitHub releases API client

**Type Definitions:**
- `src/types/grid.types.ts`: GridConfig, ColumnConfig, RowConfig, MarginsConfig
- `src/types/store.types.ts`: GridStore, UIStore interfaces
- `src/types/photoshop.types.ts`: DocumentInfo, SelectionBounds, GuideInfo

**Testing:**
- `src/__tests__/gridGenerator.sideGuide.test.ts`: Jest tests for gridGenerator

## Naming Conventions

**Files:**
- Components: PascalCase `.tsx` — `GridPanel.tsx`, `SideGuidesBar.tsx`
- Services/utilities: camelCase `.ts` — `gridGenerator.ts`, `photoshopBridge.ts`, `updateChecker.ts`
- Hooks: camelCase `.ts` — `useDocument.ts`
- Types: `domain.types.ts` — `grid.types.ts`, `store.types.ts`, `photoshop.types.ts`
- Styles: `ComponentName.module.css` — `GridPanel.module.css`
- Tests: `feature.test.ts` — `gridGenerator.sideGuide.test.ts`

**Functions:**
- Components: PascalCase — `export function GridPanel() { ... }`
- Services: camelCase — `generateColumnGuides()`, `addGuide()`
- Custom hooks: `use*` — `useDocument()`
- Type guards: `is*` — `isSafeUrl()`

**Variables & Constants:**
- Local variables: camelCase — `columnWidth`, `containerHeight`
- Module constants: SCREAMING_SNAKE_CASE — `GITHUB_REPO`, `SEMVER_RE`, `ALLOWED_URL`, `DEBOUNCE_MS`
- Boolean flags: `is*`, `has*` — `isApplying`, `hasSelection`, `hasCount`

**Types:**
- Interfaces: PascalCase — `GridStore`, `DocumentInfo`, `SelectionBounds`
- Type aliases: PascalCase — `WidthMode`, `GuideOrientation`, `ApplyTarget`
- Union types: lowercase/camelCase — `SideGuideType` ('left' | 'right' | 'center-v' | 'center-h' | 'top' | 'bottom')

## Where to Add New Code

**New Grid Feature (e.g., rotation, nested grids):**
1. Add UI inputs to `src/components/ColumnGrid/GridPanel.tsx`
2. Add store state to `src/store/gridStore.ts` and `src/types/store.types.ts`
3. Add calculation logic to `src/services/gridGenerator.ts`
4. Add tests to `src/__tests__/gridGenerator.feature.test.ts`

**New Photoshop Integration (e.g., layer naming, guide colors):**
1. Add method to `src/services/photoshopBridge.ts` class
2. Call from component handler or service function
3. Add type definition to `src/types/photoshop.types.ts` if returning new data

**New Component:**
1. Create `src/components/FeatureName/FeatureName.tsx` (PascalCase directory + file)
2. Create `src/components/FeatureName/FeatureName.module.css` for styles
3. Export from `src/components/FeatureName/index.ts` (barrel export)
4. Import and render in parent component (typically `GridPanel.tsx` or `App.tsx`)

**New Hook:**
1. Create `src/hooks/useFeatureName.ts`
2. Export type + hook function
3. Call from component to inject side effects

**New Utility/Service:**
1. If pure logic: `src/services/featureName.ts` (camelCase)
2. If stateful: Create class in services directory, export singleton instance
3. Export types separately to `src/types/featureName.types.ts`

**New Type Definition:**
1. If domain-specific: `src/types/domain.types.ts`
2. Export from `src/types/index.ts` barrel
3. Never put types inline in components or services

**Testing:**
- Test files placed in `src/__tests__/` alongside src code
- Naming: `feature.test.ts` or `feature.scope.test.ts`
- Example: `gridGenerator.sideGuide.test.ts` (service + scope)

## Special Directories

**dist/**
- Purpose: Bundled output (generated by webpack)
- Generated: `npm run build`
- Contents: `index.js` (webpack bundle), `styles.css` (extracted CSS), `index.html` (copied), icons
- Committed: No (gitignored)

**coverage/**
- Purpose: Jest coverage reports
- Generated: `npm test -- --coverage`
- Contents: HTML report under `coverage/lcov-report/`
- Committed: No (gitignored)

**node_modules/**
- Purpose: npm dependencies
- Generated: `npm install`
- Committed: No (gitignored)

**.claude/**
- Purpose: Claude Code project settings
- Contents: `settings.local.json` with project-specific configuration
- Committed: Yes (but .local.json is local-only)

**.planning/codebase/**
- Purpose: GSD codebase analysis documents
- Contents: `ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md`, `CONCERNS.md`
- Committed: Yes (reference docs)

---

*Structure analysis: 2026-07-04*
