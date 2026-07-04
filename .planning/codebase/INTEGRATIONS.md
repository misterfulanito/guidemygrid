# External Integrations

**Analysis Date:** 2026-07-04

## APIs & External Services

**GitHub API:**
- Service: GitHub Releases API (REST v3)
- What it's used for: Check for plugin updates; compare plugin version with latest release on GitHub
- SDK/Client: Native `fetch()` (no HTTP library)
- Endpoint: `https://api.github.com/repos/misterfulanito/guidemygrid/releases/latest`
- Auth: None (public repository, no authentication required)
- File: `src/services/updateChecker.ts`
- Security: Response validated before consumption; only `tag_name`, `html_url`, `assets` fields extracted; domain validation ensures URLs point to `github.com/misterfulanito/guidemygrid/`

**Adobe Photoshop UXP API:**
- Service: Adobe Photoshop Plugin Host (proprietary UXP runtime)
- What it's used for: Core plugin functionality — create/read/delete guides, access active document properties, manage selections
- SDK/Client: `require('photoshop')` module provided by UXP host; no npm package (external module)
- Auth: None (runs inside Photoshop with plugin permissions)
- Files: `src/services/photoshopBridge.ts` (main integration point)
- Key methods:
  - Document access: `app.activeDocument` property
  - Batch actions: `photoshop.action.batchPlay()` — UXP's scripting API for guide operations
  - Modal execution: `photoshop.core.executeAsModal()` — Required for guide creation/deletion
  - Guide manipulation: Create (`make`), read (`get`), delete (`delete`), toggle visibility
- Constraints:
  - Only callable from within Photoshop UXP runtime
  - Guide operations must run inside `executeAsModal()` callback (Photoshop requirement)
  - On older Photoshop versions, `getGuidesVisible()` may fail and falls back to `true`

## Data Storage

**File System:**
- Type: Local filesystem (no database)
- How: Plugin state stored in Zustand memory stores
- Persistence: None — state lost on panel close (by design; no file system access from UXP plugins)
- Location: Runtime only (`src/store/gridStore.ts`, `src/store/uiStore.ts`)

**Document Metadata:**
- Type: Photoshop document properties
- Access: Via `photoshop` API in `photoshopBridge.ts`
- Data: Width, height, resolution, active selection bounds, existing guides
- Read-only: Plugin does not modify document structure; only adds guides

**File Storage:**
- Type: None (UXP plugins cannot write to local filesystem)

**Caching:**
- Type: None (not implemented)

## Authentication & Identity

**Auth Provider:**
- Type: None
- Plugin operates under Photoshop user's identity
- GitHub API calls are unauthenticated (public repository)

## Monitoring & Observability

**Error Tracking:**
- Type: None (no external error tracking service)
- Approach: Console logging only (`console.error()` for failures in `updateChecker.ts` and `photoshopBridge.ts`)

**Logs:**
- Type: Console logs (stdout/stderr via browser dev tools in UXP panel)
- Format: Manual console calls with `[GMG]` prefix for identification
- Example: `console.error('[GMG] checkForUpdates failed:', err)` in `src/services/updateChecker.ts`

## CI/CD & Deployment

**Hosting:**
- Type: GitHub Releases
- How: Manual — `npm run release:*` bumps version and packages `.ccx` file
- Distribution: `.ccx` uploaded to GitHub Release or shared directly

**CI Pipeline:**
- Type: None (no automated CI detected)
- Manual steps: Developer runs `npm run release:*` locally

**Plugin Installation:**
- Method 1: Via Photoshop Plugin Manager — users install `.ccx` from marketplace
- Method 2: Direct download from GitHub Releases and drag-and-drop into Photoshop
- Method 3: Copy `.ccx` to Photoshop plugins directory

## Environment Configuration

**Required env vars:**
- None

**Secrets location:**
- No secrets used

**Configuration approach:**
- manifest.json - Plugin metadata and permissions
- src/version.ts - Plugin version (synced from package.json)
- src/types/index.ts - Type definitions exported to components
- Default values hardcoded (no config files or env vars)

## Network & Security

**Network Permissions (from manifest.json):**
```json
"requiredPermissions": {
  "network": {
    "domains": [
      "https://api.github.com"
    ]
  }
}
```
- Restricted to: `https://api.github.com` only (no other domains allowed)
- Purpose: Check for plugin updates
- Validation: Domain check in `isSafeUrl()` function in `updateChecker.ts` ensures response URLs point to allowed domain

**Photoshop Permissions:**
- Not explicitly declared in manifest (UXP handles this)
- Implicitly required: Read document properties, create/delete guides, execute modal operations

**CORS:**
- Not applicable (fetch from UXP runtime, which bypasses browser CORS)

## Webhooks & Callbacks

**Incoming:**
- Type: None

**Outgoing:**
- Type: None (plugin is read-only on GitHub API)

## Third-Party Dependencies

**Runtime Dependencies:**
- `react` 18.2.0 - MIT
- `react-dom` 18.2.0 - MIT
- `zustand` 4.4.0 - MIT
- `lucide-react` 0.577.0 - ISC

**Dev Dependencies:**
- `webpack` 5.88.0 - MIT
- `jest` 29.0.0 - MIT
- `typescript` 5.0.0 - Apache 2.0
- `eslint` 8.0.0 - MIT
- All other deps: MIT or compatible

**No external APIs beyond:**
- GitHub REST API v3 (public, no key required)
- Adobe Photoshop UXP (proprietary, included with Photoshop)

---

*Integration audit: 2026-07-04*
