# Architecture Research

**Domain:** Design-tool plugin installer/distribution pipeline (Adobe UXP today; Illustrator/Figma are a possible future expansion, not active scope)
**Researched:** 2026-07-04
**Confidence:** HIGH (Adobe UXP manifest/host mechanics — official docs) / MEDIUM (Illustrator UXP public availability, Figma packaging specifics — community + vendor docs, no first-party roadmap commitment)

## Standard Architecture

### System Overview

The critical fact that should drive this milestone's structure: **the three candidate host apps do not share one distribution model — they use three genuinely different mechanisms**, not three configurations of the same mechanism.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Photoshop (UXP — today, in scope)                │
├───────────────────────────────────────────────────────────────────-─┤
│ manifest.json (v5, "host":[{"app":"PS",...}])                        │
│ Sideload: copy plugin folder into shared PluginsStorage/PHSP/<id>/   │
│ Install = filesystem copy → user-level installer (.pkg / .exe)       │
└───────────────────────────────────────────────────────────────────-─┘

┌─────────────────────────────────────────────────────────────────────┐
│         Illustrator (CEP today — UXP is Adobe-internal only)         │
├───────────────────────────────────────────────────────────────────-─┤
│ manifest.xml (CSXS schema, NOT UXP manifest.json)                    │
│ Packaged as .zxp, ExtendScript bridge (CSInterface), Chromium webview│
│ Install = copy into CEP/extensions/ (or Extension Manager) + registry│
│           debug flag for unsigned, OR paid cert signing              │
└───────────────────────────────────────────────────────────────────-─┘

