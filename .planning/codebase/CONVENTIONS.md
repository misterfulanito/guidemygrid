# Coding Conventions

**Analysis Date:** 2026-07-04

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `GridPanel.tsx`, `App.tsx`)
- Services/utilities: camelCase with `.ts` extension (e.g., `gridGenerator.ts`, `photoshopBridge.ts`, `updateChecker.ts`)
- Type definition files: `<domain>.types.ts` pattern (e.g., `grid.types.ts`, `preset.types.ts`)
- Hooks: camelCase with `.ts` extension (e.g., `useDocument.ts`)
- Stores: camelCase with `.ts` extension (e.g., `gridStore.ts`, `uiStore.ts`)
- Barrel export files: `index.ts` for re-exporting from directories

**Functions:**
- camelCase for all function names (exported and internal)
- Examples: `generateColumnGuides()`, `parseMargin()`, `handleAdd()`, `commit()`
- Descriptive names reflecting purpose: `isSafeUrl()`, `validateRelease()`, `parseFloat()`
- Event handlers prefixed with `handle`: `handleAdd()`, `handleMarginChange()`, `handleClear()`

**Variables:**
- camelCase for all variables: `containerWidth`, `columnWidth`, `gutterNum`, `hasCount`
- Boolean variables use descriptive prefixes: `hasUpdate`, `hasSelection`, `isApplying`, `marginsLocked`
- Local state variables use single letter for simple counters: `i` for loop iteration

**Types:**
- PascalCase for interfaces, types, and type aliases (e.g., `WidthMode`, `DocumentInfo`, `GridConfig`)
- Type definitions with inline comments explaining constraints:
  ```typescript
  export interface ColumnConfig {
    columns: number;          // 1–24
    columnWidth: WidthMode;   // 'auto' or fixed value
    columnWidthValue: number; // px, used only if columnWidth === 'fixed'
  }
  ```

**Constants:**
- SCREAMING_SNAKE_CASE for module-level constants: `GITHUB_REPO`, `SEMVER_RE`, `ALLOWED_URL`, `DEBOUNCE_MS`
- Default constants exported with PascalCase type names: `DEFAULT_COLUMN_CONFIG`, `DEFAULT_GRID_CONFIG`

## Code Style

**Formatting:**
- No explicit Prettier config — uses default settings
- TabWidth/indentation: 2 spaces (inferred from codebase)
- Semicolons: Not consistently enforced (varies by eslint setup)

**Linting:**
- ESLint with TypeScript support
- `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`
- Config command: `npm run lint` runs `eslint src --ext .ts,.tsx`
- ESLint disable comments used when necessary: `/* eslint-disable @typescript-eslint/no-var-requires */`

**TypeScript Strictness:**
- `strict: true` in `tsconfig.json`
- Target: `ES2020`
- Module: `commonjs`
- Lib: `ES2020, DOM`
- JSX: `react-jsx`
- No implicit any and strict null checks enforced

## Import Organization

**Order:**
1. React/external library imports (e.g., `import React, { useEffect } from 'react'`)
2. Internal module imports (stores, hooks, services, types)
3. CSS module imports (e.g., `import styles from './GridPanel.module.css'`)

**Examples:**
```typescript
// src/components/ColumnGrid/GridPanel.tsx
import React, { useEffect, useState } from 'react';
import { useGridStore, useUIStore } from '../../store';
import { useDocument } from '../../hooks/useDocument';
import { photoshopBridge } from '../../services/photoshopBridge';
import { generateColumnGuides, GridGenerationError } from '../../services/gridGenerator';
import styles from './GridPanel.module.css';
```

**Path Style:**
- Relative imports only (no path aliases configured)
- Use `../../` for parent directory traversal

**Barrel Exports:**
- Used in `src/store/index.ts` and `src/types/index.ts` for re-exporting
- Pattern: `export { useGridStore } from './gridStore'`

## Error Handling

**Custom Error Classes:**
- Extend `Error` class and set `this.name` property
- Example from `gridGenerator.ts`:
  ```typescript
  export class GridGenerationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'GridGenerationError';
    }
  }
  ```

**Guard Clauses:**
- Use early `throw` or `return` to fail fast
- Type narrowing via `typeof` checks:
  ```typescript
  if (!data || typeof data !== 'object') throw new Error('Invalid response shape');
  ```

