/**
 * distribution/photoshop/build-ccx.js
 * Zips dist/ into releases/GuideMyGrid-v<version>.ccx, matching the exact
 * structure Creative Cloud Desktop actually expects: a top-level dist/
 * folder inside the zip (confirmed by direct inspection of a real shipping
 * competitor's .ccx — see 01-RESEARCH.md's follow-up addendum), not dist/'s
 * contents sitting at the zip root.
 *
 * Lives directly under distribution/photoshop/ (not macos/ or windows/)
 * because .ccx packaging is identical on both platforms — unlike the
 * retired .app/.dmg build, it is not an OS-specific mechanism.
 *
 * Usage: node distribution/photoshop/build-ccx.js  (or via `npm run package:ccx`)
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const root    = path.resolve(__dirname, '..', '..');
const pkg     = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const distDir = path.join(root, 'dist');
const outDir  = path.join(root, 'releases');
const ccxFile = path.join(outDir, `GuideMyGrid-v${version}.ccx`);

// Files to skip when staging dist/ into the zip
const JUNK = new Set(['.DS_Store', '__MACOSX', 'Thumbs.db', '.gitkeep']);
function shouldSkip(name) { return JUNK.has(name) || name.startsWith('.'); }

// Recursively copy a directory, skipping junk files (matches scripts/package.js's copyDir convention)
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    if (shouldSkip(entry)) continue;
    const srcPath  = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Ensure dist/ exists — build it first if this is a fresh checkout
if (!fs.existsSync(distDir)) {
  execSync('npm run build', { stdio: 'inherit', cwd: root });
}

// 2. Clear out any .ccx left over from a previous run
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(ccxFile)) fs.unlinkSync(ccxFile);

// 3. Stage dist/'s contents under a `dist/` subfolder name so the zip's own
//    top-level entry is `dist/` (manifest.json ends up at dist/manifest.json),
//    not dist/'s contents flattened at the zip root.
const stageDir = path.join(root, '.tmp-ccx');
if (fs.existsSync(stageDir)) fs.rmSync(stageDir, { recursive: true });
copyDir(distDir, path.join(stageDir, 'dist'));

// 4. Zip the staged `dist/` folder itself (not its contents) into the .ccx.
//    Standard zip deflate compression is used here (not `-Z store`) —
//    research found no evidence Creative Cloud Desktop requires a specific
//    compression method to accept the file, but this is worth a quick
//    sanity check if Task 2's manual QA ever surfaces an install problem
//    traceable to it.
execSync(`cd "${stageDir}" && zip -r "${ccxFile}" dist`, { stdio: 'inherit' });

// 5. Clean up the staging directory
fs.rmSync(stageDir, { recursive: true });

console.log(`✅  .ccx: releases/GuideMyGrid-v${version}.ccx`);