┌─────────────────────────────────────────────────────────────────────┐
│                    Figma (own plugin runtime — different API)        │
├───────────────────────────────────────────────────────────────────-─┤
│ manifest.json (Figma's own schema: id/api/main/ui/editorType/        │
│                networkAccess — unrelated to UXP's manifest)          │
│ NO local file install at all. Code runs from Figma's own hosting.    │
│ Distribution = "Publish to Figma Community" or "private/org plugin". │
│ No .pkg/.exe, no PluginsStorage, no GitHub-Releases-driven install.  │
└───────────────────────────────────────────────────────────────────-─┘
```

Confirmed from Adobe's own docs: UXP's manifest v5 `host` field is an array and *can* express multiple UXP-native apps in one manifest during development, but **only Photoshop and Adobe XD are the practical multi-host UXP targets today** — InDesign and Premiere Pro have their own UXP manifests but each targets its own app. Illustrator is not on that list: **UXP for Illustrator is Adobe-internal only as of 2026 — no public API, no docs, no announced timeline for third parties.** A real Illustrator plugin today would have to be built on CEP, a wholly different framework (XML manifest, ExtendScript, ZXP packaging, separate install directory) — effectively a second app, not a `host` array entry.

Figma's manifest.json looks superficially similar (also JSON, also has `id`/version-ish fields) but is a completely unrelated schema serving a completely different runtime — Figma plugins execute inside Figma's own sandboxed JS engine, not UXP, and are not something a user "installs" onto their filesystem at all.

**Implication for this milestone:** there is no shared "plugin manifest abstraction" or "installer abstraction" worth building across these three today, because two of the three targets (Illustrator via CEP, Figma) don't share UXP's install model even conceptually. The only things that *are* genuinely shared across any future host are the **release-automation mechanics** — versioning, checksums, GitHub Release creation, Gumroad listing sync — because those operate on build artifacts and version metadata, not on host-specific install logic.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Host-specific packager | Turn `dist/` build output + manifest into an installable artifact for one host | Photoshop: folder → `.pkg`/`.exe` installer via `pkgbuild`/Inno Setup. (Illustrator/Figma: not built now — would be a `.zxp` packager or a Figma publish step respectively, structurally unrelated to the Photoshop packager) |
| Host-specific installer script | Places the artifact at the correct user-level filesystem path, no elevation | macOS: writes into `~/Library/Application Support/Adobe/UXP/PluginsStorage/PHSP/...`. Windows: writes into `%APPDATA%\Adobe\UXP\PluginsStorage\...` |
| Host-specific uninstaller script | Removes plugin + leftover artifacts cleanly | Existing macOS/Windows uninstall scripts |
| Release orchestrator (shared) | Coordinate: bump version → run packager(s) → checksum artifacts → publish | New this milestone — host-agnostic, invoked per-target |
| Checksum generator (shared) | SHA256 every release artifact, write a manifest file | New this milestone — pure function over a list of file paths, no host knowledge |
| GitHub Release publisher (shared) | Create tag/release, upload artifacts + checksums | New this milestone — generic GitHub API/`gh` CLI wrapper |
| Gumroad sync (shared) | Push new version/download link to the Gumroad listing | New this milestone — generic HTTP call against Gumroad API, parameterized by artifact URL and version, no host knowledge |
| In-app update checker | Runtime code, inside the plugin, that asks "is there a newer release?" | Existing `src/services/updateChecker.ts` — this is Photoshop-app runtime code, NOT distribution tooling; it stays in `src/` |

## Recommended Project Structure

```
guidemygrid/
├── src/                          # UNCHANGED — Photoshop UXP app source
│   └── services/updateChecker.ts # in-app runtime update check (host-specific, stays here)
├── manifest.json                 # UNCHANGED location — UXP tooling requires this at plugin package root
├── distribution/                 # NEW — everything about turning a build into an installed plugin
│   ├── photoshop/                # THIS milestone's active work lives here
│   │   ├── macos/                # pkgbuild project, postinstall script, uninstaller
│   │   ├── windows/               # Inno Setup / NSIS script, uninstaller
│   │   └── README.md             # "Photoshop-specific: PluginsStorage/PHSP path, .pkg/.exe packaging"
│   └── README.md                 # "One subfolder per host app. Add distribution/illustrator/ or
│                                  #  distribution/figma/ here when that milestone starts — do not
│                                  #  touch photoshop/ or release/ to do it."
├── release/                      # NEW — host-agnostic release automation, shared by any future host
│   ├── version.js                # version bump (generalizes existing scripts/sync-version.js)
│   ├── checksums.js               # SHA256 over a list of artifact paths → checksums.txt
│   ├── github-release.js         # create GitHub Release, upload artifacts + checksums
│   └── gumroad-sync.js            # push version/download link to Gumroad listing
├── scripts/                      # EXISTING — build-time only (webpack-adjacent), unchanged
│   ├── sync-version.js
│   └── package.js                 # keep or fold into distribution/photoshop/ + release/version.js
```

### Structure Rationale

- **`distribution/<host>/`:** Every host-specific packaging/installer concern is isolated to its own directory. A future `distribution/illustrator/` (CEP `.zxp`, CSXS manifest, ExtendScript glue) or `distribution/figma/` (Figma manifest + publish checklist, likely *no scripts at all* since there's nothing to package/install locally) is additive — it never requires touching `distribution/photoshop/` or `release/`.
- **`release/` separated from `distribution/`:** This is the one layer that is genuinely reusable, and reusable *because* it's generic — it only knows "here is a file, here is a version string, here is where it goes" (GitHub Releases API, Gumroad API, checksum algorithm). It must never import a Photoshop-specific path constant. That's the actual boundary this milestone should establish.
- **`manifest.json` stays at repo/package root, not inside `distribution/photoshop/`:** UXP tooling (and the `.ccx`/sideload packaging step) expects the manifest at the plugin package root — moving it would break the existing build. Only the *installer scripts that consume the built package* move into `distribution/photoshop/`.
- **`src/services/updateChecker.ts` stays in `src/`, not `distribution/`:** It's in-app runtime code (bundled into the plugin itself, executes inside Photoshop's UXP sandbox), not a build-time/release-time script. Distribution tooling and in-app host-integration code are different concerns that happen to both be "Photoshop-specific" — don't conflate them.

## Architectural Patterns

### Pattern 1: Per-host packager, shared release orchestrator

**What:** A thin per-host npm script (`release:photoshop`, later `release:illustrator`, `release:figma`) calls that host's packager first, then hands the resulting artifact path(s) to the shared `release/` scripts (checksum → GitHub release → Gumroad sync). The shared scripts never contain an `if (host === 'photoshop')` branch — they take a file path and a version string as arguments.

**When to use:** Now — this is the actual "don't block Illustrator/Figma" investment worth making this milestone, because it costs almost nothing (a folder boundary + a couple of generic scripts you're already building for checksums/GitHub Releases anyway) and pays off directly the day a second host is added.

**Trade-offs:** None significant — this is just "don't hardcode Photoshop paths into scripts that don't need to know about Photoshop."

**Example:**
```json
// package.json (illustrative)
"scripts": {
  "release:photoshop": "node distribution/photoshop/build-installers.js && node release/checksums.js dist-installers/photoshop/* && node release/github-release.js && node release/gumroad-sync.js"
}
```

### Pattern 2: Config object per target, not code branching

**What:** If/when a second host exists, express its differences (artifact type, whether it even uses GitHub Releases/Gumroad at all) as a small data file (`distribution/photoshop/target.json`: `{ "artifactExt": "pkg", "usesGithubRelease": true, "usesGumroad": true }`), and have `release/` scripts read that config rather than growing host `switch` statements.

**When to use:** Only once a second host actually exists. Do not create this config file today for a single host — that's speculative structure with no consumer. The folder boundary from Pattern 1 is sufficient preparation; the config-object pattern is documented here so the *next* milestone knows what to reach for, not so this milestone builds it preemptively.

**Trade-offs:** Slightly more indirection than a single hardcoded script, but avoids the shared release scripts accumulating per-host conditionals as hosts are added.

### Pattern 3: Don't build a runtime host-abstraction layer

**What:** Resist creating an `IHostBridge` interface with `PhotoshopBridge`/`IllustratorBridge`/`FigmaBridge` implementations inside `src/`, or a shared "plugin core" package, in anticipation of Illustrator/Figma.

**When to use:** N/A — this is the pattern to avoid, not adopt.

**Trade-offs:** Building this now would be pure speculative generality: Figma plugins run on an entirely different JS API surface (no `batchPlay`, no UXP `photoshop` module at all — a completely different SDK), and Illustrator's eventual public API (CEP today, or UXP whenever/if Adobe ships it) is not even stable enough to design an abstraction against. Any interface written today would almost certainly be wrong and would need to be rewritten once the real Illustrator/Figma API surface is known — costing more than starting fresh at that time. The correct scope for "don't block the future" in *this* milestone is the distribution/release layer (Pattern 1), not the application/runtime layer.

## Data Flow

### Release Pipeline (per host)

```
[npm run release:photoshop]
        ↓
[distribution/photoshop/*]  → build .pkg (macOS) / .exe (Windows) from dist/ + manifest.json
        ↓
[release/checksums.js]      → SHA256 every artifact → checksums.txt
        ↓
[release/github-release.js] → tag, create GitHub Release, upload artifacts + checksums.txt
        ↓
[release/gumroad-sync.js]   → update Gumroad listing with new version + GitHub download link
```

### In-App Update Check (unchanged, runtime, not part of the release pipeline above)

```
[Photoshop plugin boots] → useDocument/App mount
        ↓
[updateChecker.checkForUpdates()] → GitHub Releases API (api.github.com, read-only)
        ↓
[UpdateBanner component] → shown if newer version available, links to Gumroad/GitHub download
```

### Key Data Flows

1. **Build → package → publish:** `dist/` (webpack output, host-agnostic bundle) is the single input consumed by whichever host packager runs; the packager is the only place that knows about host-specific paths/formats.
2. **Publish → verify:** Checksums are generated once, from the packaged artifact, and published alongside it — independent of which host produced the artifact.
3. **Runtime update check → user action:** The in-app checker only reads a version number from GitHub; it never touches the release pipeline and has no dependency on `distribution/` or `release/` at build time.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 host (Photoshop only — this milestone) | `distribution/photoshop/` + `release/` as described. No config-object indirection needed yet — a single npm script per platform is fine. |
| 2 hosts (+ Illustrator via CEP, or + Figma) | Add `distribution/illustrator/` or `distribution/figma/` as a sibling folder. Introduce Pattern 2's target-config file only now, so `release/` scripts stop assuming "there is exactly one artifact type." If the second host is Figma, `release/github-release.js`/`gumroad-sync.js` may simply not be invoked for that target (Figma's "release" is a Community/org publish action, not a file upload) — the orchestrator needs to treat those steps as optional per target, not mandatory. |
| 3 hosts | By this point the config-object pattern should be fully load-bearing; consider whether `release/` scripts need a small CLI (`node release/publish.js --target=photoshop`) rather than one npm script per host, purely for readability — still no abstraction needed inside `src/`, since each host's app code remains a structurally separate concern from the shared app's grid-generation logic (which itself is out of scope for this milestone). |

### Scaling Priorities

1. **First bottleneck:** Nothing breaks structurally going from 1→2 hosts if the `distribution/<host>/` vs `release/` boundary is respected from the start — this is exactly why it's worth setting up now, cheaply, in this milestone.
2. **Second bottleneck:** If a future host (Figma) doesn't fit the "package → checksum → GitHub Release → Gumroad" pipeline shape at all, the orchestrator (Pattern 1) needs each pipeline step to be independently skippable per target — plan for that when Pattern 2's config file is introduced, not before.

## Anti-Patterns

### Anti-Pattern 1: Hardcoding Photoshop paths in "shared" scripts

**What people do:** Put `PluginsStorage/PHSP/` or `%APPDATA%\Adobe\UXP\...` path literals inside `release/checksums.js` or `release/github-release.js` "just to get it working."
**Why it's wrong:** The moment a second host exists, every shared script has to be edited and re-tested to add a conditional — exactly the coupling this milestone is meant to avoid.
**Do this instead:** Path/host knowledge lives only in `distribution/photoshop/*`. Shared scripts take artifact file paths and a version string as arguments and know nothing about where those files came from.

### Anti-Pattern 2: Building a Figma or Illustrator scaffold "just in case"

**What people do:** Pre-create `distribution/figma/manifest.json` or a CEP `.zxp` packaging script with placeholder content, reasoning "we'll need it eventually."
**Why it's wrong:** It's dead, untested code targeting APIs that either don't exist for third parties yet (Illustrator UXP is Adobe-internal only, no public timeline) or that this milestone has no business validating (Figma's manifest schema and publish flow are unrelated to anything being built now). It also risks becoming stale/wrong by the time that milestone actually starts, costing more to unwind than to write fresh later.
**Do this instead:** Leave a one-paragraph `distribution/README.md` note describing the intended pattern (one subfolder per host, `release/` stays generic) so a future contributor knows where to put things — documentation, not code.

### Anti-Pattern 3: One monolithic "photoshop/" folder mixing app source and installer scripts

**What people do:** Put installer/uninstaller shell scripts and packaging config next to `src/` or inside `scripts/` without a clear top-level "this is the distribution layer" boundary.
**Why it's wrong:** Makes it unclear, a milestone from now, what's "the app" vs "how the app gets onto a user's machine" — and makes it harder to see that `release/` genuinely doesn't belong to any one host.
**Do this instead:** The three-way split used above — `src/` (app), `distribution/<host>/` (host-specific packaging/install), `release/` (host-agnostic publish automation) — keeps each concern greppable and makes the future host boundary self-evident from the directory listing alone.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub Releases API | `release/github-release.js` creates a tag + release, uploads installer artifacts and a checksums file as release assets | Already partially integrated via existing `updateChecker.ts` (read path); this milestone adds the write path (publish automation) |
| Gumroad | `release/gumroad-sync.js` calls Gumroad's API (or, if no suitable write API exists for the free-tier product used, this becomes a documented manual step, not scripted) to point the listing at the new GitHub Release download URL | Needs a phase-planning decision (already flagged in PROJECT.md) on manual vs. scripted sync — verify Gumroad's public API supports updating an existing product's file/URL before committing to full automation |
| Checksums (SHA256) | Generated locally from build artifacts before upload, published as a plain-text file alongside installers | No external service — pure local computation, but critical for the "verifiable integrity without paid signing" goal |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `src/` (app) ↔ `distribution/photoshop/` (installer) | None at runtime — installer scripts consume `dist/` build output as a build-time artifact, never imported by app code | Keep this a one-way, build-time-only relationship |
| `distribution/photoshop/` ↔ `release/` | Shared scripts invoked with artifact paths/version as CLI args, no shared modules imported in the other direction | Preserves the reusability of `release/` for a future host |
| `src/services/updateChecker.ts` ↔ GitHub Releases API | HTTP read, unauthenticated, domain-allowlisted to `api.github.com` | Existing, unchanged by this milestone; conceptually separate from the write-side `release/github-release.js` even though both talk to the same API |

## Sources

- [UXP Manifest v5 — Adobe Developer docs](https://developer.adobe.com/photoshop/uxp/2022/guides/uxp_guide/uxp-misc/manifest-v5/) — HIGH confidence, official
- [Same manifest/ID with multiple hosts — Adobe Creative Cloud Developer Forums](https://forums.creativeclouddeveloper.com/t/same-manifest-id-with-multiple-hosts/7743) — MEDIUM confidence, official forum, confirms host array is dev-time-only for multi-host, single host required at marketplace submission (not directly relevant since this project doesn't use the marketplace, but confirms the `host` array's real-world limits)
- [UXP Manifest — InDesign Adobe Developer docs](https://developer.adobe.com/indesign/uxp/plugins/concepts/manifest/) — HIGH confidence, official, confirms each UXP-enabled app has its own manifest/app value
- ["Clarification needed: Is UXP publicly available for Illustrator in 2026?" — Adobe Community](https://community.adobe.com/questions-652/clarification-needed-is-uxp-publicly-available-for-illustrator-in-2026-1548811) — MEDIUM confidence, community/official-adjacent, corroborated by second source below
- [UXP for Illustrator: Status & What to Use Today — Mapsoft](https://mapsoft.com/posts/illustrator-uxp-status.html) — MEDIUM confidence, third-party but detailed and consistent with Adobe community responses; confirms CEP remains the only public path for third-party Illustrator extensibility as of 2026
- [Figma Plugin Manifest — Figma Developer Docs](https://www.figma.com/plugin-docs/manifest/) — HIGH confidence, official
- [Publish plugins to the Figma Community — Figma Help Center](https://help.figma.com/hc/en-us/articles/360042293394-Publish-plugins-to-the-Figma-Community) — HIGH confidence, official, confirms public Community publish vs. private/org sharing as the only two distribution paths (no local install mechanism in either case)

---
*Architecture research for: UXP plugin installer/distribution pipeline (GuideMyGrid, multi-host-portable)*
*Researched: 2026-07-04*
