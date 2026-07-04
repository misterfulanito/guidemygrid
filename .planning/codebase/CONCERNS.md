# Codebase Concerns

**Analysis Date:** 2026-07-04

## Tech Debt

**Dead Code Components:**
- Issue: `UpdateBanner` component (`src/components/shared/UpdateBanner.tsx`) is exported but never imported or used anywhere in the codebase
- Files: `src/components/shared/UpdateBanner.tsx`
- Impact: Adds bundle size; misleads future developers into thinking update feature is active
- Fix approach: Either integrate the update check feature end-to-end, or remove the unused component and checkForUpdates service

**Orphaned Service Function:**
- Issue: `checkForUpdates()` function in `src/services/updateChecker.ts` is never called anywhere
- Files: `src/services/updateChecker.ts`
- Impact: Despite network permissions being properly restricted in `manifest.json`, the feature is incomplete. Users never see update notifications
- Fix approach: Wire up the service in App.tsx or create a hook that calls it on mount and manages the update banner state

**Unused Type Schema:**
- Issue: `src/types/grid.types.ts` defines complex interfaces (`ColumnConfig`, `RowConfig`, `GridConfig`) and DEFAULT constants that are never used
- Files: `src/types/grid.types.ts` (lines 8-88)
- Impact: Creates confusion about the actual data model. The real stores use simpler string-based state in `store.types.ts`
- Fix approach: Delete the unused types, or refactor the stores to use the more structured schema if the richer model is intended

**Unused Type Exports:**
- Issue: `DocumentContext` interface in `src/types/photoshop.types.ts` is defined but never imported
- Files: `src/types/photoshop.types.ts` (line 28-32)
- Impact: Clutters the type file with unused definitions
- Fix approach: Remove or add to a "planned" types file if intended for future expansion

## Test Coverage Gaps

**Critical Components Untested:**
- Issue: Only 1 test file exists (`src/__tests__/gridGenerator.sideGuide.test.ts` with 14 tests)
- What's tested: `generateSideGuide` function only
- What's NOT tested:
  - `GridPanel` component (424 lines) — core UI, no unit tests
  - `SideGuidesBar` component (200 lines) — interactive buttons, no coverage
  - `generateColumnGuides` / `generateRowGuides` / `generateMarginGuides` functions — math-critical, zero tests
  - `PhotoshopBridge` service (213 lines) — batchPlay execution, no tests
  - `useDocument` hook (67 lines) — event handling and debounce, untested
  - `gridStore` and `uiStore` — state management, no tests
  - `UpdateChecker` service — validation and error handling, untested
- Files: `src/__tests__/` (only 1 file)
- Risk: High — Any change to core grid math or component logic could break silently. Photoshop API calls are not validated before production
- Priority: **HIGH** — These are customer-facing features
- Fix approach: 
  - Add unit tests for all `gridGenerator` functions with edge cases (zero width, extreme gutters, floating-point precision)
  - Mock PhotoshopBridge and test GridPanel interactions
  - Add hook tests for useDocument event listener cleanup
  - Test store mutations

**No End-to-End Tests:**
- Issue: No integration tests verifying the plugin actually works in Photoshop or with a real UXP environment
- Impact: Bugs in Photoshop API calls only discovered during manual testing or in production
- Fix approach: Add integration tests using UXP testing tools if available, or document manual testing procedure

## Fragile Areas

**GridPanel Component Size & Complexity:**
- Files: `src/components/ColumnGrid/GridPanel.tsx`
- Why fragile: 424 lines in a single component with complex state derivation (lines 130-181), calculations, event handlers, and JSX rendering mixed together
- Safe modification: Extract numerical parsing logic into a custom hook (e.g., `useGridCalculations`), extract icon definitions into a separate file, break into smaller sub-components
- Test coverage: Zero; any change risks breaking calculations or UI state

