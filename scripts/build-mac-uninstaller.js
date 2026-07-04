/**
 * build-mac-uninstaller.js
 * Builds a macOS .pkg uninstaller for GuideMyGrid.
 * Users double-click → standard macOS installer wizard → plugin removed.
 * No terminal needed.
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
const outDir  = path.join(root, 'releases');
const output  = path.join(outDir, `GuideMyGrid-v${version}-uninstaller.pkg`);

const tmpPayload = path.join(root, '.tmp-uninstall-payload');
const tmpScripts = path.join(root, '.tmp-uninstall-scripts');

// Clean up
[tmpPayload, tmpScripts].forEach(p => {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true });
});
if (fs.existsSync(output)) fs.unlinkSync(output);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Empty payload — the uninstaller only needs the preinstall script
fs.mkdirSync(tmpPayload, { recursive: true });

// Scripts
fs.mkdirSync(tmpScripts, { recursive: true });
const scriptSrc  = path.join(root, 'scripts', 'pkg-resources', 'uninstall-preinstall');
const scriptDest = path.join(tmpScripts, 'preinstall');
fs.copyFileSync(scriptSrc, scriptDest);
fs.chmodSync(scriptDest, 0o755);

// Build
execSync(
  [
    'pkgbuild',
    `--root "${tmpPayload}"`,
    `--scripts "${tmpScripts}"`,
    '--identifier com.guidemygrid.uninstaller',
    `--version ${version}`,
    '--install-location /',
    `"${output}"`,
  ].join(' '),
  { stdio: 'inherit', cwd: root }
);

// Cleanup
fs.rmSync(tmpPayload, { recursive: true });
fs.rmSync(tmpScripts, { recursive: true });

console.log(`✅  macOS Uninstaller: releases/GuideMyGrid-v${version}-uninstaller.pkg`);
