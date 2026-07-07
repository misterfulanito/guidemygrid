# Phase 4: Release Automation & Distribution - Research

**Researched:** 2026-07-07
**Domain:** UXP plugin permission model (Adobe/Creative Cloud Desktop) + Gumroad external-link product delivery + wiring already-built React/Zustand code
**Confidence:** HIGH (the two open technical questions are now resolved with direct evidence; the wiring work itself is LOW-risk since the code already exists)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Network Permission Tradeoff (UPD-03 — the central decision this phase)**
- **D-01:** Reconnecting `checkForUpdates()` requires `manifest.json` to declare `requiredPermissions.network` again. Phase 1 empirically confirmed (A/B test) that declaring this permission reintroduces Creative Cloud Desktop's admin-password prompt on install/update for this non-Marketplace plugin — directly working against this milestone's core value ("no admin/root access ever").
- **D-02 (directional, not fully confirmed — timed out on first ask, proceeded with recommended default):** Try to find a way to make the update check work **without** reintroducing the password prompt first. Research/planning should investigate whether this is actually possible before assuming it's a dead end. **[Research verdict: dead end — see Summary above. D-02 is now resolved, do not re-open.]**
- **D-03 (confirmed fallback):** If research proves there is no way around it, the user wants to **accept the password prompt** and ship a fully working, automatic update checker rather than stay password-free with no in-app notification. This fallback is locked in — do not re-ask, just report which path research landed on. **[Research verdict: D-03 is the path — confirmed.]**
- **D-04 (confirmed):** Update checks should fire automatically every time the plugin panel is opened — not a manual "check for updates" button, not a 24-hour throttle. Simplicity over API-call minimization; GitHub's public rate limit (60 req/hr unauthenticated) is not a real constraint at this plugin's scale.

**Gumroad ↔ GitHub Sync (DIST-02, DIST-03)**
- **D-05 (tentative — timed out, proceeded with recommended default):** Point the Gumroad listing's download link at GitHub's "latest release" redirect URL (`github.com/misterfulanito/guidemygrid/releases/latest`) rather than a specific versioned file. Verify during planning/research that Gumroad's product-page link field actually accepts an external redirect URL like this. **[Research verdict: feasible via Gumroad's "Redirect to a URL after purchase" Content-tab option — see Summary above.]**
- Scripted Gumroad API sync was explicitly offered as a third option but not chosen — the "latest release" redirect approach makes scripting unnecessary in the first place (no per-release update needed at all).

**Gumroad Page Setup & Ownership (DIST-02)**
- **D-06 (tentative — timed out, proceeded with recommended default):** The user creates and owns the actual Gumroad listing (account, page, screenshots, price = $0) — same division of labor as Phase 1's Adobe Developer Distribution portal registration. Claude's job is to draft the page copy/description/feature list and give the user clear, plain-language, step-by-step instructions for pasting it into Gumroad's page builder and wiring up the "latest release" link (D-05).

**User Guidance Note**
- The user explicitly said this is their first time setting up something like this (Gumroad distribution + release automation) and asked to be guided through it — carry the same "concrete consequences over technical jargon" communication style used successfully in Phases 1–3 into this phase's planning and execution communications too.