**Floating-Point Rounding:**
- Files: `src/components/ColumnGrid/GridPanel.tsx` (lines 103, 166, 180), `src/services/gridGenerator.ts` (lines 22-27, 64-65, 97-98, 123-126)
- Issue: Uses `Math.round(n * 100) / 100` throughout for pixel positioning. While pragmatic, this can accumulate precision loss in edge cases (e.g., very large containers with small gutters, or cascading calculations)
- Cause: JavaScript number precision; IEEE 754 floating-point representation
- Improvement path: Document precision limits in comments, add unit tests with extreme values, consider using a decimal library if precision becomes critical

**Photoshop API Error Handling:**
- Files: `src/services/photoshopBridge.ts`
- Issue: `clearAllGuides()` (lines 69-82) catches and silently ignores errors by checking for `result?.[0]?._obj === 'error'`. Other methods like `applyGuides` (lines 169-210) try-catch and ignore errors
- Cause: Photoshop batchPlay can error in unexpected ways; fallback behavior is to silently continue
- Safe modification: Add more specific error checks, log what error descriptor was returned, provide meaningful feedback to user via UI store
- Test coverage: None; untested error paths

**Global State Singletons:**
- Files: `src/store/gridStore.ts`, `src/store/uiStore.ts`
- Issue: Zustand stores are module-level singletons created with `create()`. If state ever needs to be reset (e.g., new document opened), the stores aren't explicitly cleared
- Cause: Stores are created at module load time, not instance level
- Safe modification: Add explicit reset functions to each store; call on document open/close; or refactor to instance-based state if multi-document support is needed
- Test coverage: None; state mutations untested

**Debounce Timer Cleanup:**
- Files: `src/hooks/useDocument.ts` (lines 19, 54-56, 61)
- Issue: Debounce timer ref is manually managed with `clearTimeout`. If the component unmounts during a debounce interval, the async `refresh()` call might still fire and try to setState on unmounted component
- Cause: useCallback and useEffect dependencies require manual timer management
- Safe modification: Refactor to use a debounce utility (e.g., lodash debounce) or ensure refresh is protected with a mounted check
- Test coverage: None

## Performance Bottlenecks

**Network Call on Every App Init:**
- Issue: `checkForUpdates()` will perform a GitHub API call on every plugin panel open if wired up (currently unused)
- Files: `src/services/updateChecker.ts` (lines 45-70)
- Current impact: None (function is never called)
- Potential impact: Network request overhead, latency on Photoshop panel load if implemented
- Improvement path: 
  - Implement caching with a time-based check (e.g., check once per day)
  - Use a background check or defer the call to after UI renders
  - Consider implementing via a background worker or service worker if available in UXP

## Security Considerations

**API Response Validation (Recent Fix):**
- Risk: ✅ **MITIGATED** — GitHub API response is validated before use (`src/services/updateChecker.ts` lines 21-41)
- Current state: `validateRelease()` checks shape, types, URL domain, and semver format
- Recommendation: Document why `isSafeUrl()` checks `startsWith(ALLOWED_URL)` and mention that asset URLs are also validated

**Network Permissions (Correctly Configured):**
- Risk: ✅ **MITIGATED** — `manifest.json` restricts network to `https://api.github.com` only
- Current state: restrictive configuration in place
- Recommendation: Keep this restrictive; if other network calls are added, update manifest explicitly

**Hardcoded Strings:**
- Issue: `GITHUB_REPO = 'misterfulanito/guidemygrid'`, `ALLOWED_URL`, `SEMVER_RE` are all in `updateChecker.ts`
- Impact: Low — these are not secrets, but hardcoded for maintainability
- Recommendation: No action needed; consider moving to a config file if repo URL changes frequently

## Dependencies at Risk

**Direct Dependencies (All Current):**
- `react@^18.2.0` — Stable; widely used; no known vulnerabilities
- `react-dom@^18.2.0` — Tied to React version; stable
- `zustand@^4.4.0` — Small, stable library; no known vulnerabilities
- `lucide-react@^0.577.0` — Icon library; actively maintained; minor point release; safe

**DevDependencies (Build/Test Only):**
- TypeScript 5.x, Webpack 5.x, Jest 29.x — Standard toolchain; all actively maintained
- ESLint + @typescript-eslint — Linting infrastructure; stable

**No Vulnerability Detected:**
- Run `npm audit` to verify at build time; none flagged
- Recommendation: Integrate dependabot or npm audit into CI/CD pipeline

