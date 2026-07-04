<!-- refreshed: 2026-07-04 -->
# Architecture

**Analysis Date:** 2026-07-04

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer (React)                        │
├──────────────────┬──────────────────┬───────────────────────┤
│     App.tsx      │   GridPanel      │   SideGuidesBar       │
│  (shell/tabs)    │ (main grid form) │ (quick guides)        │
│  `src/App.tsx`   │ `src/components/ │ `src/components/      │
│                  │  ColumnGrid/...` │  SideGuidesBar/...`   │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   State Management (Zustand)                 │
│  gridStore: columns, rows, margins config                   │
│  uiStore: guidesVisible, isApplying, lastError              │
│  `src/store/gridStore.ts`, `src/store/uiStore.ts`           │
└─────────────────────────────────────────────────────────────┘
         │                                       │
         ▼                                       ▼
┌────────────────────────────┐   ┌────────────────────────────┐
│  Service Layer             │   │  Hooks Layer               │
├────────────────────────────┤   ├────────────────────────────┤
│ gridGenerator.ts           │   │ useDocument.ts             │
│ - generateColumnGuides()   │   │ - listens to Photoshop     │
│ - generateRowGuides()      │   │ - syncs doc/selection      │
│ - generateMarginGuides()   │   │ - debounces events         │
│ - generateSideGuide()      │   │                            │
│                            │   │                            │
│ photoshopBridge.ts         │   │                            │
│ - applyGuides()            │   │                            │
│ - clearAllGuides()         │   │                            │
│ - toggleGuidesVisibility() │   │                            │
│ - addGuide()               │   │                            │
│ - getActiveDocument()      │   │                            │
│ - getSelectionBounds()     │   │                            │
│                            │   │                            │
│ updateChecker.ts           │   │                            │
│ - checkForUpdates()        │   │                            │
│ - validateRelease()        │   │                            │
│                            │   │                            │
│ `src/services/`            │   │ `src/hooks/`               │
└────────────────────────────┘   └────────────────────────────┘
         │                               │
         └───────────────┬───────────────┘
                         ▼
         ┌───────────────────────────────┐
         │  External Integration (UXP)   │
         │  Adobe Photoshop Runtime      │
         │  (ActionDescriptor API)       │
         └───────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **App** | Root shell with tab bar and toggle guides visibility | `src/App.tsx` |
| **GridPanel** | Main form for column, row, margin configuration | `src/components/ColumnGrid/GridPanel.tsx` |
| **SideGuidesBar** | Quick-access buttons for individual edge/center guides | `src/components/SideGuidesBar/SideGuidesBar.tsx` |
| **UpdateBanner** | Dismissible update notification with download link | `src/components/shared/UpdateBanner.tsx` |
| **gridStore** | Zustand store for column/row/margin state | `src/store/gridStore.ts` |
| **uiStore** | Zustand store for UI state (loading, error, visibility) | `src/store/uiStore.ts` |
| **gridGenerator** | Pure functions to calculate guide positions | `src/services/gridGenerator.ts` |
| **photoshopBridge** | Class wrapping UXP API for Photoshop interaction | `src/services/photoshopBridge.ts` |
| **updateChecker** | GitHub API client to fetch latest release info | `src/services/updateChecker.ts` |
| **useDocument** | Custom hook syncing active document + selection from Photoshop | `src/hooks/useDocument.ts` |

## Pattern Overview

**Overall:** Event-driven React UI with Zustand state management, pure function business logic, and bridged external integration (UXP → Photoshop).

**Key Characteristics:**
- **UI-centric:** React components control all user interactions and render forms
- **Stateless services:** Grid generation uses pure functions (no class state)
- **Singleton services:** `photoshopBridge` and `updateChecker` are module-level singletons
- **Decoupled integration:** UXP API calls isolated in `photoshopBridge`, never called directly from components
- **Debounced events:** `useDocument` debounces Photoshop notifications to avoid flooding batchPlay API
- **Optimistic UI:** Form inputs update immediately in store; Photoshop updates are async and catch errors

## Layers

**UI Layer:**
- Purpose: Render forms, buttons, and user inputs; dispatch state changes
- Location: `src/App.tsx`, `src/components/`
- Contains: React functional components, inline SVG icons, CSS Module styles
- Depends on: Zustand stores, hooks, service functions
- Used by: Browser/UXP runtime

**State Management Layer:**
- Purpose: Hold form values (columns, rows, margins) and UI state (loading, error, visibility)
- Location: `src/store/`
- Contains: Zustand `create()` hooks with initial state and setters
- Depends on: Type definitions from `src/types/store.types.ts`
- Used by: All UI components via `useGridStore()` and `useUIStore()` hooks

**Service Layer:**
- Purpose: Business logic for grid math and Photoshop integration
- Location: `src/services/`
- Contains:
  - `gridGenerator.ts`: Pure functions calculating guide positions (no side effects)
  - `photoshopBridge.ts`: Class wrapping UXP API, handles modal execution and error recovery
  - `updateChecker.ts`: GitHub API client with response validation
