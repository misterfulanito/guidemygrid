/**
 * gh-release.js
 * Commits the new release files and creates a GitHub Release instantly
 * using the local `gh` CLI — no CI wait.
 *
 * Called automatically by publish:patch / publish:minor / publish:major
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const root    = path.resolve(__dirname, '..');
const pkg     = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const tag     = `v${version}`;
const ccx     = path.join(root, 'releases', `GuideMyGrid-v${version}.ccx`);
const zip     = path.join(root, 'releases', `GuideMyGrid-v${version}-installer.zip`);

// Commit the release files (already staged by package.js)
execSync(`git commit -m "chore: release v${version}"`, { stdio: 'inherit', cwd: root });
console.log(`✅  Committed release files`);

// Create GitHub Release with both artifacts — instant, no CI needed
execSync(
  `gh release create ${tag} "${ccx}" "${zip}" --title "GuideMyGrid v${version}" --generate-notes`,
  { stdio: 'inherit', cwd: root }
);
console.log(`✅  GitHub Release published: ${tag}`);
