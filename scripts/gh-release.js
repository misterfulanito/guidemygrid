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

const files = [
  path.join(root, 'releases', `GuideMyGrid-v${version}.ccx`),
  path.join(root, 'releases', `GuideMyGrid-v${version}-installer.zip`),
  path.join(root, 'releases', `GuideMyGrid-v${version}.pkg`),
].filter(f => fs.existsSync(f));

// Commit the release files (already staged by package.js)
execSync(`git commit -m "chore: release v${version}"`, { stdio: 'inherit', cwd: root });
console.log(`✅  Committed release files`);

// Create GitHub Release — instant, no CI needed
execSync(
  `gh release create ${tag} ${files.map(f => `"${f}"`).join(' ')} --title "GuideMyGrid v${version}" --generate-notes`,
  { stdio: 'inherit', cwd: root }
);
console.log(`✅  GitHub Release published: ${tag}`);