**Type Guards:**
- Define custom type guard functions with `is` keyword:
  ```typescript
  function isSafeUrl(url: unknown): url is string {
    return typeof url === 'string' && url.startsWith(ALLOWED_URL);
  }
  ```

**Validation Pattern:**
- Validator functions throw on invalid input
- Callers handle via try/catch
- From `updateChecker.ts`:
  ```typescript
  function validateRelease(data: unknown): ReleaseType {
    if (!data || typeof data !== 'object') throw new Error('Invalid response shape');
    // ... multiple guard clauses
    return r as ReturnType<typeof validateRelease>;
  }
  ```

**Return Values:**
- Functions returning optional values use `T | null` (not `undefined`)
- Example: `async getActiveDocument(): Promise<DocumentInfo | null>`
- Empty results return `null` for "not found" scenarios
- Empty arrays return `[]` for collections with no items

**Silent Failures:**
- Network operations catch errors and return `null` (never throw)
- Example from `updateChecker.ts`:
  ```typescript
  } catch (err) {
    console.error('[GMG] checkForUpdates failed:', err);
    return null; // Silent failure — never block the UI on network issues
  }
  ```

**Error Messages:**
- Descriptive messages for validation failures
- Include relevant values when helpful:
  ```typescript
  throw new GridGenerationError(`Gutter too large: column width would be ${Math.round(columnWidth)}px`);
  ```

## Logging

**Framework:** `console.error()` — no structured logging library

**Prefix Convention:**
- All error logs prefixed with `[GMG]` (plugin initials)
- Pattern: `console.error('[GMG] context:', err)`
- From `useDocument.ts`:
  ```typescript
  console.error('[GMG] useDocument refresh failed:', err);
  ```

**When to Log:**
- Errors in async operations (network, Photoshop API)
- Fallback scenarios (e.g., older PS version compatibility)
- Never log success paths

## Comments

**File-Level Comments:**
- All files start with path comment: `// src/services/gridGenerator.ts`
- Helps identify module location at a glance

**Section Dividers:**
- Use ASCII divider format: `// ── Section Name ─────────────────────`
- Examples from codebase:
  - `// ── Schema validation ─────────────────────────────────────`
  - `// ── Public API ───────────────────────────────────────────`
  - `// ── Link icons (16px inside 24px button, two-color fill) ────`

**Inline Comments:**
- Explain non-obvious logic or edge cases
- From `photoshopBridge.ts`:
  ```typescript
  // Property may not be readable on older PS versions — fall back to true.
  console.error('[GMG] getGuidesVisible fallback:', err);
  ```
- Explain why a catch is empty:
  ```typescript
  } catch {
    // Expected when the document has no existing guides — safe to ignore.
  }
  ```

**Interface Field Comments:**
- Inline comments on type definitions explaining units and constraints
- From `grid.types.ts`:
  ```typescript
  columnWidth: WidthMode;   // 'auto' or fixed value
  columnWidthValue: number; // px, used only if columnWidth === 'fixed'
  ```

**JSDoc Comments:**
- Used selectively on exported public functions
- Only on significant/complex functions, not all exports
- Example from `gridGenerator.ts`:
  ```typescript
  /**
   * Generate position for a single side guide (edge or center of container).
   * Returns absolute pixel position + orientation.
   */
  export function generateSideGuide(...): { ... }
  ```

**JSX Comments:**
- Section markers in JSX using HTML comment syntax: `{/* ── Section name ── */}`
- From `App.tsx`:
  ```jsx
  {/* ── Tab bar ── */}
  <div className={styles.tabBar}> ... </div>
  
  {/* ── No-document notice ── */}
  {!document && <div>...</div>}
  ```

## Function Design

**Parameters:**
- Named parameters with full type annotations
- Destructure when receiving objects:
  ```typescript
  function generateColumnGuides(params: {
    columns: number;
    gutter: number;
    containerWidth: number;
    offsetX: number;
  }): number[]
  ```

**Return Types:**
- Always specify return type (no implicit `any`)
- Use `Promise<T | null>` for async operations with optional results
- Use `void` for side-effect-only functions
- Use `boolean` for validation/check functions

**Async/Await:**
- Use async/await consistently (no `.then()` chains)
- Always wrap async operations in try/catch in component handlers
- Example from `GridPanel.tsx`:
  ```typescript
  const handleAdd = async () => {
    if (addDisabled) return;
    setApplying(true);
    setError(null);
    try {
      // ... async operations
      await photoshopBridge.applyGuides({ vertical, horizontal }, 'replace');
    } catch (err) {
      setError(err instanceof GridGenerationError ? err.message : 'Error applying guides');
    } finally {
      setApplying(false);
    }
  };
  ```

