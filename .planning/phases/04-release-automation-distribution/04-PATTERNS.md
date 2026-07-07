# Phase 4: Release Automation & Distribution - Pattern Map

**Mapped:** 2026-07-07
**Files analyzed:** 8
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `manifest.json` (modified) | config | request-response (declares permission) | `manifest.json` (own prior git history, commit `2ea272d`) | exact (revert) |
| `src/App.tsx` (modified) | component (root shell) | event-driven (mount effect) | `src/hooks/useDocument.ts` (mount-effect shape) + `src/App.tsx` itself (existing `DocumentHintBanner` conditional-render pattern) | exact |
| `src/store/uiStore.ts` (modified) | store | CRUD (state get/set) | itself — existing `guidesVisible`/`lastError` fields | exact |
| `src/types/store.types.ts` (modified) | model/types | — | itself — existing `UIStore` interface | exact |
| `src/__tests__/updateChecker.test.ts` (new) | test | request-response (mocked fetch) | `src/__tests__/checksums.test.ts` (Node-built-in style) + `src/__tests__/documentWatcher.test.ts` (fake-timers/describe shape) | role-match |
| `src/__tests__/UpdateBanner.test.tsx` (new) | test | request-response (render/interaction) | No existing `.test.tsx` component-render test in repo | no analog (see below) |
| `src/__tests__/App.updateBanner.test.tsx` (new) | test | event-driven (mount wiring) | `src/__tests__/documentWatcher.test.ts` (mount + fake timers) | partial-match |
| `src/__tests__/manifest-permissions.test.ts` (new) | test | static/config check | `src/__tests__/macos-installer-retirement.test.ts` (static file/JSON assertion pattern) | exact |
| `.planning/phases/04.../gumroad-page-copy.md` (new) | deliverable doc, not code | — | N/A — no code analog; follow this phase's own CONTEXT.md/RESEARCH.md prose conventions | no analog |

## Pattern Assignments

### `src/App.tsx` (component, event-driven)

**Analog:** `src/hooks/useDocument.ts` (mount-effect shape) + `src/App.tsx`'s existing `DocumentHintBanner` conditional render

**Imports pattern** (App.tsx lines 1-8, add two lines):
```typescript
// src/App.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useUIStore } from './store';
import { GridPanel } from './components/ColumnGrid/GridPanel';
import { DocumentHintBanner } from './components/shared/DocumentHintBanner';
import { useDocument } from './hooks/useDocument';
import { photoshopBridge } from './services/photoshopBridge';
import styles from './App.module.css';
// ADD:
import { checkForUpdates } from './services/updateChecker';
import { UpdateBanner } from './components/shared/UpdateBanner';
```

**Mount-effect pattern** (modeled on `useDocument.ts` lines 72-125, specifically the cancellation-guard shape used there for async work inside `useEffect`):
```typescript
// useDocument.ts's refresh() + cleanup pattern, adapted (RESEARCH.md Code Examples,
// cross-checked against this project's own useEffect return-cleanup convention)
useEffect(() => {
  let cancelled = false;
  checkForUpdates().then((info) => {
    if (!cancelled && info?.hasUpdate) setUpdateInfo(info);
  });
  return () => { cancelled = true; };
}, []); // D-04: fires on every mount (panel open), no throttle
```

**Conditional-render pattern** (App.tsx lines 69-71, existing `DocumentHintBanner` usage — copy this exact shape for `UpdateBanner`):
```typescript
{/* ── No-canvas-detected hint (dismissible) ── */}
{!document && !hintDismissed && (
  <DocumentHintBanner onDismiss={() => setHintDismissed(true)} />
)}

// ADD, same pattern:
{updateInfo && (
  <UpdateBanner info={updateInfo} onDismiss={dismissUpdate} />
)}
```

**Error handling:** None needed in `App.tsx` — `checkForUpdates()` already swallows all errors internally and resolves `null` (never rejects). Do not wrap the `.then()` in try/catch; that would deviate from the project's established silent-null convention (`updateChecker.ts` lines 45-70).

---

### `src/store/uiStore.ts` (store, CRUD) and `src/types/store.types.ts`

**Analog:** itself — existing `guidesVisible`/`setGuidesVisible` field+setter pair

**Full existing file** (`src/store/uiStore.ts`, 15 lines — copy this shape exactly for new fields):
```typescript
// src/store/uiStore.ts
import { create } from 'zustand';
import { UIStore } from '../types';

export const useUIStore = create<UIStore>((set) => ({
  guidesVisible: true,
  isApplying: false,
  lastError: null,
  marginsLocked: true,

  setGuidesVisible: (v) => set({ guidesVisible: v }),
  setApplying: (state) => set({ isApplying: state }),
  setError: (message) => set({ lastError: message }),
  setMarginsLocked: (v) => set({ marginsLocked: v }),
}));

// ADD (matching exact style — flat field, single setter, no shallow-merge needed
// since UpdateInfo is replaced wholesale, not partially patched):
// updateInfo: UpdateInfo | null,
// setUpdateInfo: (info) => set({ updateInfo: info }),
// dismissUpdate: () => set({ updateInfo: null }),
```

