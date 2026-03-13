/**
 * package.js
 * Zips the contents of dist/ and saves it as releases/GuideMyGrid-vX.Y.Z.ccx
 * A .ccx is a standard zip that Photoshop recognises as an installable plugin.
 *
 * Usage: node scripts/package.js   (or via `npm run package`)
 */

const { execSync } = require('child_process');
const fs           = require('fs');
const path         = require('path');
const root         = path.resolve(__dirname, '..');

const pkg      = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version  = pkg.version;
const distDir  = path.join(root, 'dist');
const outDir   = path.join(root, 'releases');
const outFile  = path.join(outDir, `GuideMyGrid-v${version}.ccx`);

// Ensure output dir exists
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Remove previous file for this version if it exists
if (fs.existsSync(outFile)) fs.unlinkSync(outFile);

// Zip contents of dist/ (not the dist folder itself, so manifest.json is at root)
execSync(`cd "${distDir}" && zip -r "${outFile}" .`, { stdio: 'inherit' });

console.log(`\n✅  Package ready: releases/GuideMyGrid-v${version}.ccx`);
console.log('    → Share this file or upload it to a GitHub Release.\n');