**Pure Functions:**
- Return plain objects, not class instances
- No mutations of parameters
- Examples: `generateColumnGuides()`, `generateRowGuides()`

## Module Design

**Exports:**
- Named exports for components, utilities, and services:
  ```typescript
  export function GridPanel() { ... }
  export class GridGenerationError extends Error { ... }
  export function generateColumnGuides(...) { ... }
  ```
- Default exports for config files and Zustand stores:
  ```typescript
  export default defineWebpackConfig(...);
  ```

**Classes:**
- Used for stateful services (e.g., `PhotoshopBridge`)
- Instantiated as singletons:
  ```typescript
  const photoshopBridge = new PhotoshopBridge();
  export { photoshopBridge };
  ```
- Private methods use `private` keyword for encapsulation

**Barrel Files:**
- `index.ts` used to re-export from modules:
  ```typescript
  // src/store/index.ts
  export { useGridStore } from './gridStore';
  export { useUIStore } from './uiStore';
  ```
- Allows cleaner imports: `import { useGridStore } from '../../store'`

## React/Component Patterns

**Component Definition:**
- PascalCase function components with explicit return type:
  ```typescript
  export function GridPanel() {
    const { columns, setColumns } = useGridStore();
    // ...
    return ( ... );
  }
  ```

**Hooks Usage:**
- Custom hooks return TypeScript interfaces defining return shape:
  ```typescript
  interface UseDocumentResult {
    document: DocumentInfo | null;
    selection: SelectionBounds | null;
    loading: boolean;
    refresh: () => void;
  }
  
  export function useDocument(): UseDocumentResult {
    // ...
    return { document, selection, loading, refresh };
  }
  ```

**Props Pattern:**
- Destructure props in function signature
- Define interfaces for prop types:
  ```typescript
  interface NumInputProps {
    placeholder: string;
    value: string;
    disabled?: boolean;
    onChange?: (v: string) => void;
  }
  
  function NumInput({ placeholder, value, disabled, onChange }: NumInputProps) {
    // ...
  }
  ```

**Conditional Rendering:**
- Ternary operators for simple conditions
- Logical && for single-branch conditions
- Example:
  ```typescript
  const widthDisplay = !isNaN(computedWidthPx) && computedWidthPx > 0
    ? String(Math.round(computedWidthPx * 100) / 100)
    : '';
  ```

**CSS Module Classes:**
- Template strings for conditional classes:
  ```typescript
  className={`${styles.input} ${disabled ? styles.inputDisabled : ''}`}
  className={`${styles.eyeBtn} ${!guidesVisible ? styles.eyeBtnOff : ''}`}
  ```
- Never use `clsx` or `classnames` (not imported)

**Optional Chaining & Nullish Coalescing:**
- Use `?.` for safe property access:
  ```typescript
  const sel = result?.[0]?.selection;
  const currentlyVisible = stateResult[0]?.result?.checked ?? false;
  ```

## State Management (Zustand)

**Store Pattern:**
- Create stores with `create<Type>((set) => ({ ... }))`
- Example from `gridStore.ts`:
  ```typescript
  export const useGridStore = create<GridStore>((set) => ({
    columns: { count: '', gutter: '' },
    setColumns: (partial) =>
      set((state) => ({ columns: { ...state.columns, ...partial } })),
  }));
  ```

**Setter Functions:**
- Use shallow merge pattern: `set((state) => ({ key: { ...state.key, ...partial } }))`
- Allows partial updates without replacing entire object

## Type Definitions

**Union Types:**
- Used for limited allowed values:
  ```typescript
  export type WidthMode = 'auto' | 'fixed';
  export type ApplyMode = 'replace' | 'add';
  export type SideGuideType = 'left' | 'center-v' | 'right' | 'top' | 'center-h' | 'bottom';
  ```

**Interfaces vs Types:**
- Interfaces for object shapes (especially for component props and store types)
- Types for unions and simple aliases

**Default Constants:**
- Exported as constants matching interface names:
  ```typescript
  export const DEFAULT_COLUMN_CONFIG: ColumnConfig = { ... };
  ```

---

*Convention analysis: 2026-07-04*