**Type definition pattern** (`src/types/store.types.ts` lines 29-37, existing `UIStore` interface — extend, don't replace):
```typescript
export interface UIStore {
  guidesVisible: boolean;
  isApplying: boolean;
  lastError: string | null;
  marginsLocked: boolean;
  setGuidesVisible: (v: boolean) => void;
  setApplying: (state: boolean) => void;
  setError: (message: string | null) => void;
  setMarginsLocked: (v: boolean) => void;
  // ADD:
  // updateInfo: UpdateInfo | null;
  // setUpdateInfo: (info: UpdateInfo | null) => void;
  // dismissUpdate: () => void;
}
```
Note: `UpdateInfo` is exported from `src/services/updateChecker.ts` (line 8) — import it into `store.types.ts` rather than redefining.

---

### `manifest.json` (config, request-response)

**Analog:** the project's own prior manifest content at git commit `2ea272d` (pre-Phase-1-removal)

**Exact block to re-add** (RESEARCH.md Code Examples, confirmed exact revert):
```json
{
  "requiredPermissions": {
    "network": {
      "domains": ["https://api.github.com"]
    }
  }
}
```
Insert as a top-level sibling key alongside existing `manifestVersion`, `id`, `name`, `version`, `main`, `host`, `entrypoints`, `icons` (see full current file, 62 lines, read in full — no truncation needed).

**Anti-pattern warning:** Do not use `"domains": "all"` — RESEARCH.md Common Pitfalls/Security Domain explicitly flags this as scope creep; the single-domain array is the historically-correct and security-reviewed value.

---

### `src/__tests__/updateChecker.test.ts` (test, request-response / mocked network)

**Analog A — Node built-in module require + describe/it shape:** `src/__tests__/checksums.test.ts` (lines 1-52)
```typescript
/* eslint-disable @typescript-eslint/no-var-requires */
import * as fs from 'fs';
// ... (checksums.test.ts imports Node built-ins directly, requires the module under test via require())

describe('release/checksums.js (INTEG-02, D-05/D-06)', () => {
  it('formatChecksumLine joins digest and filename with exactly two spaces', () => {
    // ... direct assertions, no mocking framework needed for pure functions
  });
});
```
This project's test-naming convention — `describe('<subject> (<REQ-IDs>)', ...)` — should carry over: e.g. `describe('checkForUpdates (UPD-01, UPD-03)', ...)`.

**Analog B — fake-timer/mount-effect describe shape (for the async-resolution pattern, not timers themselves):** `src/__tests__/documentWatcher.test.ts` (lines 19-49) — shows this project's `beforeEach`/`afterEach` setup/teardown discipline for stateful mocks; mirror this for `global.fetch` mock reset (RESEARCH.md Pitfall 4 — no existing fetch-mock precedent in repo, so this is genuinely new ground, but the `beforeEach`/`afterEach` scaffolding style should still match):
```typescript
describe('startDocumentWatcher', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  // ...
});
```
Adapt directly to:
```typescript
describe('checkForUpdates (UPD-01, UPD-03)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  // tests per RESEARCH.md Code Examples section (already-drafted skeleton)
});
```

**Full skeleton to start from** — already drafted in `04-RESEARCH.md` under "Code Examples > `updateChecker.ts` test skeleton" — use verbatim as the starting point, do not re-derive.

---

### `src/__tests__/manifest-permissions.test.ts` (test, static/config check)

**Analog:** `src/__tests__/macos-installer-retirement.test.ts` (full file, 17 lines) — static-assertion-on-repo-file pattern
```typescript
import * as fs from 'fs';
import * as path from 'path';

describe('macOS uninstaller retirement (Phase 3, D-01/D-11)', () => {
  const scriptsDir = path.resolve(__dirname, '../../scripts');
  const retiredFiles = ['build-mac-uninstaller.js', 'pkg-resources/uninstall-preinstall'];

  it.each(retiredFiles)('%s should not exist (retired per D-01)', (file) => {
    expect(fs.existsSync(path.join(scriptsDir, file))).toBe(false);
  });

  it('scripts/package.js should not reference the legacy mac-uninstaller build script', () => {
    const packageJs = fs.readFileSync(path.join(scriptsDir, 'package.js'), 'utf8');
    expect(packageJs).not.toContain('build-mac-uninstaller.js');
  });
});
```
Adapt to read and `JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../manifest.json'), 'utf8'))`, then assert `parsed.requiredPermissions.network.domains` deep-equals exactly `['https://api.github.com']` — this is the regression guard RESEARCH.md's Wave 0 gaps calls for (prevents accidental broadening to `"all"`).

---

### `src/__tests__/App.updateBanner.test.tsx` (test, event-driven/mount wiring) and `src/__tests__/UpdateBanner.test.tsx` (test, render/interaction)

**No close analog exists in this repo** — there is no existing React Testing Library / component-render test file under `src/__tests__/` (all existing tests target pure functions, Node scripts, or hooks tested via direct function calls, not rendered components). `documentWatcher.test.ts` and `checksums.test.ts` are the closest in spirit (mount/lifecycle testing, mock-based) but do not render JSX.

**Recommendation for planner:** Since no in-repo React component test precedent exists, these two test files should follow standard React Testing Library conventions (if introduced) or, to stay dependency-zero (per this project's "no new libraries" stance in RESEARCH.md), use a minimal manual render approach consistent with existing UXP-safe patterns (`UpdateBanner.tsx` already guards `require('uxp')` calls in try/catch for non-UXP/test environments — lines 44-49 — so a test can safely call `openRelease` without a real UXP host). Check whether `@testing-library/react` is already a devDependency before assuming it needs adding; if not present, this is a new-dependency decision that should be flagged back to research/context rather than silently introduced.

## Shared Patterns

### Silent-null async error handling (already established — do not deviate)
**Source:** `src/services/updateChecker.ts` lines 45-70 (`checkForUpdates()`'s try/catch → `console.error('[GMG] ...')` → `return null`)
**Apply to:** Any new wiring code in `App.tsx` that calls `checkForUpdates()` — must not add a second layer of try/catch or error surfacing; the function's contract is already "never throws."

### `[GMG]`-prefixed console.error logging
**Source:** `src/services/updateChecker.ts` line 67: `console.error('[GMG] checkForUpdates failed:', err);` and `src/hooks/useDocument.ts` line 64: `console.error('[GMG] useDocument refresh failed:', err);`
**Apply to:** Any new error-path logging introduced in this phase's wiring (should not be needed net-new, since `checkForUpdates()` already logs internally — flag if a planner finds themselves adding a second log call for the same failure).

### Zustand flat-field + single-setter store shape
**Source:** `src/store/uiStore.ts` full file (see Pattern Assignments above)
**Apply to:** New `updateInfo`/`setUpdateInfo`/`dismissUpdate` fields in `uiStore.ts` — no shallow-merge setter needed (unlike `gridStore.ts`'s `setColumns`/`setRows`/`setMargins` partial-merge pattern), since `UpdateInfo` is always replaced wholesale, matching `setError`'s existing shape (`setError: (message) => set({ lastError: message })`).

### File-level path comment + no path aliases
**Source:** Every existing `src/` file (e.g. `// src/App.tsx`, `// src/store/uiStore.ts`, `// src/services/updateChecker.ts`)
**Apply to:** All new/modified files in this phase — first line must be `// <relative/path/from/repo/root>`; imports must stay relative (`./services/updateChecker`, not `@/services/updateChecker` — no path alias configured in this project's `tsconfig.json`).

### `describe('<subject> (<REQ-IDs>)', ...)` test naming
**Source:** `src/__tests__/checksums.test.ts` line 9: `describe('release/checksums.js (INTEG-02, D-05/D-06)', ...)`; `src/__tests__/macos-installer-retirement.test.ts` line 4: `describe('macOS uninstaller retirement (Phase 3, D-01/D-11)', ...)`
**Apply to:** All new test files this phase — tie describe blocks to this phase's requirement IDs (UPD-01, UPD-02, UPD-03, DIST-01) for traceability, matching established convention.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/__tests__/UpdateBanner.test.tsx` | test | render/interaction | No existing rendered-component test in this repo; no React Testing Library precedent to copy. Planner should verify whether a component-testing library is already a devDependency before drafting this test, and treat its absence as a decision point, not an assumption. |
| `.planning/phases/04.../gumroad-page-copy.md` | deliverable doc | — | Not code — a prose deliverable for the user's manual Gumroad setup (D-06). No codebase analog applies; follow this phase's own CONTEXT.md/RESEARCH.md plain-language communication style instead (see CONTEXT.md "User Guidance Note"). |

## Metadata

**Analog search scope:** `src/`, `src/__tests__/`, `src/hooks/`, `src/store/`, `src/types/`, `src/services/`, `src/components/shared/`, `release/`, repo root (`manifest.json`, `package.json`)
**Files scanned:** `useDocument.ts`, `uiStore.ts`, `store.types.ts`, `App.tsx`, `updateChecker.ts`, `UpdateBanner.tsx`, `manifest.json`, `checksums.test.ts`, `documentWatcher.test.ts`, `macos-installer-retirement.test.ts`
**Pattern extraction date:** 2026-07-07
