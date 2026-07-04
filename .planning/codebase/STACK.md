# Technology Stack

**Analysis Date:** 2026-07-04

## Languages

**Primary:**
- TypeScript 5.x - All source code in `src/` directory; `strict: true` enabled in `tsconfig.json`

**JavaScript Variants:**
- Node.js (ES2020) - Build scripts in `scripts/` (`package.js`, `sync-version.js`)

## Runtime

**Environment:**
- Node.js (LTS recommended) - Development and build-time only
- UXP Runtime (Adobe) - Plugin execution environment inside Photoshop; provides `photoshop` and `uxp` modules

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present (pinned dependency versions)

## Frameworks

**Core:**
- React 18.2.0 - UI rendering for UXP panel; uses JSX with `react-jsx` compiler option in `tsconfig.json`
- Adobe UXP (Manifest version 4) - Plugin host framework; defines entrypoints, permissions, and host app requirements in `manifest.json`

**State Management:**
- Zustand 4.4.0 (`zustand`) - Lightweight state store for grid configuration and UI state (`src/store/gridStore.ts`, `src/store/uiStore.ts`)

**UI & Icons:**
- lucide-react 0.577.0 - SVG icon library (used selectively; custom SVG icons preferred in `src/App.tsx`)

**Testing:**
- Jest 29.0.0 - Test runner for unit tests
- ts-jest 29.0.0 - TypeScript support for Jest

**Build/Dev:**
- Webpack 5.88.0 - Module bundler; configured in `webpack.config.js` to output UXP-compatible package
- ts-loader 9.4.0 - TypeScript loader for Webpack
- webpack-cli 5.1.0 - Command-line interface for Webpack
- HtmlWebpackPlugin 5.5.0 - Generates HTML entry point
- CopyWebpackPlugin 11.0.0 - Copies static assets (`manifest.json`, `icons/`) to dist
- MiniCssExtractPlugin 2.10.0 - Extracts CSS into separate files

**Linting & Code Quality:**
- ESLint 8.0.0 - JavaScript/TypeScript linting
- @typescript-eslint/parser 6.0.0 - TypeScript parser for ESLint
- @typescript-eslint/eslint-plugin 6.0.0 - TypeScript-specific linting rules
- TypeScript 5.0.0 - Type checking (invoked separately via `npm run type-check`)

**CSS:**
- CSS Modules - Component-scoped styling via `.module.css` files (e.g., `src/App.module.css`)
- PostCSS - Implicit support via Webpack; no explicit config file
- Plain CSS - Global styles in `src/styles/tokens.css`

## Key Dependencies

**Critical:**
- `react` 18.2.0 - Why it matters: Core UI rendering; UXP panels must use React to integrate with Adobe's component system
- `zustand` 4.4.0 - Why it matters: Manages grid configuration state and UI state (guides visibility, active document) across the plugin lifetime
- `typescript` 5.0.0 - Why it matters: Enables type-safe code in strict mode; critical for plugin stability and maintainability

**Infrastructure:**
- `webpack` 5.88.0 - Bundles TypeScript → JavaScript for UXP consumption
- `jest` 29.0.0 - Validates grid generation logic before release

## Configuration

**TypeScript:**
- File: `tsconfig.json`
- Key settings:
  - `"strict": true` - All strict mode checks enabled
  - `"target": "ES2020"` - Output JavaScript targets ES2020 (compatible with Photoshop 2021+)
  - `"jsx": "react-jsx"` - New JSX transform (no `React` import required per component)
  - `"lib": ["ES2020", "DOM"]` - ES2020 features + DOM APIs
  - `"moduleResolution": "node"` - Node.js-style module resolution
  - `"outDir": "./dist"`, `"rootDir": "./src"` - Source organization

**Webpack:**
- File: `webpack.config.js`
- Externals: `photoshop`, `uxp`, `os`, `fs`, `path` - Not bundled; provided by UXP host
- CSS handling: Module CSS (`.module.css`) and global CSS (`.css`) treated separately
- Entry: `./src/index.tsx` → Output: `dist/index.js` + `dist/styles.css`
- Plugins copy `manifest.json` and `icons/` to dist

**Jest:**
- Preset: `ts-jest` - TypeScript support
- Test environment: `node` - Tests run in Node.js
- Test files: `**/__tests__/**/*.test.ts`, `**/__tests__/**/*.test.tsx`

**ESLint:**
- No `.eslintrc` or `eslint.config.mjs` file found
- Default rules apply (ESLint base + TypeScript)
- Invoked via `npm run lint` on `src/` with `--ext .ts,.tsx`

**npm Scripts:**
- `prebuild` - Runs `scripts/sync-version.js` before build (sync package.json version to `src/version.ts`)
- `build` - `webpack --mode production` → creates optimized dist/
- `dev` - `webpack --mode development --watch` → continuous build during development
- `lint` - `eslint src --ext .ts,.tsx`
- `type-check` - `tsc --noEmit` → type checking without output
- `test` - `jest` → runs test suite
- `package` - `npm run build && node scripts/package.js` → zips dist/ to `.ccx` (Adobe plugin format)
- `release:*` - Bumps version, packages, and tags release

**Packaging & Release:**
- Plugin output format: `.ccx` (ZIP archive with UXP manifest)
- Distribution: GitHub Releases (checked via `checkForUpdates()` against `api.github.com`)
- Script: `scripts/package.js` zips `dist/` to `releases/GuideMyGrid-vX.Y.Z.ccx`

## Platform Requirements

**Development:**
- Node.js LTS (18+ recommended)
- npm
- macOS or Windows with a text editor / IDE
- TypeScript 5.x knowledge preferred

**Production (Runtime):**
- Adobe Photoshop 2022+ (API v2 required; `manifest.json` specifies `minVersion: 22.0.0`)
- UXP plugin host with network permission to `https://api.github.com` (for update checks)
- Photoshop must have the `.ccx` file installed via Plugin Manager or drag-and-drop

---

*Stack analysis: 2026-07-04*