- Depends on: Type definitions, UXP runtime (photoshop/uxp modules)
- Used by: Components and hooks

**Hooks Layer:**
- Purpose: Side effects that sync external state (Photoshop document) into React
- Location: `src/hooks/`
- Contains: `useDocument` listening to Photoshop events, debouncing, updating React state
- Depends on: `photoshopBridge`, React hooks
- Used by: `App.tsx` to inject document/selection context

**Type Definition Layer:**
- Purpose: TypeScript interfaces and types for all domains
- Location: `src/types/`
- Contains: Grid config types, Photoshop types, store types, license types
- Depends on: Nothing (foundation layer)
- Used by: All layers

## Data Flow

### Primary Request Path (Apply Grid)

1. **User input** — GridPanel form captures column count/gutter, row count/gutter, margins (`src/components/ColumnGrid/GridPanel.tsx:214–239`)
2. **Store update** — `setColumns()`, `setRows()`, `setMargins()` called on Zustand store (`src/store/gridStore.ts`)
3. **UI re-render** — Components re-render, computed widths/heights calculated (`src/components/ColumnGrid/GridPanel.tsx:130–182`)
4. **User clicks "Add guides"** — `handleAdd()` triggers (`src/components/ColumnGrid/GridPanel.tsx:185–212`)
5. **Grid generation** — `generateColumnGuides()`, `generateRowGuides()`, `generateMarginGuides()` compute absolute pixel positions (`src/services/gridGenerator.ts:42–132`)
6. **Photoshop application** — `photoshopBridge.applyGuides({ vertical, horizontal }, 'replace')` batches all guides in one `batchPlay()` call (`src/services/photoshopBridge.ts:169–210`)
7. **Error handling** — If GridGenerationError or UXP error, catch block sets `lastError` in uiStore (`src/components/ColumnGrid/GridPanel.tsx:207–211`)

### Document Context Sync (useDocument hook)

1. **Mount** — `useDocument()` calls `refresh()` immediately to fetch active document (`src/hooks/useDocument.ts:21–39`)
2. **Photoshop events** — Listener registered for `['select', 'open', 'close', 'set', 'deselect', 'selectAllWithMask']` (`src/hooks/useDocument.ts:50`)
3. **Debounce** — Events debounced 150ms to avoid rapid batchPlay calls (`src/hooks/useDocument.ts:13, 53–56`)
4. **State update** — `setDocument()`, `setSelection()` updated with fresh data from photoshopBridge (`src/hooks/useDocument.ts:24–30`)
5. **Components consume** — GridPanel reads `document`, `selection` from hook to calculate container dimensions (`src/components/ColumnGrid/GridPanel.tsx:129, 136–138`)

### Side Guide Quick-Add Flow

1. **User clicks edge/center button** — SideGuidesBar button handler fires (`src/components/SideGuidesBar/SideGuidesBar.tsx:161–174`)
2. **Position calculated** — `generateSideGuide(type, { containerWidth, containerHeight, offsetX, offsetY })` returns absolute position + orientation (`src/services/gridGenerator.ts:11–29`)
3. **Single guide added** — `photoshopBridge.addGuide(position, orientation)` adds one guide via batchPlay (`src/services/photoshopBridge.ts:150–165`)
4. **Loading state** — Button shows loading until async completes, then resets (`src/components/SideGuidesBar/SideGuidesBar.tsx:159, 183–184`)

**State Management:**
- Form state lives in `gridStore` (columns, rows, margins) — persists across tab switches
- UI state lives in `uiStore` (isApplying, lastError, guidesVisible, marginsLocked)
- Document context comes from hook `useDocument`, not stored (real-time sync with Photoshop)
- No caching of Photoshop guides — always read fresh on demand

## Key Abstractions

**GridGenerationError:**
- Purpose: Custom error class for grid math failures (negative column width, invalid gutter)
- Examples: `src/services/gridGenerator.ts:31–35`
- Pattern: Thrown from `generateColumnGuides()`, `generateRowGuides()` when constraints violated; caught in GridPanel.handleAdd() to set lastError

**PhotoshopBridge (Singleton):**
- Purpose: Encapsulate all UXP/Photoshop API interactions
- Examples: `src/services/photoshopBridge.ts` (class definition), `src/services/photoshopBridge.ts:213` (singleton export)
- Pattern: All Photoshop batchPlay calls wrapped in `executeAsModal()` for proper UXP threading; errors logged but not thrown (silent fail for network/API issues in updateChecker)

**Guide Position Calculation:**
- Pure functions with no side effects
- Input: container dimensions + offset (left/top from canvas or selection)
- Output: Array of absolute pixel positions (X or Y)
- Examples: `generateColumnGuides()`, `generateRowGuides()`, `generateMarginGuides()`, `generateSideGuide()`

