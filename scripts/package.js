/**
 * package.js
 * Creates two release artifacts in releases/:
 *   1. GuideMyGrid-vX.Y.Z.ccx          — Creative Cloud installation (double-click)
 *   2. GuideMyGrid-vX.Y.Z-installer.zip — Direct installation, no Creative Cloud needed
 *
 * Usage: node scripts/package.js  (or via `npm run package`)
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const root    = path.resolve(__dirname, '..');
const pkg     = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const distDir = path.join(root, 'dist');
const outDir  = path.join(root, 'releases');

const ccxFile       = path.join(outDir, `GuideMyGrid-v${version}.ccx`);
const installerFile = path.join(outDir, `GuideMyGrid-v${version}-installer.zip`);

// Files to skip in all packages
const JUNK = new Set(['.DS_Store', '__MACOSX', 'Thumbs.db', '.gitkeep']);
function shouldSkip(name) { return JUNK.has(name) || name.startsWith('.'); }

// Recursively copy a directory, skipping junk files
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

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(ccxFile))       fs.unlinkSync(ccxFile);
if (fs.existsSync(installerFile)) fs.unlinkSync(installerFile);

const EXCLUDE = '-x "*.DS_Store" -x "*/__MACOSX" -x "*/Thumbs.db"';

// ── 1. CCX (Creative Cloud) ───────────────────────────────────────────────────
// Zip dist/ contents directly so manifest.json sits at the zip root
execSync(`cd "${distDir}" && zip -r "${ccxFile}" . ${EXCLUDE}`, { stdio: 'inherit' });
console.log(`✅  CCX:       releases/GuideMyGrid-v${version}.ccx`);

// ── 2. Installer zip (no Creative Cloud required) ────────────────────────────
const tmpDir = path.join(root, '.tmp-installer');
if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });

copyDir(distDir, path.join(tmpDir, 'dist'));

const scripts = ['install.sh', 'install.bat', 'install.ps1', 'uninstall.bat', 'uninstall.ps1'];
for (const s of scripts) {
  fs.copyFileSync(path.join(root, 'scripts', s), path.join(tmpDir, s));
}

// Preserve executable bit on the shell script
try { fs.chmodSync(path.join(tmpDir, 'install.sh'), 0o755); } catch (_) {}

execSync(`cd "${tmpDir}" && zip -r "${installerFile}" . ${EXCLUDE}`, { stdio: 'inherit' });
fs.rmSync(tmpDir, { recursive: true });
console.log(`✅  Installer: releases/GuideMyGrid-v${version}-installer.zip`);

console.log('\n→  .ccx            — install via Creative Cloud (double-click)');
console.log('→  -installer.zip  — install directly, no Creative Cloud needed\n');

// ── 3. macOS PKG installer + uninstaller (no terminal, no Creative Cloud) ─────
if (process.platform === 'darwin') {
  execSync('node scripts/build-mac-pkg.js', { stdio: 'inherit', cwd: root });
  execSync('node scripts/build-mac-uninstaller.js', { stdio: 'inherit', cwd: root });
}

// ── 4. Stage all release files so the publish script can commit + push them ───
const toStage = [ccxFile, installerFile];
const pkgFile        = path.join(outDir, `GuideMyGrid-v${version}.pkg`);
const uninstallerFile = path.join(outDir, `GuideMyGrid-v${version}-uninstaller.pkg`);
if (fs.existsSync(pkgFile))         toStage.push(pkgFile);
if (fs.existsSync(uninstallerFile)) toStage.push(uninstallerFile);
execSync(`git add ${toStage.map(f => `"${f}"`).join(' ')}`, { stdio: 'inherit', cwd: root });
