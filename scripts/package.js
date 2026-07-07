/**
 * package.js
 * Creates the release artifact in releases/:
 *   1. GuideMyGrid-vX.Y.Z.ccx          — Creative Cloud installation (double-click)
 *
 * Usage: node scripts/package.js  (or via `npm run package`)
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const root    = path.resolve(__dirname, '..');
const pkg     = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const outDir  = path.join(root, 'releases');

const ccxFile = path.join(outDir, `GuideMyGrid-v${version}.ccx`);

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(ccxFile)) fs.unlinkSync(ccxFile);

// ── 1. CCX (Creative Cloud) ───────────────────────────────────────────────────
// Delegates to distribution/photoshop/build-ccx.js, which stages dist/ under
// a top-level dist/ folder before zipping — matching the structure Creative
// Cloud Desktop actually expects (see 01-RESEARCH.md's follow-up addendum).
execSync('npm run package:ccx', { stdio: 'inherit', cwd: root });
console.log(`✅  CCX:       releases/GuideMyGrid-v${version}.ccx`);

// ── 2. Stage all release files so the publish script can commit + push them ───
const toStage = [ccxFile];
execSync(`git add ${toStage.map(f => `"${f}"`).join(' ')}`, { stdio: 'inherit', cwd: root });
