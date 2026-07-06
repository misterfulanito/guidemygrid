/**
 * build-installer.js
 * Builds an unprivileged macOS installer for GuideMyGrid:
 *   1. Compiles installer.applescript into "Install GuideMyGrid.app" via osacompile
 *      (never elevates — runs entirely as the invoking user).
 *   2. Embeds the built dist/ payload and install-payload.sh into the app bundle.
 *   3. Sets the app's Finder icon from icons/icon-96.png (D-06 — reuse, no new design).
 *   4. Ad-hoc signs the app (no paid Apple Developer cert required).
 *   5. Wraps it in a DMG via create-dmg (--no-code-sign — the app is already signed).
 *
 * Replaces the legacy root-requiring scripts/build-mac-pkg.js.
 *
 * Requires: osacompile, codesign, sips, iconutil (macOS built-ins), create-dmg (devDependency)
 * Platform: macOS only
 *
 * Usage: node distribution/photoshop/macos/build-installer.js
 *        (or via `npm run build:mac-installer`)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..', '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const distDir = path.join(root, 'dist');
const outDir = path.join(root, 'releases');

const APP_NAME = 'Install GuideMyGrid.app';
const dmgFile = path.join(outDir, `GuideMyGrid-v${version}.dmg`);

const tmpDir = path.join(root, '.tmp-mac-installer');
const tmpScript = path.join(tmpDir, 'installer.applescript');
const tmpAppDir = path.join(tmpDir, 'app');
const appPath = path.join(tmpAppDir, APP_NAME);
const iconsetDir = path.join(tmpDir, 'icon.iconset');
const icnsPath = path.join(tmpDir, 'icon.icns');

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
if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
if (fs.existsSync(dmgFile)) fs.unlinkSync(dmgFile);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ── 1. Ensure dist/ exists ───────────────────────────────────────────────────
if (!fs.existsSync(distDir)) {
  execSync('npm run build', { stdio: 'inherit', cwd: root });
}

// ── 2. Compile the .app from installer.applescript, substituting the real
//       version for the __VERSION__ placeholder ─────────────────────────────
fs.mkdirSync(tmpDir, { recursive: true });
const sourceScript = path.join(__dirname, 'installer.applescript');
const sourceContent = fs.readFileSync(sourceScript, 'utf8');
fs.writeFileSync(tmpScript, sourceContent.replace('__VERSION__', version));

fs.mkdirSync(tmpAppDir, { recursive: true });
execSync(`/usr/bin/osacompile -o "${appPath}" "${tmpScript}"`, { stdio: 'inherit', cwd: root });

// ── 3. Embed dist/ and install-payload.sh into Contents/Resources ──────────
const resourcesDir = path.join(appPath, 'Contents', 'Resources');
copyDir(distDir, path.join(resourcesDir, 'plugin'));

const payloadSrc = path.join(__dirname, 'install-payload.sh');
const payloadDest = path.join(resourcesDir, 'install-payload.sh');
fs.copyFileSync(payloadSrc, payloadDest);
fs.chmodSync(payloadDest, 0o755);

// ── 4. Set the app bundle icon from icons/icon-96.png (D-06 — reuse only,
//       no new visual designed) ─────────────────────────────────────────────
const iconSrc = path.join(root, 'icons', 'icon-96.png');
fs.mkdirSync(iconsetDir, { recursive: true });

const ICON_SIZES = [16, 32, 128, 256, 512];
for (const size of ICON_SIZES) {
  execSync(
    `/usr/bin/sips -z ${size} ${size} "${iconSrc}" --out "${path.join(iconsetDir, `icon_${size}x${size}.png`)}"`,
    { stdio: 'inherit' }
  );
  const doubleSize = size * 2;
  execSync(
    `/usr/bin/sips -z ${doubleSize} ${doubleSize} "${iconSrc}" --out "${path.join(iconsetDir, `icon_${size}x${size}@2x.png`)}"`,
    { stdio: 'inherit' }
  );
}

execSync(`/usr/bin/iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`, { stdio: 'inherit' });

// osacompile ships a default applet.icns referenced by Info.plist's
// CFBundleIconFile — overwrite it in place so Finder and dialogs show the
// existing GuideMyGrid icon instead of the generic AppleScript one.
const defaultIcnsPath = path.join(resourcesDir, 'applet.icns');
fs.copyFileSync(icnsPath, defaultIcnsPath);

// On macOS 10.15+, osacompile also emits a compiled asset catalog
// (Assets.car) referenced via Info.plist's CFBundleIconName. When both
// CFBundleIconName/Assets.car and CFBundleIconFile/applet.icns are present,
// the system prefers the asset catalog — so overwriting applet.icns alone
// is silently ignored. Remove Assets.car and the CFBundleIconName key so
// the legacy CFBundleIconFile/applet.icns pairing is the only icon source.
const assetsCarPath = path.join(resourcesDir, 'Assets.car');
if (fs.existsSync(assetsCarPath)) fs.rmSync(assetsCarPath);
const infoPlistPath = path.join(appPath, 'Contents', 'Info.plist');
execSync(`/usr/libexec/PlistBuddy -c "Delete :CFBundleIconName" "${infoPlistPath}"`, { stdio: 'inherit' });

// ── 5. Ad-hoc sign (no paid Apple Developer cert needed) ────────────────────
execSync(`/usr/bin/codesign --force --sign - "${appPath}"`, { stdio: 'inherit' });

// ── 6. Wrap in a DMG ─────────────────────────────────────────────────────────
execSync(
  `npx create-dmg --overwrite --no-version-in-filename --no-code-sign "${appPath}" "${outDir}"`,
  { stdio: 'inherit', cwd: root }
);

const producedDmg = path.join(outDir, `${APP_NAME.replace(/\.app$/, '')}.dmg`);
if (fs.existsSync(producedDmg) && producedDmg !== dmgFile) {
  fs.renameSync(producedDmg, dmgFile);
}

// ── Cleanup ──────────────────────────────────────────────────────────────────
fs.rmSync(tmpDir, { recursive: true });

console.log(`✅  macOS installer: releases/GuideMyGrid-v${version}.dmg`);
