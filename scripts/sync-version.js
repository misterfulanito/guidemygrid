/**
 * sync-version.js
 * Reads version from package.json and writes it to manifest.json + src/version.ts.
 * Runs automatically before every build (prebuild hook).
 */

const fs   = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const pkg      = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version  = pkg.version;

// ── manifest.json ────────────────────────────────────────────────────────────
const manifestPath = path.join(root, 'manifest.json');
const manifest     = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.version   = version;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

// ── src/version.ts ───────────────────────────────────────────────────────────
const versionTsPath = path.join(root, 'src', 'version.ts');
fs.writeFileSync(versionTsPath, `export const VERSION = '${version}';\n`);

console.log(`✅  Version synced → ${version}`);