### Claude's Discretion
- Exact wording/structure of the Gumroad page copy Claude drafts for D-06.
- Whether the "every panel open" update check (D-04) needs any client-side debounce to avoid redundant calls if the user rapidly closes/reopens the panel — implementation detail, not a vision decision.
- Where exactly in `App.tsx`/hooks the `checkForUpdates()` wiring lives (matches `CONCERNS.md`'s suggested fix approach: `App.tsx` `useEffect` + `uiStore` state + conditional `UpdateBanner` render) — implementation detail.

### Deferred Ideas (OUT OF SCOPE)
- **Whether the network-permission-avoidance research (D-02) actually pans out** — not deferred scope, it's an open technical question this phase's research step must answer before planning locks in the manifest.json change. **[Now answered — see Summary.]** D-02/D-03 together describe a *sequence* (try avoidance first, fall back to accepting the prompt), not two independent options.
- **Gumroad email announcements for new releases** (DISTV2-01) — already correctly scoped to v2 in REQUIREMENTS.md, not re-litigated here.
- **Scripted Gumroad API sync** — considered and explicitly not chosen in favor of D-05's "latest release" redirect link; if Gumroad's link field turns out NOT to support external redirects, this becomes the fallback and should come back to the user as a real decision. **[Research indicates the redirect link IS supported — this fallback should not be needed, but the plan should still verify live during execution per Open Question 1.]**
- **`2026-07-06-build-ccx-zip-cli-not-cross-platform.md`** todo — reviewed, matched at score 0.6, not folded into this phase. Unrelated to this phase's actual scope (GitHub↔Gumroad sync, update checker reconnection). Left as a standalone pending todo.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| UPD-01 | Preserve the existing GitHub-API-only network allowlisting and response validation in the update checker — don't regress this | `validateRelease()`/`isSafeUrl()` in `updateChecker.ts` already implement this correctly; research confirms no changes needed to this logic, only new test coverage (Wave 0 gap) and preserving the exact domain scope when the manifest permission is restored |
| UPD-02 | Preserve the existing manual "update available → click → browser download" flow — don't regress this | `UpdateBanner.tsx`'s `shell.openExternal()` call already implements this; research confirms wiring it into `App.tsx` doesn't require touching this behavior |
| UPD-03 | Reconnect the update checker end-to-end so the manual update flow actually works, not just exists in source | Resolved: D-02 (permission avoidance) is a dead end per this project's own Phase 1 A/B test evidence; D-03 (accept the admin-password prompt) is the confirmed path. Manifest restoration snippet and `App.tsx` wiring pattern provided in Code Examples |
| DIST-01 | GitHub Releases remains the canonical file host and the update checker's source of truth | Already true in existing code (`updateChecker.ts` only ever calls `api.github.com`); no changes needed, covered by the same UPD-01 allowlist test |
| DIST-02 | Set up a free Gumroad listing as the distribution front-end / download page | Manual, user-owned step (D-06) — research provides the mechanism (Content tab → "Redirect to a URL after purchase") the user will need instructions for; Claude's deliverable is copy + step-by-step instructions, not code |
| DIST-03 | Gumroad listing links out to the current GitHub Release download rather than hosting a duplicate binary copy | Resolved: Gumroad's "Redirect to a URL after purchase" feature accepts external URLs including `github.com/.../releases/latest`, confirming D-05's plan is viable without scripting |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

Directives from `.claude/CLAUDE.md` and root `CLAUDE.md` relevant to this phase's work:

- **Error handling convention:** Async operations return `Promise<T | null>` (not `undefined`) for "no result"/failure; network operations catch errors and return `null` rather than throwing — `checkForUpdates()` already follows this, any new wiring code must preserve it.
- **Logging convention:** All error logs prefixed `[GMG]`, e.g. `console.error('[GMG] context:', err)`; never log success paths. Applies to any new error handling added during wiring.
- **Comments convention:** All files start with a path comment (`// src/App.tsx`); section dividers use `// ── Section Name ─────`.
- **Naming:** camelCase for functions/variables/hooks; PascalCase for components, interfaces, and type aliases; SCREAMING_SNAKE_CASE for module-level constants (matches `GITHUB_REPO`, `SEMVER_RE`, `ALLOWED_URL` already in `updateChecker.ts`).
- **No path aliases:** Relative imports only in `guidemygrid` — `import { checkForUpdates } from './services/updateChecker'`, not `@/services/updateChecker`.
- **State management:** Zustand stores use `create<Type>((set) => ({...}))` with shallow-merge setters (`set((state) => ({ key: { ...state.key, ...partial } }))` for partial updates) — any new `uiStore` fields for update state should follow this shape.
- **UXP threading constraint:** All Photoshop API calls must go through `photoshop.core.executeAsModal()` — not applicable to `checkForUpdates()` itself (pure network call, no Photoshop API), but relevant if any wiring code touches `photoshopBridge`.
- **No DOM globals:** UXP exposes no `window`/`document`/`localStorage` — `UpdateBanner.tsx` already correctly avoids these, using `require('uxp').shell.openExternal()` instead of a normal anchor/link.
- **Module-level singletons:** `photoshopBridge` and Zustand stores are global singletons — `uiStore`'s new update-info state is correctly scoped as global panel state, matching this pattern.
- **Release scripts:** `release/*.js` are zero-dependency, host-agnostic Node scripts (per `FOUND-02`) — any new release-automation code (if the Gumroad redirect approach turns out not to be viable, per Open Question 1) must match this style, not introduce a new npm dependency.
- **Testing:** `npm test` (Jest) must pass before committing, per root `CLAUDE.md`'s "Always run tests before committing" directive — directly reinforces closing the Wave 0 test-coverage gaps identified above.
- **GSD workflow enforcement:** Per `.claude/CLAUDE.md`, all file-changing work in this repo routes through a GSD command (`/gsd-execute-phase`, etc.) — this phase's plan should not be executed via direct ad-hoc edits.

## Summary

This phase is primarily an **integration and configuration** phase, not a new-library-adoption phase. Both `checkForUpdates()` (`src/services/updateChecker.ts`) and `<UpdateBanner>` (`src/components/shared/UpdateBanner.tsx`) are fully built, tested-by-hand-but-not-by-Jest, and simply never called. The work is: (1) resolve the network-permission tradeoff this project has been carrying since Phase 1, (2) wire the existing code into `App.tsx`/`uiStore`, (3) confirm Gumroad's redirect-link mechanism, and (4) document the manual Gumroad setup steps for the user.

**D-02 is resolved as a dead end — do not spend planning time on further avoidance research.** This project's own git history (`d07142d`, the Phase 1 A/B test commit) shows the manifest that triggered Creative Cloud Desktop's admin-password prompt already declared the **narrowest possible** permission scope: `requiredPermissions.network.domains: ["https://api.github.com"]` — not `"all"`. Scoping the domain list narrower is not an untried option; it was the exact configuration that produced the prompt. Cross-referencing this project's empirical finding against Adobe's own documentation confirms why: UXP grants consent for `network`/`localFileSystem`-class permissions **at install time** (not deferred to first use, unlike `openExternal`/`openPath`), and Creative Cloud Desktop's own install dialog explicitly ties its admin-password requirement to "the specific access level the plugin requires, such as Network or Local FileSystem" — the mere presence of a `requiredPermissions.network` block, regardless of scope, is the trigger. There is no UXP API that performs an HTTPS GET without a declared network permission; forum reports confirm `fetch()`/XHR throw "Plugin is not permitted to access the network apis" when the permission is undeclared. **D-03 (accept the prompt, ship full auto-checking) is therefore the confirmed path forward** — this should be reported to the user as a closed question, not reopened.

**D-05 is resolved as feasible.** Gumroad's product editor has a documented "Redirect to a URL after purchase" option on the product's Content tab (toggle off the beta content editor, select the redirect option, paste a URL). This accepts any external URL, including `github.com/misterfulanito/guidemygrid/releases/latest` (GitHub's own "always current" redirect). Customers are sent to that URL after checkout instead of Gumroad's own download page. This confirms D-05's "set once, never touch again" plan is viable — no Gumroad API scripting or `release/gumroad-sync.js` is needed.

**Primary recommendation:** Re-add `requiredPermissions.network.domains: ["https://api.github.com"]` to `manifest.json` (this exact block existed before, at commit `2ea272d`, and is a one-line revert), wire `checkForUpdates()`/`UpdateBanner` into `App.tsx` via a `useEffect` that fires on mount (matching `useDocument.ts`'s established hook pattern) with new `uiStore` state, write the currently-nonexistent Jest coverage for `updateChecker.ts`, and produce the Gumroad page copy + step-by-step instructions as a deliverable document (not code) since the user owns that manual step.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Update availability check (network call to `api.github.com`) | UXP Plugin Runtime (client) | — | `checkForUpdates()` runs entirely inside the panel's JS context; no server/backend exists in this project |
| Update banner UI (render/dismiss) | UXP Plugin Runtime (client) | — | `UpdateBanner.tsx` is a React component rendered inside the panel, identical tier to `GridPanel`/`DocumentHintBanner` |
| Update-state lifecycle (fetch-on-open, dismiss, latest-version tracking) | UXP Plugin Runtime (client) | — | Lives in `uiStore.ts` (Zustand), same tier as existing `guidesVisible`/`lastError` state |
| Manifest permission declaration | Build/Packaging (manifest.json → `.ccx`) | Distribution (CC Desktop install-time consent) | `requiredPermissions` is read by Creative Cloud Desktop's installer at install/update time, not by the running plugin |
| Release publishing (build, checksum, tag, GitHub Release) | Build/CI (dev-machine Node scripts) | Distribution (GitHub Releases API via `gh` CLI) | `release/*.js` scripts run on the developer's machine, never in the plugin runtime |
| GitHub Releases (canonical file host) | Storage/Distribution (external service) | — | Owned by GitHub, referenced by both the update checker and the Gumroad redirect |
| Gumroad listing (front-end/download page) | Storage/Distribution (external service) | — | Owned by Gumroad; this phase's code touches nothing here — it's a manual, user-owned setup step per D-06 |

## Standard Stack

No new libraries are required for this phase. This is a wiring + configuration phase using entirely existing, already-installed dependencies.

### Core (existing, reused)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.2.0 [VERIFIED: package.json] | Renders `UpdateBanner` conditionally in `App.tsx` | Already the project's UI framework |
| Zustand | 4.4.0 [VERIFIED: package.json] | Holds update-check state (`updateInfo`, dismissal) in `uiStore` | Already the project's state pattern (`gridStore`, `uiStore`) |
| Node.js built-in `fetch`/`crypto`/`fs` | Node 18+ runtime [VERIFIED: node --version → v26.4.0 on dev machine] | `updateChecker.ts` uses global `fetch`; `release/*.js` use built-in `crypto`/`fs` | Matches this project's established zero-dependency release-script pattern (`release/checksums.js`) |
| `gh` CLI | 2.92.0 [VERIFIED: gh --version on dev machine] | `release/github-release.js` shells out to `gh release create` | Already the project's release-publishing mechanism since Phase 1 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Jest / ts-jest | 29.0.0 [VERIFIED: package.json] | New unit tests for `updateChecker.ts` (currently zero coverage) | Required per this project's Validation Architecture / Nyquist gate |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual Gumroad "Redirect to a URL after purchase" | Scripted Gumroad API sync (`release/gumroad-sync.js`) | Explicitly rejected in CONTEXT.md D-05 — scripting is unnecessary once the redirect link makes per-release updates disappear entirely. Only revisit if Gumroad's redirect field is later found not to accept `releases/latest`-style URLs (untested end-to-end by a human at the time of this research; confirmed only via documentation) |
| Accepting the admin-password prompt (D-03) | Building an out-of-panel/background update checker to dodge manifest permissions | Not viable — background/persistent daemons are explicitly listed as Out of Scope anti-features in REQUIREMENTS.md, and would still need `requiredPermissions.network` themselves |

**Installation:** None — no `npm install` needed for this phase.

## Package Legitimacy Audit

Not applicable — this phase introduces zero new npm packages. All work uses already-installed dependencies (React, Zustand, Jest, Node built-ins) and the already-installed `gh` CLI.

## Architecture Patterns

### System Architecture Diagram

```text
┌─────────────────────────────── Photoshop Panel (UXP Runtime) ───────────────────────────────┐
│                                                                                                │
│   App.tsx mount (panel opened)                                                               │
│         │                                                                                     │
│         ▼                                                                                     │
│   useEffect(() => { checkForUpdates() }, [])   ◄── D-04: fires every panel open, no throttle │
│         │                                                                                     │
│         ▼                                                                                     │
│   fetch('https://api.github.com/repos/misterfulanito/guidemygrid/releases/latest')           │
│         │  (requires manifest.json requiredPermissions.network.domains: ["https://api.github.com"])
│         ▼                                                                                     │
│   validateRelease(json)  ──── domain allowlist + semver check (isSafeUrl, SEMVER_RE)         │
│         │                                                                                     │
│         ├── on failure/network error ──► return null ──► no UI change (silent, per convention)│
│         │                                                                                     │
│         ▼ on success                                                                          │
│   compareVersions(latest, PLUGIN_VERSION) > 0 ?                                              │
│         │                                                                                     │
│         ▼ yes                                                                                 │
│   uiStore.setUpdateInfo(info)  ──► App.tsx conditionally renders <UpdateBanner info={...} /> │
│         │                                                                                     │
│         ▼ user clicks "Download"                                                              │
│   uxp.shell.openExternal(info.downloadUrl)  ──► opens system browser (manual, non-silent)    │
│                                                                                                 │
└────────────────────────────────────────────────────────────────────────────────────────────┘
                                          ▲
                                          │  reads
                                          │
┌─────────────────────────── GitHub Releases (canonical file host — DIST-01) ─────────────────┐
│  api.github.com/repos/.../releases/latest  ← read by the panel's checkForUpdates()           │
│  github.com/.../releases/latest             ← redirect target, read by Gumroad's link (D-05) │
│  Populated by: release/version.js → release/checksums.js → release/github-release.js         │
│  (developer's machine, npm run publish:patch/minor/major)                                     │
└────────────────────────────────────────────────────────────────────────────────────────────┘
                                          ▲
                                          │  "Redirect to a URL after purchase" (Content tab)
                                          │
┌──────────────────────── Gumroad Product Page (front-end — DIST-02/03) ──────────────────────┐
│  Manual, user-owned setup (D-06). Free listing ($0 price). Claude drafts copy; user pastes.  │
│  Download link → github.com/misterfulanito/guidemygrid/releases/latest (never touched again) │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

No new files/folders are needed beyond what already exists. Changes land in:

```
manifest.json                              # + requiredPermissions.network block (D-01/D-03)
src/App.tsx                                # + useEffect wiring checkForUpdates()/UpdateBanner
src/store/uiStore.ts                       # + updateInfo state + setter
src/types/store.types.ts                   # + UpdateInfo field(s) on UIStore interface
src/__tests__/updateChecker.test.ts        # NEW — zero coverage today, Wave 0 gap
src/__tests__/App.updateBanner.test.tsx    # NEW (optional) — wiring/render test
.planning/phases/04.../gumroad-page-copy.md  # deliverable doc, not code — drafted for the user
```

### Pattern 1: useEffect-on-mount network check (matches `useDocument.ts`'s established shape)
**What:** Fire a side-effecting async call once when a component mounts, funnel the result into store state, never block render.
**When to use:** Any "sync external state into React on panel open" need — this project already has one precedent (`useDocument.ts`'s `refresh()` on mount).
**Example:**
```typescript
// Source: existing pattern in src/hooks/useDocument.ts, adapted for src/App.tsx
useEffect(() => {
  let cancelled = false;
  checkForUpdates().then((info) => {
    if (!cancelled && info?.hasUpdate) {
      setUpdateInfo(info);
    }
  });
  return () => { cancelled = true; };
}, []); // D-04: every mount = every panel open, no throttle, no manual button
```

### Pattern 2: Silent-null error convention (already established, do not deviate)
**What:** Async service functions return `T | null`; failures are logged via `console.error('[GMG] ...')` and swallowed, never thrown to the caller.
**When to use:** Already followed by `checkForUpdates()` itself — no new pattern needed, just confirm the wiring in `App.tsx` respects it (i.e., don't wrap the call in a try/catch that changes this contract).

### Anti-Patterns to Avoid
- **Throttling or caching the update check beyond "once per mount":** D-04 explicitly rejects a 24-hour throttle or manual "check now" button — GitHub's unauthenticated rate limit (60 req/hr) is not a real constraint at this plugin's usage scale. Don't add debounce/throttle logic unless the user later asks (CONTEXT.md leaves rapid open/close debounce as Claude's discretion, not a requirement).
- **Building a Gumroad API sync script:** D-05 makes this unnecessary. Do not create `release/gumroad-sync.js` — it would be dead code from day one, same failure mode as the currently-orphaned `updateChecker.ts` was before this phase.
- **Re-adding `requiredPermissions` with `domains: "all"`:** the existing codebase already scoped this to a single domain (`https://api.github.com`) before Phase 1 removed it — preserve that scoping; broadening it would violate DIST-01/UPD-01's "GitHub-API-only" allowlisting and gains nothing (the admin-password prompt is triggered by the mere presence of the permission block, not its breadth).
- **Silent/automatic download-and-install:** explicitly out of scope (REQUIREMENTS.md "Out of Scope" table) and structurally prevented already — `UpdateBanner`'s only action is `shell.openExternal()`, which opens the system browser. Do not "improve" this into an in-app download.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GitHub release metadata fetch/validation | A new fetch wrapper or GitHub SDK | Existing `checkForUpdates()`/`validateRelease()`/`isSafeUrl()` in `updateChecker.ts` | Already handles domain allowlisting, semver validation, and asset selection — CONTEXT.md explicitly confirms UPD-01/02 are "wiring, not building" |
| Update-available UI | A new banner/toast component | Existing `UpdateBanner.tsx` | Already built, already uses `shell.openExternal` correctly for the manual-download requirement (UPD-02) |
| Gumroad-to-GitHub file sync | A cron job, webhook, or Gumroad API script | Gumroad's built-in "Redirect to a URL after purchase" content-delivery option | Documented, first-party Gumroad feature — zero maintenance once configured (D-05) |
| Release checksum generation | A new checksum script | Existing `release/checksums.js` (Phase 3, Node built-in `crypto`) | Already built and zero-dependency; this phase should not touch it |

**Key insight:** Every "build" temptation in this phase is actually a "connect two already-correct things" task. The risk in this phase is not missing functionality — it's re-litigating decisions (D-02, D-05) that research has now closed, or building automation (Gumroad sync) that a first-party platform feature already makes unnecessary.

## Common Pitfalls

### Pitfall 1: Re-opening the D-02 "avoid the permission" investigation during planning
**What goes wrong:** A planner or future session sees "requiredPermissions triggers admin password" and assumes a narrower scope, a different UXP API, or a manifest trick hasn't been tried yet, and spends a planning/research cycle re-investigating.
**Why it happens:** The phrasing in REQUIREMENTS.md/CONTEXT.md ("investigate whether...", "unconfirmed") reads as open-ended even though this project's own commit history already ran the exact narrow-scope A/B test.
**How to avoid:** Point directly to git commit `d07142d` (the removal) and `2ea272d`/`eaf958f` (the narrow-scope grant that predates it) — the scoped, single-domain permission is the exact configuration that produced the prompt. D-02 is answered: no.
**Warning signs:** Any plan task titled "research alternative permission scopes" or "test domains: [single-domain] to see if it avoids the prompt" — this has already been tested and failed.

### Pitfall 2: Treating the admin-password prompt as a UPD-03 regression to prevent
**What goes wrong:** Because Phase 1's core value is "no admin/root access ever," a plan might try to architect around the prompt reappearing, adding complexity in service of an already-decided tradeoff.
**Why it happens:** The prompt reappearing looks like undoing Phase 1's work.
**How to avoid:** D-03 (locked, confirmed fallback) explicitly accepts this tradeoff. The plan should treat "manifest.json declares `requiredPermissions.network` again, admin-password prompt returns on install/update" as an accepted, documented consequence — not a bug. DOCS-01/DOCS-03 (Phase 5) will need to explain this to users, but that's out of this phase's scope.
**Warning signs:** Verification steps that check "no admin password prompt occurs" for the update-checker feature — that check should not exist for this phase; the opposite is expected.

### Pitfall 3: Zero test coverage for `updateChecker.ts` going unnoticed
**What goes wrong:** Because the function is fully written and "just needs wiring," it's tempting to skip writing tests since "the logic already works." No Jest test file exists today for either `updateChecker.ts` or `UpdateBanner.tsx`.
**Why it happens:** The code predates this phase and was written without accompanying tests (confirmed via `grep` — no `*.test.ts` file references `checkForUpdates`, `validateRelease`, or `UpdateBanner` anywhere in `src/__tests__/`).
**How to avoid:** Treat this as a genuine Wave 0 gap (see Validation Architecture below), not skippable because "the code is already correct." `validateRelease()`'s domain-allowlist and semver-rejection logic is exactly the kind of security-relevant code this project's own conventions (INTEG-04-style security review discipline) would normally require tests for.
**Warning signs:** A plan that wires `checkForUpdates()` into `App.tsx` without adding `src/__tests__/updateChecker.test.ts`.

### Pitfall 4: `global.fetch` mocking in a `testEnvironment: 'node'` Jest config
**What goes wrong:** `jest.config` uses `testEnvironment: 'node'` (see `package.json`). Node 18+ (and the dev machine's Node 26.4.0) has a native global `fetch`, so `checkForUpdates()` will use the real one unless explicitly mocked — tests could accidentally hit the real GitHub API if `global.fetch` isn't stubbed.
**Why it happens:** No existing test in this codebase currently mocks `fetch` (`checksums.js`/`version.js` tests use `fs`/`crypto`, not network calls) — there's no established in-repo pattern to copy.
**How to avoid:** Explicitly assign `global.fetch = jest.fn()` in the new test file's `beforeEach`, and restore/reset after each test. Do not rely on an auto-mock.
**Warning signs:** Tests that pass locally but make real network requests (slow, flaky, or silently succeed against live data instead of the fixture).

## Code Examples

### `updateChecker.ts` test skeleton (fills the Wave 0 gap)
```typescript
// Source: pattern inferred from existing checkForUpdates()/validateRelease() contract
// New file: src/__tests__/updateChecker.test.ts
import { checkForUpdates } from '../services/updateChecker';

describe('checkForUpdates', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('returns hasUpdate: true when GitHub tag_name is newer than PLUGIN_VERSION', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: 'v99.0.0',
        html_url: 'https://github.com/misterfulanito/guidemygrid/releases/tag/v99.0.0',
        assets: [],
      }),
    });
    const info = await checkForUpdates();
    expect(info?.hasUpdate).toBe(true);
  });

  it('rejects a download URL outside the allowed domain (isSafeUrl)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: 'v1.0.0',
        html_url: 'https://evil.example.com/fake-release',
      }),
    });
    const info = await checkForUpdates();
    expect(info).toBeNull(); // validateRelease throws → caught → null
  });

  it('returns null (never throws) on network failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));
    await expect(checkForUpdates()).resolves.toBeNull();
  });
});
```

### `App.tsx` wiring (minimal diff against the current file)
```typescript
// Source: adapted from this project's own useDocument.ts mount-effect shape
import { checkForUpdates } from './services/updateChecker';
import { UpdateBanner } from './components/shared/UpdateBanner';

// inside App():
const { updateInfo, setUpdateInfo, dismissUpdate } = useUIStore();

useEffect(() => {
  let cancelled = false;
  checkForUpdates().then((info) => {
    if (!cancelled && info?.hasUpdate) setUpdateInfo(info);
  });
  return () => { cancelled = true; };
}, []);

// in JSX, alongside the existing DocumentHintBanner conditional render:
{updateInfo && (
  <UpdateBanner info={updateInfo} onDismiss={dismissUpdate} />
)}
```

### `manifest.json` restoration (exact revert of commit `d07142d`)
```json
// Source: this project's own git history (commit 2ea272d, before removal)
{
  "requiredPermissions": {
    "network": {
      "domains": ["https://api.github.com"]
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Manifest declared `requiredPermissions.network` scoped to `api.github.com` (v1.0.x–v1.6.x history) | Manifest has no `requiredPermissions` block at all | Phase 1, commit `d07142d` (2026-07-06) | Removed the admin-password prompt but also silently orphaned the update checker (dead code) — this phase reverses that specific tradeoff consciously |
| Update checker built but never called | Update checker wired into `App.tsx` on every mount | This phase (UPD-03) | Feature becomes live for the first time since being written |

**Deprecated/outdated:**
- None — this phase reactivates existing, already-current code rather than replacing anything obsolete.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Gumroad's "Redirect to a URL after purchase" field has no URL-format restriction that would reject GitHub's `releases/latest` redirect URL specifically (as opposed to a generic external URL) | Summary, Standard Stack (Alternatives Considered) | If Gumroad validates/blocks GitHub domains or redirect-chain URLs specifically, D-05's plan needs the explicitly-deferred fallback (manual re-paste per release, or scripted sync) — this was verified via Gumroad's documentation, not a live test on the actual Gumroad account, since account creation is the user's manual step (D-06) |
| A2 | Re-declaring `requiredPermissions.network.domains: ["https://api.github.com"]` will reproduce the exact same admin-password prompt behavior observed in Phase 1's A/B test, with no change in Creative Cloud Desktop's behavior between then and now | Summary, Code Examples | CC Desktop is an Adobe-controlled, auto-updating application; if Adobe changed install-consent behavior between Phase 1's test and this phase's execution, the prompt could behave differently (better or worse) — should be re-verified with a live install during this phase's execution, not assumed purely from Phase 1's historical test |

## Open Questions

1. **Does Gumroad's redirect-after-purchase field accept a GitHub `releases/latest` URL specifically (not just any external URL)?**
   - What we know: Gumroad's documentation confirms the general redirect-to-URL mechanism exists and accepts external URLs.
   - What's unclear: Whether GitHub's `releases/latest` (a redirect itself, resolving to a versioned URL) is treated any differently than a static file URL by Gumroad's system — no live test has been run since the Gumroad account doesn't exist yet (D-06, user-owned setup step).
   - Recommendation: Treat as low-risk (redirect URLs are extremely common on the web and Gumroad's field is generic), but the plan's verification step for DIST-03 should include the user confirming the link resolves correctly in a real browser after setup, before the phase is marked complete.

2. **Will Creative Cloud Desktop's install-time consent dialog differ across macOS vs. Windows for the same `requiredPermissions.network` declaration?**
   - What we know: Phase 1's A/B test was performed only on macOS (the only physical dev machine, per STATE.md's repeated "no physical Windows machine" note).
   - What's unclear: Whether Windows' Creative Cloud Desktop shows an equivalent admin/UAC-elevation prompt for the same manifest permission, or behaves differently.
   - Recommendation: This phase's UPD-03 verification should be scoped to macOS (matching this project's established "Mac-first, Windows CI-verified where possible" pattern from Phase 2/3), and flag Windows admin-prompt behavior as an explicit open item for whoever eventually gets Windows hardware/collaborator access — do not assume parity without evidence.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `gh` CLI | `release/github-release.js` (existing, unchanged this phase) | ✓ | 2.92.0 | — |
| Node.js | Build scripts, Jest, global `fetch` in tests | ✓ | v26.4.0 | — |
| npm | Test runner, build | ✓ | 11.17.0 | — |
| git | Release script commit/push/tag steps | ✓ | 2.50.1 | — |
| Gumroad account | DIST-02 manual setup | Unconfirmed — user-owned step (D-06), not yet created | — | None — blocks DIST-02/03 until the user completes the manual signup; this phase's code changes (manifest, App.tsx wiring) do not depend on it and can proceed independently |
| Real Photoshop + Creative Cloud Desktop (macOS) | Live verification of the restored admin-password prompt + working update banner | Assumed available (used throughout Phases 1–3) | — | — |

**Missing dependencies with no fallback:**
- None blocking the code-level work (manifest/App.tsx/tests). The Gumroad account itself has no fallback other than the user completing the manual signup — this is expected per D-06 and should be a `checkpoint:human-verify`-style task in the plan, not something Claude can complete unattended.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.0.0 + ts-jest 29.0.0 [VERIFIED: package.json] |
| Config file | Inline in `package.json` (`"jest": {...}`) — `testEnvironment: "node"`, preset `ts-jest` |
| Quick run command | `npx jest src/__tests__/updateChecker.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UPD-01 | Update checker only ever contacts `api.github.com`; rejects non-allowlisted URLs | unit | `npx jest src/__tests__/updateChecker.test.ts -t "allowed domain"` | ❌ Wave 0 |
| UPD-01 | Response validation rejects malformed/missing `tag_name`/`html_url` | unit | `npx jest src/__tests__/updateChecker.test.ts -t "validateRelease"` | ❌ Wave 0 |
| UPD-02 | Clicking "Download" calls `shell.openExternal`, never triggers an in-app download/install | unit/render | `npx jest src/__tests__/UpdateBanner.test.tsx` | ❌ Wave 0 |
| UPD-03 | `checkForUpdates()` is actually invoked on `App.tsx` mount (wiring, not just existence) | integration/render | `npx jest src/__tests__/App.updateBanner.test.tsx` | ❌ Wave 0 |
| UPD-03 | Manifest change (`requiredPermissions.network`) present and correctly scoped | static/manifest check | Extend existing `installer-static.test.ts`-style token scan, or a new `manifest-permissions.test.ts` | ❌ Wave 0 (pattern exists in `installer-static.test.ts` from Phase 1, but no test currently asserts on `requiredPermissions`) |
| DIST-01 | GitHub Releases remains the only referenced file host in checker code | unit | Covered by the UPD-01 allowlist test above | ❌ Wave 0 |
| DIST-02, DIST-03 | Gumroad listing exists and its download link resolves to the current GitHub Release | manual-only | N/A — external service, no API access from this repo | — (manual-only, justified: no Gumroad API credentials/scripting per D-05, and DIST-02 is explicitly a human-owned manual setup step) |

### Sampling Rate
- **Per task commit:** `npx jest src/__tests__/updateChecker.test.ts` (and any other new test file touched)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`, plus a live manual verification pass (real Photoshop install, real Gumroad link click) since DIST-02/03 and the admin-password-prompt confirmation cannot be automated

### Wave 0 Gaps
- [ ] `src/__tests__/updateChecker.test.ts` — covers UPD-01 (domain allowlist, response validation, version comparison, silent-null-on-error)
- [ ] `src/__tests__/UpdateBanner.test.tsx` — covers UPD-02 (renders correctly, dismiss works, download click calls `shell.openExternal` not a direct download)
- [ ] `src/__tests__/App.updateBanner.test.tsx` — covers UPD-03 (the actual wiring: mount triggers the check, conditional render works)
- [ ] Manifest permission assertion — either extend `src/__tests__/installer-static.test.ts` or add a new small test asserting `manifest.json`'s `requiredPermissions.network.domains` is exactly `["https://api.github.com"]` (regression guard against accidentally broadening to `"all"`)
- [ ] `beforeEach(() => { global.fetch = jest.fn(); })` convention — no existing test in this repo mocks `fetch`; this is new ground for the test suite (see Pitfall 4)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | No auth surface added — GitHub API call is unauthenticated (public releases endpoint), Gumroad checkout is Gumroad's own concern, not this codebase's |
| V3 Session Management | No | No sessions introduced |
| V4 Access Control | No | No access-control surface |
| V5 Input Validation | Yes | Already implemented: `validateRelease()`'s type checks (`typeof r.tag_name !== 'string'`), `SEMVER_RE` regex validation, `Array.isArray(r.assets)` check — this phase should preserve, not weaken, these (UPD-01 says "don't regress this") |
| V6 Cryptography | No | No new cryptographic operations in this phase (checksum generation was Phase 3/INTEG-02, unchanged here) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Malicious/compromised GitHub API response redirecting users to an attacker-controlled download URL | Tampering / Spoofing | Already mitigated: `isSafeUrl()` enforces `ALLOWED_URL = 'https://github.com/misterfulanito/guidemygrid/'` prefix-match on both `html_url` and any asset `browser_download_url` before use — this phase's wiring must not bypass or weaken this check |
| Manifest permission scope creep (`domains: "all"` instead of a single domain) | Elevation of Privilege | Keep `requiredPermissions.network.domains` scoped to exactly `["https://api.github.com"]` — broadening it is unnecessary (nothing else is called) and would expand the plugin's network attack surface beyond what CC Desktop's own consent dialog describes to the user |
| Non-semver or malformed `tag_name` causing incorrect version-comparison logic (e.g., a crafted tag tricking `compareVersions` into a false "no update" or a spoofed "update available" prompting a bad download) | Tampering | Already mitigated: `SEMVER_RE = /^\d+\.\d+\.\d+$/` rejects any non-strict-semver tag before `compareVersions` runs — verify test coverage for this specific rejection path (currently untested, see Wave 0 gaps) |
| Gumroad link pointing to a stale/incorrect GitHub URL due to human error during manual setup (D-06) | Tampering (low severity — user-facing UX bug, not a security vulnerability per se) | No code mitigation possible (external, manual step) — the plan's verification step should include a human click-through confirming the live link resolves to the current release, not just visual inspection of the pasted URL |

## Sources

### Primary (HIGH confidence)
- This project's own git history — `d07142d` (removal), `2ea272d`/`eaf958f` (the narrow-scope permission that predates removal), `.planning/phases/01-foundation-macos-installer-rework/01-RESEARCH.md` (the original A/B test writeup) — direct, first-party empirical evidence specific to this exact plugin and CC Desktop version
- `manifest.json`, `src/services/updateChecker.ts`, `src/components/shared/UpdateBanner.tsx`, `src/App.tsx`, `src/store/uiStore.ts`, `src/hooks/useDocument.ts` (direct code inspection)
- `.planning/codebase/CONCERNS.md` — confirms dead-code status and suggests the same fix approach independently landed on here

### Secondary (MEDIUM confidence)
- [Adobe UXP Manifest docs](https://developer.adobe.com/photoshop/uxp/2022/guides/uxp-guide/uxp-misc/manifest-v4/) and [Manifest v5](https://developer.adobe.com/photoshop/uxp/2022/guides/uxp_guide/uxp-misc/manifest-v5/) — `requiredPermissions.network.domains` accepts an array or `"all"`; permissions not declared are denied by default
- [Adobe Help — Fix issues with installing XD plugins](https://helpx.adobe.com/creative-cloud/kb/troubleshoot-common-addon-installation-issues.html) — admin-password requirement explicitly tied to declared access level (Network/Local FileSystem)
- [Adobe Creative Cloud Developer Forums — network permission denied for fetch](https://forums.creativeclouddeveloper.com/t/uxp-manifest-network-permission-denied-for-fetch-despite-domains-all/10557) and [requiredPermissions issue #321](https://github.com/AdobeDocs/uxp-photoshop/issues/321) — confirms undeclared/misconfigured network permission causes a hard runtime failure, not a silent bypass
- [Gumroad Help — Custom delivery of content](https://help.gumroad.com/article/154-custom-delivery-products) — "Redirect to a URL after purchase" option, confirms D-05's mechanism exists

### Tertiary (LOW confidence)
- None used as load-bearing claims — all findings above were corroborated against either this project's own empirical history or official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all existing and version-verified from `package.json`
- Architecture: HIGH — wiring pattern directly modeled on this project's own existing `useDocument.ts` hook
- D-02 (network permission avoidance): HIGH — first-party empirical evidence (this project's own A/B test already tried the narrow-scope approach) cross-confirmed by official Adobe documentation on install-time consent
- D-05 (Gumroad redirect capability): MEDIUM — confirmed via Gumroad's own help documentation; not yet confirmed via a live test on an actual Gumroad account (doesn't exist yet — user-owned setup step)
- Pitfalls/Testing gaps: HIGH — directly confirmed via `grep` showing zero existing test coverage for `updateChecker.ts`/`UpdateBanner.tsx`

**Research date:** 2026-07-07
**Valid until:** 30 days (stable domain — UXP manifest permission model and Gumroad's content-delivery options are not fast-moving; re-verify D-05 empirically once the user actually creates the Gumroad account, regardless of this expiry window)
