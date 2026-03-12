# Technical Decisions — GuideMyGrid

**Status:** ✅ Complete
**Created:** 2026-03-06T16:41:30Z
**Last updated:** 2026-03-06T18:27:46Z

---

## Index

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [MVP Features](#3-mvp-features)
4. [Plugin Architecture](#4-plugin-architecture)
5. [TypeScript Interfaces](#5-typescript-interfaces)
6. [Global State — Zustand Store](#6-global-state--zustand-store)
7. [gridGenerator Service](#7-gridgenerator-service)
8. [UXP APIs — Photoshop Communication](#8-uxp-apis--photoshop-communication)
9. [Component Specifications](#9-component-specifications)
10. [Persistence — UXP localStorage](#10-persistence--uxp-localstorage)
11. [Freemium — Feature Gating](#11-freemium--feature-gating)
12. [Error Handling](#12-error-handling)
13. [Build and Configuration](#13-build-and-configuration)
14. [manifest.json — UXP Configuration](#14-manifestjson--uxp-configuration)
15. [Performance Targets](#15-performance-targets)
16. [Testing Strategy](#16-testing-strategy)
17. [Release — Adobe Exchange](#17-release--adobe-exchange)
18. [Competitors](#18-competitors)
19. [Implementation Plan](#19-implementation-plan)
20. [Risks and Mitigations](#20-risks-and-mitigations)

---

## 1. Overview

### 1.1 Description

GuideMyGrid is a plugin for Adobe Photoshop that allows designers, UXers, and marketing professionals to generate grids and guide lines with simple yet powerful configurations. The user defines columns, rows, and margins from an intuitive UI; the plugin automatically generates all guide lines in the active document.

### 1.2 Problem it Solves

Configuring grids in Photoshop natively is slow and repetitive:
- Each guide line must be added manually (View → New Guide)
- There is no native preset system
- The native dialog does not automatically calculate positions with gutters
- There is no way to apply a grid to an active selection (only to the full canvas)

GuideMyGrid automates this process: the user configures once and applies with a single click.

### 1.3 Target User

| Profile | Main Need | Priority Feature |
|---------|-----------|-----------------|
| Graphic designer | Consistent grids across documents | Reusable presets |
| UX/UI Designer | Standard 8pt / 12-column grids | Column grid with gutter |
| Marketing team | Brand templates applied quickly | Shareable presets (post-MVP) |
| Motion Designer | Composition guides for keyframes | Row grid + margins |

### 1.4 MVP Scope

- **Mode:** MVP
- **Estimated timeline:** 6-8 weeks
- **Initial target:** Adobe Photoshop 22.0+
- **Platforms:** macOS and Windows (UXP is cross-platform)

### 1.5 Decision: MVP vs Turbo Mode

**Chosen: MVP** because:
- The Photoshop plugin market needs rapid validation
- Competitors (GuideGuide) have been around for years and have established users
- A clear value proposition (presets + row grid) is sufficient to differentiate in MVP
- The freemium model validates willingness to pay before investing in Pro features

**Technical debt accepted in MVP:**
- No preset synchronization across machines (post-MVP: backend)
- No history of applied grids
- No preset import/export between users

---

## 2. Technology Stack

### 2.1 Plugin SDK: UXP

| Attribute | Value |
|-----------|-------|
| Technology | UXP (Unified Extensibility Platform) |
| Minimum PS version | Photoshop 22.0 (January 2021) |
| Runtime | V8 (JS engine) + native PS APIs |
| Panel model | Persistent floating panel in PS |

**Justification over CEP:**
- UXP is the official successor to CEP. Adobe will deactivate CEP in 2025-2026.
- UXP has direct access to native PS APIs without iframes or ExtendScript bridges.
- UXP performance is significantly better for document manipulation.
- Adobe UXP Developer Tool allows hot-reload during development.

### 2.2 Frontend: React 18 + TypeScript

| Attribute | Value |
|-----------|-------|
| Framework | React 18.2+ |
| Language | TypeScript 5.x (strict mode) |
| UI Components | Adobe Spectrum Web Components (included in UXP) |
| Routing | Not needed (single-panel SPA) |

**Justification:**
- UXP includes React in its runtime — no extra bundle weight added.
- TypeScript is critical for working with PS APIs (typing of documents, layers, guides).
- Adobe Spectrum ensures the UI looks native within the Adobe ecosystem (automatic dark/light mode, Photoshop fonts).

**Decision: No Tailwind or CSS-in-JS**
- Adobe Spectrum already provides all necessary components (inputs, sliders, buttons, tabs).
- Adding an external CSS system creates conflicts with Spectrum styles.
- CSS Modules are only used for very specific styles not covered by Spectrum.

### 2.3 Global State: Zustand

| Attribute | Value |
|-----------|-------|
| Library | Zustand 4.x |
| Justification | Minimal API, no boilerplate, compatible with React 18 concurrent |
| Discarded alternatives | Redux (excessive for this scope), Jotai (less mature) |

### 2.4 Build: Webpack 5

| Attribute | Value |
|-----------|-------|
| Tool | Webpack 5 |
| Base template | `@adobe/create-ccweb-add-on` or Adobe UXP template |
| Dev Tool | Adobe UXP Developer Tool (GUI) |
| Output | Single bundle `/dist/index.js` + `/dist/index.html` |

**Note:** UXP does not support native ES modules at runtime. Everything must be bundled. The final entry point is an HTML file that loads the JS bundle.

### 2.5 Distribution and Auto-Update

**Decision:** Distribution outside Adobe Exchange — full price control, no review process, immediate updates.

#### Installation format: `.ccx`

The `.ccx` is the native UXP format. No separate executable required:
```
1. User downloads guidemygrid-v1.0.0.ccx from web/GitHub
2. Double-click on the .ccx → CC Desktop installs it automatically
3. The plugin appears in Photoshop → Plugins → GuideMyGrid
```

**Accepted trade-off:** without Adobe Exchange, the plugin does not appear in the official marketplace. Acquisition depends on owned channels (website, designer communities, Product Hunt, etc.).

#### Auto-Update: GitHub Releases API

El plugin verifica actualizaciones contra la GitHub Releases API en cada carga del panel. Falla silenciosamente si no hay red.

```typescript
// src/services/updateChecker.ts
const PLUGIN_VERSION = '1.0.0'; // Sincronizar con manifest.json en cada release
const GITHUB_REPO = '{owner}/guidemygrid';

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes?: string;
}

export async function checkForUpdates(): Promise<UpdateInfo | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );
    if (!response.ok) return null;

    const release = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, '');
    const hasUpdate = compareVersions(latestVersion, PLUGIN_VERSION) > 0;
    const ccxAsset = release.assets?.find((a: any) => a.name.endsWith('.ccx'));

    return {
      hasUpdate,
      latestVersion,
      downloadUrl: ccxAsset?.browser_download_url ?? release.html_url,
      releaseNotes: release.body,
    };
  } catch {
    return null; // Silent failure — never block if there is no network
  }
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return 1;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return -1;
  }
  return 0;
}
```

**`UpdateBanner.tsx` component:**
- Shown at the top of the panel if `hasUpdate === true`
- Message: "New version vX.Y.Z available → Download"
- The button opens `downloadUrl` in the system browser
- The user downloads the `.ccx` → double-click → CC Desktop updates
- The banner can be dismissed; it does not reappear until the next PS session

**Release flow for the developer:**
```
1. Develop changes
2. Update PLUGIN_VERSION in updateChecker.ts + version in manifest.json + package.json
3. npm run build
4. Package: zip -r guidemygrid-v1.1.0.ccx dist/
5. Create GitHub Release with tag "v1.1.0" + attach the .ccx
6. Users see the banner in their next PS session → download → install
```

**Network permission required in manifest.json:**
```json
"network": { "domains": ["https://api.github.com"] }
```

#### No Backend (MVP)

| Data | Storage |
|------|---------|
| User presets | UXP `localStorage` |
| Plugin configuration | UXP `localStorage` |
| Update verification | GitHub Releases API (read-only) |
| Pro licenses | **Not in MVP** — free plugin |

**Post-MVP monetization:**
- License keys via Gumroad or LemonSqueezy (both have key validation APIs)
- `manifest.json` will require adding the license provider domain to `network.domains`
- The `LicenseTier` field is already in the TypeScript interfaces — only the verification logic is missing

### 2.6 Production Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "webpack": "^5.88.0",
    "webpack-cli": "^5.1.0",
    "ts-loader": "^9.4.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "css-loader": "^6.8.0",
    "style-loader": "^3.3.0"
  }
}
```

**Without these dependencies:** no lodash, axios, or date-fns is added. The plugin is minimalist.

---

## 3. MVP Features

### 3.1 Column Grid

| Field | Type | Range | Default | Notes |
|-------|------|-------|---------|-------|
| columns | number | 1–24 | 12 | Number of columns |
| columnWidth | 'auto' \| number | px | 'auto' | 'auto' = distribute evenly |
| gutter | number | 0–200 | 20 | Space between columns (px) |
| marginLeft | number | 0–500 | 0 | Offset from left edge (px) |
| marginRight | number | 0–500 | 0 | Offset from right edge (px) |

**Calculation logic:**
```
availableWidth = documentWidth - marginLeft - marginRight
widthPerColumn = (availableWidth - (gutter * (columns - 1))) / columns
```

Each column generates 2 vertical guides: left edge and right edge.
The gutter is the space between the right edge of one column and the left edge of the next.

### 3.2 Row Grid

| Field | Type | Range | Default | Notes |
|-------|------|-------|---------|-------|
| rows | number | 1–100 | 0 (disabled) | Number of rows |
| rowHeight | 'auto' \| number | px | 'auto' | |
| rowGutter | number | 0–200 | 0 | Space between rows (px) |
| marginTop | number | 0–500 | 0 | Offset from top edge (px) |
| marginBottom | number | 0–500 | 0 | Offset from bottom edge (px) |

**Calculation logic:**
```
availableHeight = documentHeight - marginTop - marginBottom
heightPerRow = (availableHeight - (rowGutter * (rows - 1))) / rows
```

### 3.3 Global Margins

Margins are configured as part of ColumnGrid and RowGrid. However, an independent "Margins" section is provided that generates 4 simple guides (top, right, bottom, left) with no associated grid. Useful for defining a safe content area.

| Field | Default |
|-------|---------|
| top | 0 px |
| right | 0 px |
| bottom | 0 px |
| left | 0 px |

### 3.4 Presets

- The user can save the current configuration as a preset with a custom name.
- Presets are listed in a "Presets" panel and can be applied with a single click.
- **Free:** maximum 3 saved presets.
- **Pro:** unlimited presets.
- Presets persist in the plugin's `localStorage`.

### 3.5 Applying to Photoshop

| Option | Description |
|--------|-------------|
| Apply to canvas | Guides are calculated against the document width/height |
| Apply to selection | Guides are calculated against the bounding box of the active selection |
| Replace guides | Deletes all existing guides before applying |
| Add to existing | Adds the new guides without deleting the current ones |

### 3.6 Free vs Pro Limits

| Feature | Free | Pro |
|---------|------|-----|
| Maximum columns | 12 | 24 |
| Rows | ❌ | ✅ |
| Saved presets | 3 | Unlimited |
| Community presets | ❌ | ✅ (post-MVP) |
| Apply to selection | ❌ | ✅ |
| Export presets | ❌ | ✅ (post-MVP) |

---

## 4. Plugin Architecture

### 4.1 Folder Structure

```
guidemygrid/
├── manifest.json               # UXP plugin configuration
├── index.html                  # Panel HTML entry point
├── package.json
├── webpack.config.js
├── tsconfig.json
│
├── src/
│   ├── index.tsx               # React root: mounts <App />
│   │
│   ├── App.tsx                 # Main layout: tabs + panels
│   │
│   ├── components/
│   │   ├── ColumnGrid/
│   │   │   ├── ColumnGrid.tsx  # Column configuration panel
│   │   │   ├── ColumnGrid.module.css
│   │   │   └── index.ts
│   │   ├── RowGrid/
│   │   │   ├── RowGrid.tsx     # Row configuration panel
│   │   │   ├── RowGrid.module.css
│   │   │   └── index.ts
│   │   ├── Margins/
│   │   │   ├── Margins.tsx     # Simple margins panel
│   │   │   └── index.ts
│   │   ├── Presets/
│   │   │   ├── Presets.tsx     # Preset list and management
│   │   │   ├── PresetItem.tsx  # Individual preset row
│   │   │   └── index.ts
│   │   └── shared/
│   │       ├── NumberInput.tsx # Numeric input with label
│   │       ├── Toggle.tsx      # Enable/disable toggle
│   │       ├── ProBadge.tsx    # "Pro" badge for gated features
│   │       └── ApplyButton.tsx # Main apply button
│   │
│   ├── hooks/
│   │   ├── usePhotoshop.ts     # Access to active PS document
│   │   ├── useDocument.ts      # Document width/height/selection
│   │   └── useLicense.ts       # Pro license verification
│   │
│   ├── services/
│   │   ├── gridGenerator.ts    # Guide position calculation
│   │   ├── photoshopBridge.ts  # Wrapper over UXP PS APIs
│   │   └── presetStorage.ts    # Preset CRUD in localStorage
│   │
│   ├── store/
│   │   ├── index.ts            # Store exports
│   │   ├── gridStore.ts        # ColumnGrid + RowGrid + Margins state
│   │   ├── presetsStore.ts     # Saved presets state
│   │   └── uiStore.ts          # UI state (active tab, loading, errors)
│   │
│   └── types/
│       ├── grid.types.ts       # GridConfig, ColumnConfig, RowConfig, etc.
│       ├── preset.types.ts     # Preset, PresetId
│       ├── photoshop.types.ts  # DocumentInfo, GuideInfo, Selection
│       └── license.types.ts    # LicenseStatus, LicenseTier
│
└── dist/                       # Build output (gitignored)
    ├── index.html
    └── index.js
```

### 4.2 Data Flow

```
User interacts with UI
        │
        ▼
  React Component
  (ColumnGrid, etc.)
        │ dispatch action
        ▼
  Zustand Store
  (gridStore.ts)
        │ getState()
        ▼
  gridGenerator.ts
  (calculates positions)
        │ positions[]
        ▼
  photoshopBridge.ts
  (calls UXP APIs)
        │ require('photoshop')
        ▼
  Adobe Photoshop
  (creates guides in document)
```

### 4.3 Separation of Concerns

| Layer | Responsibility | Does not do |
|-------|---------------|-------------|
| Components | UI, user inputs, visual feedback | Calculations, PS calls |
| Store (Zustand) | Reactive configuration state | Calculation logic, I/O |
| gridGenerator | Pure algorithm: config → positions | State, I/O |
| photoshopBridge | Abstraction over UXP APIs | Calculations, state |
| presetStorage | localStorage CRUD | Business validation |
| hooks | Connect PS with React reactively | Business logic |

**Key principle:** `gridGenerator.ts` is a pure function. It takes `GridConfig` and returns `GuidePosition[]`. It does not touch the store or PS APIs. This makes it 100% testable without Adobe mocks.

---

## 5. TypeScript Interfaces

### 5.1 Grid Configuration

```typescript
// src/types/grid.types.ts

export type WidthMode = 'auto' | 'fixed';
export type GuideOrientation = 'horizontal' | 'vertical';
export type ApplyTarget = 'canvas' | 'selection';
export type ApplyMode = 'replace' | 'add';

export interface ColumnConfig {
  enabled: boolean;
  columns: number;          // 1–24
  columnWidth: WidthMode;   // 'auto' or fixed value
  columnWidthValue: number; // px, used only if columnWidth === 'fixed'
  gutter: number;           // px between columns
  marginLeft: number;       // offset from left edge
  marginRight: number;      // offset from right edge
}

export interface RowConfig {
  enabled: boolean;
  rows: number;             // 1–100
  rowHeight: WidthMode;
  rowHeightValue: number;   // px, used only if rowHeight === 'fixed'
  gutter: number;           // px between rows
  marginTop: number;
  marginBottom: number;
}

export interface MarginsConfig {
  enabled: boolean;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface GridConfig {
  columns: ColumnConfig;
  rows: RowConfig;
  margins: MarginsConfig;
  applyTarget: ApplyTarget;
  applyMode: ApplyMode;
}

export interface GuidePosition {
  position: number;         // px from the document/selection origin
  orientation: GuideOrientation;
}

export interface GeneratedGuides {
  vertical: number[];       // absolute x positions (px)
  horizontal: number[];     // absolute y positions (px)
}
```

### 5.2 Presets

```typescript
// src/types/preset.types.ts

export type PresetId = string; // UUID v4

export interface Preset {
  id: PresetId;
  name: string;             // Name visible to the user
  description?: string;     // Optional: preset description
  config: GridConfig;       // Complete snapshot of the configuration
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
  isBuiltIn: boolean;       // true for pre-included presets (non-editable)
}

export interface PresetsStorage {
  version: number;          // For future migrations (initially 1)
  presets: Preset[];
}
```

### 5.3 Photoshop Document

```typescript
// src/types/photoshop.types.ts

export interface DocumentInfo {
  id: number;
  name: string;
  width: number;            // px
  height: number;           // px
  resolution: number;       // dpi (dots per inch)
  hasSelection: boolean;
}

export interface SelectionBounds {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}

export interface GuideInfo {
  position: number;         // px
  orientation: GuideOrientation; // horizontal or vertical
}

export interface DocumentContext {
  document: DocumentInfo;
  selection: SelectionBounds | null;
  guides: GuideInfo[];
}
```

### 5.4 Licenses

```typescript
// src/types/license.types.ts

export type LicenseTier = 'free' | 'pro';

export interface LicenseStatus {
  tier: LicenseTier;
  isActive: boolean;
  expiresAt?: string;       // ISO 8601, only for Pro with subscription
}

export interface FeatureGate {
  feature: string;
  requiredTier: LicenseTier;
  isAllowed: (license: LicenseStatus) => boolean;
}
```

### 5.5 Store Types

```typescript
// src/types/store.types.ts

export interface GridStore {
  config: GridConfig;
  // Actions
  setColumnConfig: (config: Partial<ColumnConfig>) => void;
  setRowConfig: (config: Partial<RowConfig>) => void;
  setMarginsConfig: (config: Partial<MarginsConfig>) => void;
  setApplyTarget: (target: ApplyTarget) => void;
  setApplyMode: (mode: ApplyMode) => void;
  resetToDefaults: () => void;
  loadFromPreset: (preset: Preset) => void;
}

export interface PresetsStore {
  presets: Preset[];
  // Actions
  addPreset: (name: string, config: GridConfig) => void;
  updatePreset: (id: PresetId, updates: Partial<Pick<Preset, 'name' | 'description'>>) => void;
  deletePreset: (id: PresetId) => void;
  applyPreset: (id: PresetId) => void;
}

export interface UIStore {
  activeTab: 'grid' | 'presets';
  isApplying: boolean;
  lastError: string | null;
  lastSuccess: boolean;
  // Actions
  setActiveTab: (tab: UIStore['activeTab']) => void;
  setApplying: (state: boolean) => void;
  setError: (message: string | null) => void;
  setSuccess: (state: boolean) => void;
}
```

### 5.6 Defaults

```typescript
// src/types/grid.types.ts (continued)

export const DEFAULT_COLUMN_CONFIG: ColumnConfig = {
  enabled: true,
  columns: 12,
  columnWidth: 'auto',
  columnWidthValue: 80,
  gutter: 20,
  marginLeft: 0,
  marginRight: 0,
};

export const DEFAULT_ROW_CONFIG: RowConfig = {
  enabled: false,
  rows: 8,
  rowHeight: 'auto',
  rowHeightValue: 80,
  gutter: 0,
  marginTop: 0,
  marginBottom: 0,
};

export const DEFAULT_MARGINS_CONFIG: MarginsConfig = {
  enabled: false,
  top: 40,
  right: 40,
  bottom: 40,
  left: 40,
};

export const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: DEFAULT_COLUMN_CONFIG,
  rows: DEFAULT_ROW_CONFIG,
  margins: DEFAULT_MARGINS_CONFIG,
  applyTarget: 'canvas',
  applyMode: 'replace',
};
```

---

## 6. Global State — Zustand Store

### 6.1 gridStore.ts

```typescript
// src/store/gridStore.ts
import { create } from 'zustand';
import { GridStore, GridConfig, DEFAULT_GRID_CONFIG, Preset } from '../types';

export const useGridStore = create<GridStore>((set) => ({
  config: DEFAULT_GRID_CONFIG,

  setColumnConfig: (partial) =>
    set((state) => ({
      config: {
        ...state.config,
        columns: { ...state.config.columns, ...partial },
      },
    })),

  setRowConfig: (partial) =>
    set((state) => ({
      config: {
        ...state.config,
        rows: { ...state.config.rows, ...partial },
      },
    })),

  setMarginsConfig: (partial) =>
    set((state) => ({
      config: {
        ...state.config,
        margins: { ...state.config.margins, ...partial },
      },
    })),

  setApplyTarget: (target) =>
    set((state) => ({ config: { ...state.config, applyTarget: target } })),

  setApplyMode: (mode) =>
    set((state) => ({ config: { ...state.config, applyMode: mode } })),

  resetToDefaults: () => set({ config: DEFAULT_GRID_CONFIG }),

  loadFromPreset: (preset: Preset) =>
    set({ config: preset.config }),
}));
```

### 6.2 presetsStore.ts

```typescript
// src/store/presetsStore.ts
import { create } from 'zustand';
import { PresetsStore, Preset, PresetId, GridConfig } from '../types';
import { presetStorage } from '../services/presetStorage';
import { useGridStore } from './gridStore';

export const usePresetsStore = create<PresetsStore>((set, get) => ({
  presets: presetStorage.load(),

  addPreset: (name, config) => {
    const preset: Preset = {
      id: crypto.randomUUID(),
      name,
      config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isBuiltIn: false,
    };
    const presets = [...get().presets, preset];
    presetStorage.save(presets);
    set({ presets });
  },

  updatePreset: (id, updates) => {
    const presets = get().presets.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    presetStorage.save(presets);
    set({ presets });
  },

  deletePreset: (id) => {
    const presets = get().presets.filter((p) => p.id !== id);
    presetStorage.save(presets);
    set({ presets });
  },

  applyPreset: (id) => {
    const preset = get().presets.find((p) => p.id === id);
    if (preset) {
      useGridStore.getState().loadFromPreset(preset);
    }
  },
}));
```

### 6.3 uiStore.ts

```typescript
// src/store/uiStore.ts
import { create } from 'zustand';
import { UIStore } from '../types';

export const useUIStore = create<UIStore>((set) => ({
  activeTab: 'grid',
  isApplying: false,
  lastError: null,
  lastSuccess: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setApplying: (state) => set({ isApplying: state }),
  setError: (message) => set({ lastError: message, lastSuccess: false }),
  setSuccess: (state) => set({ lastSuccess: state, lastError: null }),
}));
```

### 6.4 Store Rules

- **No calculation logic in the store.** The store only holds state and dispatches actions.
- **No PS API calls in the store.** All communication with PS goes through `photoshopBridge.ts`.
- **localStorage persistence is not the store's responsibility.** It is the responsibility of `presetStorage.ts`, called from store actions.
- The UI store (`uiStore.ts`) must never contain business logic — only visual state.

---

## 7. gridGenerator Service

### 7.1 Contract

```typescript
// src/services/gridGenerator.ts

export function generateGuides(
  config: GridConfig,
  context: { width: number; height: number; offsetX?: number; offsetY?: number }
): GeneratedGuides
```

**Parameters:**
- `config`: complete grid configuration
- `context.width`: available width (canvas or selection)
- `context.height`: available height (canvas or selection)
- `context.offsetX`: horizontal offset (0 if canvas, left if selection)
- `context.offsetY`: vertical offset (0 if canvas, top if selection)

**Returns:** `GeneratedGuides` with arrays of absolute positions in px.

### 7.2 Algorithm — Columns

```
INPUT: columns, gutter, marginLeft, marginRight, width, offsetX

1. availableWidth = width - marginLeft - marginRight
2. If availableWidth <= 0 → error: "Margins exceed document width"
3. If columnWidth === 'fixed':
     widthPerColumn = columnWidthValue
   Else:
     widthPerColumn = (availableWidth - gutter * (columns - 1)) / columns
4. If widthPerColumn <= 0 → error: "Gutter or column count is too large"
5. For each column i (0 to columns-1):
     x_left = offsetX + marginLeft + i * (widthPerColumn + gutter)
     x_right = x_left + widthPerColumn
     vertical.push(x_left, x_right)
6. Return vertical[] (deduplicated and sorted)
```

### 7.3 Algorithm — Rows

```
INPUT: rows, rowGutter, marginTop, marginBottom, height, offsetY

(analogous to columns but on the Y axis)

1. availableHeight = height - marginTop - marginBottom
2. If rowHeight === 'fixed':
     heightPerRow = rowHeightValue
   Else:
     heightPerRow = (availableHeight - rowGutter * (rows - 1)) / rows
3. For each row i (0 to rows-1):
     y_top = offsetY + marginTop + i * (heightPerRow + rowGutter)
     y_bot = y_top + heightPerRow
     horizontal.push(y_top, y_bot)
```

### 7.4 Algorithm — Simple Margins

```
If margins.enabled:
  horizontal.push(offsetY + margins.top)
  horizontal.push(offsetY + height - margins.bottom)
  vertical.push(offsetX + margins.left)
  vertical.push(offsetX + width - margins.right)
```

### 7.5 Full Implementation

```typescript
// src/services/gridGenerator.ts

import { GridConfig, GeneratedGuides } from '../types';

export class GridGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GridGenerationError';
  }
}

export function generateGuides(
  config: GridConfig,
  context: { width: number; height: number; offsetX?: number; offsetY?: number }
): GeneratedGuides {
  const { width, height, offsetX = 0, offsetY = 0 } = context;
  const vertical: number[] = [];
  const horizontal: number[] = [];

  // --- Columns ---
  if (config.columns.enabled) {
    const { columns, gutter, marginLeft, marginRight, columnWidth, columnWidthValue } = config.columns;
    const availableWidth = width - marginLeft - marginRight;

    if (availableWidth <= 0) {
      throw new GridGenerationError(
        `Margins (${marginLeft + marginRight}px) exceed the document width (${width}px)`
      );
    }

    const colWidth =
      columnWidth === 'fixed'
        ? columnWidthValue
        : (availableWidth - gutter * (columns - 1)) / columns;

    if (colWidth <= 0) {
      throw new GridGenerationError(
        `The gutter or column count results in columns with negative width`
      );
    }

    for (let i = 0; i < columns; i++) {
      const left = offsetX + marginLeft + i * (colWidth + gutter);
      const right = left + colWidth;
      vertical.push(Math.round(left * 100) / 100);
      vertical.push(Math.round(right * 100) / 100);
    }
  }

  // --- Rows ---
  if (config.rows.enabled) {
    const { rows, gutter, marginTop, marginBottom, rowHeight, rowHeightValue } = config.rows;
    const availableHeight = height - marginTop - marginBottom;

    if (availableHeight <= 0) {
      throw new GridGenerationError(
        `Vertical margins exceed the document height`
      );
    }

    const rHeight =
      rowHeight === 'fixed'
        ? rowHeightValue
        : (availableHeight - gutter * (rows - 1)) / rows;

    if (rHeight <= 0) {
      throw new GridGenerationError(
        `The gutter or row count results in rows with negative height`
      );
    }

    for (let i = 0; i < rows; i++) {
      const top = offsetY + marginTop + i * (rHeight + gutter);
      const bottom = top + rHeight;
      horizontal.push(Math.round(top * 100) / 100);
      horizontal.push(Math.round(bottom * 100) / 100);
    }
  }

  // --- Simple margins ---
  if (config.margins.enabled) {
    const { top, right, bottom, left } = config.margins;
    horizontal.push(offsetY + top);
    horizontal.push(offsetY + height - bottom);
    vertical.push(offsetX + left);
    vertical.push(offsetX + width - right);
  }

  return {
    vertical: [...new Set(vertical)].sort((a, b) => a - b),
    horizontal: [...new Set(horizontal)].sort((a, b) => a - b),
  };
}
```

---

## 8. UXP APIs — Photoshop Communication

### 8.1 photoshopBridge.ts — Full Wrapper

```typescript
// src/services/photoshopBridge.ts

// UXP provides these modules via require() — they are not npm packages
const photoshop = require('photoshop');
const app = photoshop.app;

export class PhotoshopBridge {

  // --- Active document ---

  async getActiveDocument(): Promise<DocumentInfo | null> {
    const doc = app.activeDocument;
    if (!doc) return null;
    return {
      id: doc.id,
      name: doc.name,
      width: doc.width,
      height: doc.height,
      resolution: doc.resolution,
      hasSelection: await this.hasActiveSelection(),
    };
  }

  // --- Selection ---

  async getSelectionBounds(): Promise<SelectionBounds | null> {
    const doc = app.activeDocument;
    if (!doc) return null;

    // batchPlay to get selection bounds
    const result = await photoshop.core.executeAsModal(async () => {
      return await photoshop.action.batchPlay(
        [{ _obj: 'get', _target: [{ _property: 'selection' }, { _ref: 'document', _enum: 'ordinal', _value: 'targetEnum' }] }],
        {}
      );
    }, { commandName: 'Get Selection' });

    if (!result?.[0]?.selection) return null;
    const sel = result[0].selection;
    return {
      top: sel.top._value,
      left: sel.left._value,
      bottom: sel.bottom._value,
      right: sel.right._value,
      width: sel.right._value - sel.left._value,
      height: sel.bottom._value - sel.top._value,
    };
  }

  private async hasActiveSelection(): Promise<boolean> {
    const bounds = await this.getSelectionBounds();
    return bounds !== null;
  }

  // --- Guides ---

  async getAllGuides(): Promise<GuideInfo[]> {
    const doc = app.activeDocument;
    if (!doc) return [];
    return doc.guides.map((g: any) => ({
      position: g.position,
      orientation: g.direction === 'horizontal' ? 'horizontal' : 'vertical',
    }));
  }

  async clearAllGuides(): Promise<void> {
    await photoshop.core.executeAsModal(async () => {
      await photoshop.action.batchPlay(
        [{ _obj: 'clearGuides', _target: [{ _ref: 'document', _enum: 'ordinal', _value: 'targetEnum' }] }],
        {}
      );
    }, { commandName: 'Clear Guides' });
  }

  async addGuide(position: number, orientation: GuideOrientation): Promise<void> {
    await photoshop.core.executeAsModal(async () => {
      await photoshop.action.batchPlay(
        [{
          _obj: 'set',
          _target: [{ _ref: 'guide', _enum: 'ordinal', _value: 'targetEnum' }],
          to: {
            _obj: 'guide',
            position: { _unit: 'pixelsUnit', _value: position },
            orientation: orientation === 'vertical' ? { _enum: 'orientation', _value: 'vertical' } : { _enum: 'orientation', _value: 'horizontal' },
          },
        }],
        {}
      );
    }, { commandName: 'Add Guide' });
  }

  // --- Grid application ---

  async applyGuides(guides: GeneratedGuides, mode: ApplyMode): Promise<void> {
    const doc = app.activeDocument;
    if (!doc) throw new Error('No active document in Photoshop');

    await photoshop.core.executeAsModal(async () => {
      if (mode === 'replace') {
        await photoshop.action.batchPlay(
          [{ _obj: 'clearGuides' }],
          {}
        );
      }

      // Add vertical guides
      for (const x of guides.vertical) {
        await photoshop.action.batchPlay(
          [{
            _obj: 'set',
            _target: [{ _ref: 'guide', _enum: 'ordinal', _value: 'targetEnum' }],
            to: {
              _obj: 'guide',
              position: { _unit: 'pixelsUnit', _value: x },
              orientation: { _enum: 'orientation', _value: 'vertical' },
            },
          }],
          {}
        );
      }

      // Add horizontal guides
      for (const y of guides.horizontal) {
        await photoshop.action.batchPlay(
          [{
            _obj: 'set',
            _target: [{ _ref: 'guide', _enum: 'ordinal', _value: 'targetEnum' }],
            to: {
              _obj: 'guide',
              position: { _unit: 'pixelsUnit', _value: y },
              orientation: { _enum: 'orientation', _value: 'horizontal' },
            },
          }],
          {}
        );
      }
    }, { commandName: 'Apply GuideMyGrid' });
  }
}

export const photoshopBridge = new PhotoshopBridge();
```

### 8.2 Critical Notes about batchPlay

- **All operations that modify the document must be inside `executeAsModal`.**
  UXP requires document write operations to be wrapped in a modal context. Without this, Photoshop will throw a permissions error.

- **`executeAsModal` blocks the PS UI** while executing. Keep operations short.

- **Units:** UXP works in pixels (`pixelsUnit`) but the document may be in cm/inches. Always specify `_unit: 'pixelsUnit'` explicitly.

- **Do not use `app.activeDocument.guides.add()`** directly. The high-level UXP API for guides is not fully implemented in all PS versions. Using `batchPlay` is more reliable.

### 8.3 Hook useDocument

```typescript
// src/hooks/useDocument.ts
import { useState, useEffect } from 'react';
import { photoshopBridge } from '../services/photoshopBridge';
import { DocumentInfo } from '../types';

export function useDocument() {
  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refresh = async () => {
      setLoading(true);
      const doc = await photoshopBridge.getActiveDocument();
      setDocument(doc);
      setLoading(false);
    };

    refresh();

    // Listen for active document changes
    // UXP supports PS events via photoshop.action.addNotificationListener
    const photoshop = require('photoshop');
    const listener = () => refresh();
    photoshop.action.addNotificationListener(['select', 'open', 'close'], listener);

    return () => {
      photoshop.action.removeNotificationListener(['select', 'open', 'close'], listener);
    };
  }, []);

  return { document, loading };
}
```

---

## 9. Component Specifications

### 9.1 App.tsx — Main Layout

```
┌─────────────────────────────────────────┐
│  GuideMyGrid              🔄 Refresh    │
├─────────────────────────────────────────┤
│  [Grid] [Presets]                       │ ← Tabs (Spectrum Tabs)
├─────────────────────────────────────────┤
│                                         │
│  Tab: Grid                              │
│  ┌─────────────────────────────────┐   │
│  │  ☑ Columns                      │   │
│  │  ... ColumnGrid panel ...        │   │
│  ├─────────────────────────────────┤   │
│  │  ☑ Rows                 [PRO]   │   │
│  │  ... RowGrid panel ...           │   │
│  ├─────────────────────────────────┤   │
│  │  ☐ Simple Margins               │   │
│  │  ... Margins panel ...           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Apply to: [Canvas ▼]  Mode: [Repl ▼]  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     ▶ Apply Grid                │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 9.2 ColumnGrid.tsx — Props and State

```typescript
interface ColumnGridProps {
  isPro: boolean;
}

// The component reads from the store, it does not receive config props
// It only needs isPro for the >12 columns gate
```

**Panel fields:**
- "Columns" toggle (enable/disable section)
- Number of columns (Spectrum NumberField, 1–12 Free / 1–24 Pro)
- Width: "Auto" / "Fixed" radio + NumberField for px
- Gutter (NumberField, px)
- Left margin (NumberField, px)
- Right margin (NumberField, px)

### 9.3 RowGrid.tsx

Same as ColumnGrid but for rows. The entire section shows a `<ProBadge />` if the user is Free, and inputs are disabled.

### 9.4 Presets.tsx

```
┌─────────────────────────────────────────┐
│  My Presets               [+ Save]     │
├─────────────────────────────────────────┤
│  🏷 12-col Web Standard           [▶] [✕] │
│  🏷 8pt iOS Grid                  [▶] [✕] │
│  🏷 A4 Poster                     [▶] [✕] │
│                                         │
│  [3/3 presets] ─── You need Pro to     │
│  save more.           [Go Pro →]        │
└─────────────────────────────────────────┘
```

**Built-in presets (Free):** not counted against the limit of 3.

### 9.5 Shared: NumberInput.tsx

```typescript
interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;   // 'px', '%' — decorative text displayed after the value
  disabled?: boolean;
}
```

Uses `<sp-textfield type="number">` from Adobe Spectrum. The `suffix` is displayed as decorative text.

### 9.6 Shared: ProBadge.tsx

Visual badge that indicates a feature requires Pro. Clicking it opens the upgrade modal (or URL to the Adobe Exchange marketplace).

---

## 10. Persistence — UXP localStorage

### 10.1 localStorage Schema

```typescript
// Key: 'guidemygrid_presets'
const STORAGE_KEY = 'guidemygrid_presets';

// Value: PresetsStorage serialized to JSON
{
  "version": 1,
  "presets": [
    {
      "id": "uuid-v4",
      "name": "12-col Web Standard",
      "config": { ... },
      "createdAt": "2026-03-06T12:00:00Z",
      "updatedAt": "2026-03-06T12:00:00Z",
      "isBuiltIn": false
    }
  ]
}
```

### 10.2 presetStorage.ts

```typescript
// src/services/presetStorage.ts
import { Preset, PresetsStorage } from '../types';

const STORAGE_KEY = 'guidemygrid_presets';
const CURRENT_VERSION = 1;

export const presetStorage = {
  load(): Preset[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return builtInPresets;
      const data: PresetsStorage = JSON.parse(raw);
      if (data.version !== CURRENT_VERSION) {
        return migrate(data);
      }
      return [...builtInPresets, ...data.presets];
    } catch {
      return builtInPresets;
    }
  },

  save(presets: Preset[]): void {
    const userPresets = presets.filter((p) => !p.isBuiltIn);
    const data: PresetsStorage = { version: CURRENT_VERSION, presets: userPresets };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
};

// Pre-included presets (always available, do not count toward the Free limit)
const builtInPresets: Preset[] = [
  {
    id: 'built-in-12col',
    name: '12-col Web',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    config: {
      ...DEFAULT_GRID_CONFIG,
      columns: { ...DEFAULT_COLUMN_CONFIG, columns: 12, gutter: 24, marginLeft: 80, marginRight: 80 },
    },
  },
  {
    id: 'built-in-8pt',
    name: '8pt Grid',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    config: {
      ...DEFAULT_GRID_CONFIG,
      rows: { ...DEFAULT_ROW_CONFIG, enabled: true, rowHeight: 'fixed', rowHeightValue: 8, rows: 20 },
    },
  },
];

function migrate(data: PresetsStorage): Preset[] {
  // Future migrations if the schema changes
  return builtInPresets;
}
```

### 10.3 localStorage Limitations in UXP

- Maximum size: ~5MB per plugin (sufficient for hundreds of presets)
- Not shared between different Adobe plugins
- Does not persist if the user uninstalls the plugin
- Does not synchronize across machines (accepted in MVP)

---

## 11. Freemium — Feature Gating

### 11.1 License Verification

UXP provides `require('uxp').entitlement` to verify whether the user has an active license on Adobe Exchange.

```typescript
// src/hooks/useLicense.ts
import { useState, useEffect } from 'react';
import { LicenseStatus } from '../types';

export function useLicense(): LicenseStatus {
  const [status, setStatus] = useState<LicenseStatus>({ tier: 'free', isActive: true });

  useEffect(() => {
    async function checkLicense() {
      try {
        const uxp = require('uxp');
        // The UXP entitlement API returns the Adobe Exchange license status
        const entitlement = await uxp.entitlement.checkStatus();
        setStatus({
          tier: entitlement.status === 'paid' ? 'pro' : 'free',
          isActive: true,
        });
      } catch {
        // If verification fails, assume Free (do not block due to network error)
        setStatus({ tier: 'free', isActive: true });
      }
    }
    checkLicense();
  }, []);

  return status;
}
```

### 11.2 Feature Gates

```typescript
// src/services/featureGates.ts
import { LicenseStatus } from '../types';

export const gates = {
  canUseRows: (l: LicenseStatus) => l.tier === 'pro',
  canUseMoreThan12Columns: (l: LicenseStatus) => l.tier === 'pro',
  canSaveMoreThan3Presets: (l: LicenseStatus, currentCount: number) =>
    l.tier === 'pro' || currentCount < 3,
  canApplyToSelection: (l: LicenseStatus) => l.tier === 'pro',
};
```

### 11.3 Graceful Downgrade Principle

If the user has Pro and downgrades to Free, their saved presets are not deleted. They simply cannot create new ones. If they have a 24-column grid and downgrade to Free, the UI shows the value in grey (readonly) along with a Pro badge.

---

## 12. Error Handling

### 12.1 Error Categories

| Category | Example | Action |
|----------|---------|--------|
| No active document | PS open with no document | UI message: "Open a document in Photoshop" |
| Calculation error | Margins > width | Inline message near the responsible field |
| PS API error | executeAsModal failed | Error toast + log to console |
| No license | Pro feature on Free account | ProBadge + redirect to Exchange |
| localStorage full | >5MB of presets | Notify and do not save |

### 12.2 Strategy

- **Calculation errors:** validated in `gridGenerator.ts` before calling PS. Shown inline near the field that caused them.
- **PS API errors:** caught in `photoshopBridge.ts`, propagated to the store via `uiStore.setError()`. Shown as a toast.
- **No automatic retries.** If PS fails, the user tries again.
- **No Sentry or remote logging in MVP** (the plugin is local, no backend).

### 12.3 Error Boundary

```typescript
// src/components/shared/ErrorBoundary.tsx
// Catches React render errors and shows a generic fallback
// Prevents a component crash from killing the entire panel
```

---

## 13. Build and Configuration

### 13.1 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 13.2 webpack.config.js

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  // UXP provides photoshop and uxp as external modules — do not bundle
  externals: {
    photoshop: 'photoshop',
    uxp: 'uxp',
    os: 'os',
    fs: 'fs',
    path: 'path',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.module\.css$/,
        use: ['style-loader', { loader: 'css-loader', options: { modules: true } }],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './index.html' }),
    new CopyWebpackPlugin({
      patterns: [{ from: 'manifest.json', to: '.' }],
    }),
  ],
  mode: 'development',
};
```

**Critical:** `photoshop`, `uxp`, `os`, `fs`, `path` must be in `externals`. UXP provides them at runtime. If Webpack bundles them, the plugin will not work.

### 13.3 npm Scripts

```json
{
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack --mode development --watch",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "test": "jest"
  }
}
```

### 13.4 Development Workflow

```
1. npm run dev          → Watch mode, generates dist/ on the fly
2. Adobe UXP Dev Tool   → Load plugin from dist/
                          (Add Plugin → select manifest.json in dist/)
3. Photoshop            → The panel appears in Plugins → GuideMyGrid
4. Edit code            → Webpack rebuilds → Reload in UXP Dev Tool (Reload button)
```

There is no real hot module replacement in UXP. Every change requires a manual plugin reload in the UXP Developer Tool.

---

## 14. manifest.json — UXP Configuration

```json
{
  "manifestVersion": 5,
  "id": "com.guidemygrid.plugin",
  "name": "GuideMyGrid",
  "version": "1.0.0",
  "main": "index.html",
  "host": [
    {
      "app": "PS",
      "minVersion": "22.0.0"
    }
  ],
  "entrypoints": [
    {
      "type": "panel",
      "id": "guidemygrid-panel",
      "label": {
        "default": "GuideMyGrid"
      },
      "minimumSize": { "width": 240, "height": 400 },
      "maximumSize": { "width": 400, "height": 800 },
      "preferredDockedSize": { "width": 280, "height": 600 },
      "icons": [
        { "width": 23, "height": 23, "path": "icons/icon-23.png", "scale": [1, 2], "theme": ["all"] }
      ]
    }
  ],
  "icons": [
    { "width": 23, "height": 23, "path": "icons/icon-23.png", "scale": [1, 2], "theme": ["all"] },
    { "width": 96, "height": 96, "path": "icons/icon-96.png", "scale": [1, 2], "theme": ["all"] }
  ],
  "requiredPermissions": {
    "launchProcess": false,
    "localFileSystem": "plugin",
    "network": {
      "domains": ["https://api.github.com"]
    },
    "allowCodeGenerationFromStrings": false
  }
}
```

**Notes:**
- `"localFileSystem": "plugin"` grants access only to the plugin directory, not to the user's file system. Sufficient for localStorage.
- `"network": { "domains": ["https://api.github.com"] }` — required for the update check via GitHub Releases API.
- `manifestVersion: 5` is the most recent version supported by PS 22+.
- **When adding post-MVP licenses** (e.g. LemonSqueezy): add `"https://api.lemonsqueezy.com"` to `domains`.

---

## 15. Performance Targets

| Operation | Target | Maximum Acceptable |
|-----------|--------|--------------------|
| Initial panel load | < 300ms | 500ms |
| Guide calculation (gridGenerator) | < 5ms | 20ms |
| Apply guides to PS (batchPlay) | < 1s (24 cols + 24 rows = 96 guides) | 3s |
| Load presets from localStorage | < 10ms | 50ms |
| Save preset | < 20ms | 100ms |

**Guide limits:**
- 24 columns x 2 guides + 100 rows x 2 guides = maximum 248 guides per application
- Adobe Photoshop has no documented guide limit, but > 500 guides starts to degrade PS
- In MVP: maximum 24 cols + 100 rows = 248 guides. Acceptable.

**Optimizations:**
- `executeAsModal` with all guides in a single block (not one call per guide)
- Round positions to 2 decimal places to avoid near-duplicate guides
- Deduplicate positions before sending to PS

---

## 16. Testing Strategy

### 16.1 What Can Be Tested

| Module | Test type | Tool |
|--------|-----------|------|
| `gridGenerator.ts` | Pure unit tests | Jest |
| Zustand stores | Unit tests with testing-library | Jest + @testing-library/react |
| `presetStorage.ts` | Unit with localStorage mock | Jest |
| Components | Snapshot + interaction | Jest + React Testing Library |
| `photoshopBridge.ts` | **Not automatically testable** | Manual in PS |

### 16.2 Why photoshopBridge Cannot Be Tested Automatically

UXP APIs (`require('photoshop')`) only exist in the Photoshop runtime. There is no official emulator. Integration testing is done manually in PS during development.

### 16.3 Critical Tests — gridGenerator

```typescript
// src/services/__tests__/gridGenerator.test.ts

describe('generateGuides - columns', () => {
  test('12 auto columns, no margins, no gutter', () => {
    const guides = generateGuides(
      { ...DEFAULT_GRID_CONFIG, columns: { enabled: true, columns: 12, columnWidth: 'auto', columnWidthValue: 0, gutter: 0, marginLeft: 0, marginRight: 0 } },
      { width: 1200, height: 800 }
    );
    // 12 columns x 2 guides = 24 vertical positions
    expect(guides.vertical).toHaveLength(24);
    expect(guides.vertical[0]).toBe(0);
    expect(guides.vertical[1]).toBe(100); // 1200/12 = 100
  });

  test('throws error if margins exceed width', () => {
    expect(() => generateGuides(
      { ...DEFAULT_GRID_CONFIG, columns: { ...DEFAULT_COLUMN_CONFIG, enabled: true, marginLeft: 700, marginRight: 700 } },
      { width: 1000, height: 800 }
    )).toThrow(GridGenerationError);
  });

  test('guides with selection offset', () => {
    const guides = generateGuides(
      { ...DEFAULT_GRID_CONFIG, columns: { enabled: true, columns: 2, columnWidth: 'auto', columnWidthValue: 0, gutter: 0, marginLeft: 0, marginRight: 0 } },
      { width: 200, height: 100, offsetX: 50 }
    );
    expect(guides.vertical[0]).toBe(50);  // 50 + 0
    expect(guides.vertical[1]).toBe(150); // 50 + 100
  });
});
```

---

## 17. Release — Direct Distribution (without Adobe Exchange)

### 17.1 Publication Process

```
1. npm run build                        → Generates optimized dist/
2. Package as .ccx:
   cd dist && zip -r ../guidemygrid-v1.0.0.ccx . && cd ..
3. Create GitHub Release:
   - Tag: v1.0.0 (sync with manifest.json + PLUGIN_VERSION in updateChecker.ts)
   - Attach guidemygrid-v1.0.0.ccx as a release asset
   - Write release notes (will appear in the plugin's UpdateBanner)
4. Update download page (own website or repo README)
5. Immediate publication — no Adobe review
```

**Installation for end users:**
```
1. Download guidemygrid-v1.0.0.ccx from the web/GitHub
2. Double-click the .ccx file
3. Creative Cloud Desktop shows an installation confirmation dialog
4. Accept → plugin available in Photoshop → Plugins → GuideMyGrid
```

### 17.2 Update Process for Existing Users

```
The plugin detects the new version (GitHub Releases API)
  → Shows UpdateBanner: "New version v1.1.0 available → Download"
  → User clicks → downloads the new .ccx
  → Double-click the .ccx → CC Desktop replaces the previous version
  → Their presets and settings are preserved (localStorage migration)
```

### 17.3 Release Checklist

Before each release, verify:
- [ ] `PLUGIN_VERSION` in `src/services/updateChecker.ts` updated
- [ ] `"version"` in `manifest.json` updated
- [ ] `"version"` in `package.json` updated (all three must match)
- [ ] `migrate()` function in `presetStorage.ts` updated if schema changes
- [ ] `CURRENT_VERSION` in `presetStorage.ts` incremented if schema changes
- [ ] `npm run build` succeeds without errors
- [ ] Manual testing in PS macOS + Windows
- [ ] Release notes written in the GitHub Release

### 17.4 Versioning

```
1.0.0 → Initial MVP (free)
1.x.0 → Post-MVP features (row grid, apply to selection)
1.x.x → Bug fixes and minor improvements
2.0.0 → Monetization (license key system) or multi-app Adobe support
```

**Rule:** If the localStorage schema changes (breaks backward compat), increment MINOR. If there are only logic/UI changes, PATCH is sufficient.


## 18. Competitors

| Plugin | Price | Strength | Weakness | GuideMyGrid Differentiator |
|--------|-------|----------|----------|---------------------------|
| GuideGuide | Free/$45/yr | Best known, familiar UI | Columns only, no rows, dated UI | Rows + margins + modern Spectrum UI |
| Grids for Designers | $49 one-time | Robust, many options | Learning curve, expensive | Simpler, accessible freemium |
| Grid Systems | Free | Free | Unmaintained (last update 2019) | Maintained, modern PS support |

**Differential value proposition:**
1. Modern UI (Adobe Spectrum, native PS dark mode)
2. Row grid (no free competitor has it)
3. Apply to active selection (not just canvas)
4. Useful built-in presets from day one

[Full analysis → docs/reference/competitive-analysis.md]

---

## 19. Implementation Plan

### Week 1: Setup + Core Engine

**Goal:** Plugin loadable in PS with gridGenerator working.

- [ ] Initialize project with UXP + React + TypeScript template
- [ ] Configure Webpack with correct externals
- [ ] Set up Adobe UXP Developer Tool
- [ ] Implement `gridGenerator.ts` with tests
- [ ] Implement basic `photoshopBridge.ts` (clearGuides + addGuide)
- [ ] Verify that simple guides can be applied to PS

### Week 2: Base UI — ColumnGrid

**Goal:** User can configure and apply a column grid.

- [ ] Main `App.tsx` layout with Spectrum tabs
- [ ] Complete `ColumnGrid.tsx` with all inputs
- [ ] Zustand store ↔ ColumnGrid integration
- [ ] Functional "Apply" button end-to-end
- [ ] `useDocument.ts` to display active document dimensions

### Week 3: RowGrid + Margins

**Goal:** Functional rows and margins.

- [ ] Complete `RowGrid.tsx`
- [ ] `Margins.tsx`
- [ ] Apply target: canvas vs selection (`getSelectionBounds`)
- [ ] Replace vs add mode

### Week 4: Presets

**Goal:** Complete preset system.

- [ ] `presetStorage.ts`
- [ ] `Presets.tsx` + `PresetItem.tsx`
- [ ] Save preset with name from current configuration
- [ ] Apply preset (loads config into store)
- [ ] Built-in presets included

### Week 5: Freemium + Polish

**Goal:** Pro feature gating + refined UX.

- [ ] `useLicense.ts` with UXP entitlement
- [ ] `ProBadge.tsx` and gates in UI
- [ ] 3-preset limit for Free
- [ ] Input validation (min, max values)
- [ ] Inline error messages

### Week 6: Testing + Release

**Goal:** Full QA and publication on Exchange.

- [ ] Unit tests for `gridGenerator.ts` (100% coverage)
- [ ] Manual testing in PS macOS + Windows
- [ ] Testing with documents in inches, cm, px
- [ ] Plugin icons (23px and 96px)
- [ ] Production build + `.ccx` packaging
- [ ] Publication on Adobe Exchange

---

## 20. Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| UXP guide API does not work on all PS versions | Medium | High | Test on PS 22, 23, 24, 25 in week 1 |
| `executeAsModal` slow with many guides | Medium | Medium | Benchmark with 248 guides in week 1 |
| Adobe Exchange review takes > 2 weeks | High | Low | Submit in week 5, do not wait until week 6 |
| `uxp.entitlement` unavailable in older PS versions | Low | Medium | Downgrade to Free if it fails, do not block |
| Conflicts between Spectrum CSS and CSS Modules | Low | Low | Use only Spectrum components, minimal CSS |
| localStorage corrupted by PS crash | Low | Medium | try/catch in load(), fallback to built-ins |

---

**Status:** ✅ Architecture complete. Ready to begin implementation.

**Next step:** `/oden:prd grid-columns` → Create PRD for the columns module and start the feature pipeline.