**UXP Runtime Dependencies (Not in package.json):**
- `photoshop` module — Provided by UXP host; pinned to apiVersion 2 in `manifest.json` (line 11)
- Risk: If Photoshop releases apiVersion 3+ with breaking changes, code must be updated
- Fix approach: Plan for forward compatibility; document minimum Photoshop version (22.0.0 in manifest, line 10)

## Missing Critical Features

**Update Notification Feature Incomplete:**
- Problem: Update banner component and check function exist but are disconnected
- Blocks: Users cannot be notified of new versions in-app
- Fix approach: Wire up `checkForUpdates()` in App.tsx useEffect, manage update info in uiStore, render UpdateBanner conditionally

**No Persistent State:**
- Problem: Grid settings and margins are stored only in Zustand store (memory). If Photoshop crashes or plugin panel is closed, settings are lost
- Blocks: Power users cannot save/load preset configurations
- Impact: Low for MVP, but users expect "remember my last settings"
- Fix approach: Add localStorage backup or implement a presets system (was planned in grid.types.ts but never implemented)

## Known Bugs

**None Explicitly Documented:**
- No TODO/FIXME/HACK comments in source code (checked with grep)
- All recent commits mention fixes (flex gap, colors, error logging)
- Assumption: Current version is stable relative to latest commit

**Potential Issues (Not Yet Reported):**
- None identified from code inspection; testing required to confirm stability

## Scaling Limits

**Single Document/Selection Assumption:**
- Current: Plugin works on "active document" only; switches when document changes
- Limit: No support for working with multiple documents in parallel
- Impact: Acceptable for Photoshop plugin use case (single active document at a time)
- Scaling path: Would need to refactor state management if multi-document support is required

**Guide Limit:**
- Current: No explicit limit on number of guides that can be applied (lines 206-208 in photoshopBridge.ts)
- Limit: Photoshop may have internal limits (e.g., max 500 guides per document)
- Impact: Unknown; untested with extreme grid values
- Improvement path: Test with large column/row counts and document any limits

## Anti-Patterns

### Inline Styles Mixed with CSS Modules

**What happens:** `UpdateBanner.tsx` uses React inline styles (`bannerStyle`, `linkStyle`, `dismissStyle`) while other components use CSS modules
**Why it's wrong:** Inconsistent styling approach makes it harder to refactor styles later, limits CSS preprocessor features, makes dark mode/theme switching harder
**Do this instead:** Move all inline styles to `UpdateBanner.module.css` to match the pattern used in `GridPanel.module.css` and `SideGuidesBar.module.css`

### Type Casting for DOM Access

**What happens:** `(e.target as HTMLInputElement)` cast in GridPanel line 310, `(e.target as HTMLInputElement).blur()` in NumInput line 119
**Why it's wrong:** Bypasses TypeScript type safety; assumes input always exists and is correct type
**Do this instead:** Define the input element as a ref and access directly, or use `<input onChange={(e: React.ChangeEvent<HTMLInputElement>) =>` to preserve type safety

### Silent Error Fallback in updateChecker

**What happens:** `checkForUpdates()` returns `null` on any error and logs to console.error; caller has no way to distinguish "no update available" from "network error"
**Why it's wrong:** Makes debugging difficult; hides user-facing errors silently
**Do this instead:** Return `{ hasUpdate: false, latestVersion: null, error: string }` or throw typed errors that the UI can render

## Code Quality Observations

**Positive Patterns:**
- ✅ Type-safe stores with clear interfaces
- ✅ Separation of concerns (services, stores, components, hooks)
- ✅ Error classes with custom names (`GridGenerationError`)
- ✅ Guard clauses and early returns for validation
- ✅ Debouncing to prevent event floods (useDocument hook)

**Areas for Improvement:**
- ⚠️ More comprehensive test coverage (see Test Coverage Gaps)
- ⚠️ Extract large components into smaller, testable units
- ⚠️ Document numerical precision limits
- ⚠️ Integrate unused features (UpdateBanner, checkForUpdates) or remove

---

*Concerns audit: 2026-07-04*
