/**
 * build-mac-pkg.js
 * Builds a macOS .pkg installer for GuideMyGrid.
 * Users double-click the .pkg → standard macOS install wizard → done.
 * No terminal, no Creative Cloud required.
 *
 * Requires: pkgbuild (included with Xcode Command Line Tools)
 * Platform: macOS only
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const root    = path.resolve(__dirname, '..');
const pkg     = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const distDir = path.join(root, 'dist');
const outDir  = path.join(root, 'releases');
const output  = path.join(outDir, `GuideMyGrid-v${version}.pkg`);

const tmpPayload = path.join(root, '.tmp-pkg-payload');
const tmpScripts = path.join(root, '.tmp-pkg-scripts');

const JUNK = new Set(['.DS_Store', '__MACOSX', 'Thumbs.db']);
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    if (JUNK.has(entry) || entry.startsWith('.')) continue;
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

// Clean up leftovers from any previous failed run
[tmpPayload, tmpScripts].forEach(p => {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true });
});
if (fs.existsSync(output)) fs.unlinkSync(output);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ── Payload ───────────────────────────────────────────────────────────────────
// Files staged at /Library/Application Support/GuideMyGrid/plugin/
// The postinstall script copies them to the user's UXP folder and cleans up.
const pluginStage = path.join(
  tmpPayload, 'Library', 'Application Support', 'GuideMyGrid', 'plugin'
);
copyDir(distDir, pluginStage);

// ── Scripts ───────────────────────────────────────────────────────────────────
fs.mkdirSync(tmpScripts, { recursive: true });
const postinstallSrc  = path.join(root, 'scripts', 'pkg-resources', 'postinstall');
const postinstallDest = path.join(tmpScripts, 'postinstall');
fs.copyFileSync(postinstallSrc, postinstallDest);
fs.chmodSync(postinstallDest, 0o755);

// ── Build ─────────────────────────────────────────────────────────────────────
execSync(
  [
    'pkgbuild',
    `--root "${tmpPayload}"`,
    `--scripts "${tmpScripts}"`,
    '--identifier com.guidemygrid.installer',
    `--version ${version}`,
    '--install-location /',
    `"${output}"`,
  ].join(' '),
  { stdio: 'inherit', cwd: root }
);

// ── Cleanup ───────────────────────────────────────────────────────────────────
fs.rmSync(tmpPayload, { recursive: true });
fs.rmSync(tmpScripts, { recursive: true });

console.log(`✅  macOS PKG: releases/GuideMyGrid-v${version}.pkg`);