**Zustand Stores as Hooks:**
- Pattern: `useGridStore()` and `useUIStore()` return state + setter functions
- No reducer logic; direct mutations via `set()`
- Shallow equality check (default) sufficient for flat objects

## Entry Points

**Application Start:**
- Location: `src/index.tsx`
- Triggers: UXP plugin loads index.html in Adobe Photoshop panel
- Responsibilities: React DOM mount to `#root` div, render `<App />`

**App Root:**
- Location: `src/App.tsx`
- Triggers: Rendered by ReactDOM.createRoot in index.tsx
- Responsibilities: Tab bar shell, toggle guides visibility button, conditional no-document notice, render GridPanel

**GridPanel (Main Work Area):**
- Location: `src/components/ColumnGrid/GridPanel.tsx`
- Triggers: Rendered by App.tsx (always visible when document open)
- Responsibilities: Form for all grid/margin config, "Add guides" / "Clear guides" / "Reset" buttons, error display

**SideGuidesBar (Quick-Access Area):**
- Location: `src/components/SideGuidesBar/SideGuidesBar.tsx`
- Triggers: Rendered above GridPanel content
- Responsibilities: 6 quick buttons (left, right, top, bottom, center-h, center-v) for individual guides

## Architectural Constraints

- **UXP Threading:** All Photoshop API calls must wrap in `photoshop.core.executeAsModal()`. Calls outside modal will fail or deadlock.
- **No DOM globals:** UXP does not expose `window`, `document`, `localStorage`. Only UXP-provided APIs available.
- **No dynamic imports:** webpack bundles entire app; cannot lazy-load code at runtime.
- **Module-level singletons:** `photoshopBridge` and stores are global Zustand hooks; if used in multiple component trees, all share same state (correct for single-panel UXP app).
- **Debouncing required:** Photoshop events fire rapidly (e.g., dragging a layer selection); batchPlay without debounce will flood and timeout. 150ms debounce observed as safe threshold.
- **Selection detection:** `hasSelection` boolean on DocumentInfo is computed via `getSelectionBounds()` call; reading `doc.hasSelection` property is unreliable. Always call bridge method.

## Anti-Patterns

### Calling Photoshop API directly from components

**What happens:** Components import `photoshop` module and call batchPlay directly
**Why it's wrong:** Makes testing impossible, couples UI to UXP threading rules, loses error boundary
**Do this instead:** Call methods on `photoshopBridge` singleton from `src/services/photoshopBridge.ts`; components never `require('photoshop')`

### Storing Photoshop document state in Zustand

**What happens:** GridPanel stores latest guide list, document dimensions in gridStore
**Why it's wrong:** Document state changes every time user opens a new document; Zustand persists across navigation, creating stale data
**Do this instead:** Query Photoshop fresh in `useDocument()` hook on every event; use hook return value (document, selection) directly in components

### Unbound async operations in event handlers

**What happens:** `handleAdd()` calls `photoshopBridge.applyGuides()` without try/catch or state tracking
**Why it's wrong:** If Photoshop API fails, user sees no feedback; multiple rapid clicks spawn parallel operations
**Do this instead:** Wrap in try/catch, set isApplying state before/after, disable button while pending (observed pattern in `GridPanel.tsx:185–211`)

### Passing batchPlay result directly to TypeScript

**What happens:** ActionDescriptor returned from batchPlay is `any`; code assumes shape without validation
**Why it's wrong:** Photoshop API evolves; responses differ between versions
**Do this instead:** Validate response shape before use (e.g., `updateChecker.ts` validateRelease function, `photoshopBridge.ts` hasActiveSelection checking bounds)

## Error Handling

**Strategy:** Three-tier error handling

1. **Grid generation errors** — GridGenerationError for validation (negative width) → caught in handleAdd(), set lastError, user sees message
2. **Photoshop API errors** — batchPlay throws or returns error descriptor → caught, logged, error message set (except in updateChecker, which silently fails)
3. **Network errors** — GitHub API in updateChecker times out → caught, returns null, banner never shown

**Patterns:**
- Validation errors (`GridGenerationError`) surfaced to UI via `lastError`
- UXP/Photoshop errors logged to console, may hide error message from user to avoid blocking UI
- Network failures silent (never block user workflows)

## Cross-Cutting Concerns

**Logging:** `console.error()` prefixed with `[GMG]` for grep-ability. No structured logging. Examples:
  - `src/hooks/useDocument.ts:33`: `console.error('[GMG] useDocument refresh failed:', err)`
  - `src/services/photoshopBridge.ts:123`: `console.error('[GMG] getGuidesVisible fallback:', err)`

**Validation:** Type-safe via TypeScript strict mode. Explicit schema validation in updateChecker (validateRelease function) before consuming GitHub API response.

**Authentication:** No auth required. Photoshop API access via built-in UXP runtime. GitHub API unauthenticated (public releases endpoint, 60 req/hr limit acceptable for periodic checks).

---

*Architecture analysis: 2026-07-04*
