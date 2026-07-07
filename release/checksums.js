/**
 * release/checksums.js
 * Generates SHA256 checksums for this version's release artifacts and writes
 * releases/SHA256SUMS.txt (standard `shasum -a 256 -c` text-mode format).
 * Runs automatically after the .ccx build, as part of npm run package/publish:*.
 *
 * This is the release-automation-scripts directory. Built binary artifacts
 * live in releases/ (plural) — do not confuse the two.
 */

const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');
const root   = path.resolve(__dirname, '..');

const pkg      = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version  = pkg.version;
const outDir   = path.join(root, 'releases');
const sumsFile = path.join(outDir, 'SHA256SUMS.txt');

// ── hashFile ─────────────────────────────────────────────────────────────────
// Streams the file through crypto's SHA256 hash — memory-safe for artifacts of
// any size, never loads the whole file into memory at once.
function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash   = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// ── formatChecksumLine ───────────────────────────────────────────────────────
// `shasum -a 256 -c` text mode requires exactly TWO space characters between
// the hex digest and a bare (non-absolute) filename — a single space silently
// fails to parse (see 03-RESEARCH.md Pitfall 1).
function formatChecksumLine(digest, filename) {
  return `${digest}  ${filename}`;
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Only hash this version's release artifacts, never a stale SHA256SUMS.txt
  // (or another version's leftovers) from a prior run.
  const artifacts = fs.readdirSync(outDir)
    .filter((name) => name.startsWith(`GuideMyGrid-v${version}`) && name !== 'SHA256SUMS.txt');

  if (artifacts.length === 0) {
    throw new Error(`No release artifacts found in releases/ for version ${version}`);
  }

  const lines = [];
  for (const name of artifacts.sort()) {
    const digest = await hashFile(path.join(outDir, name));
    lines.push(formatChecksumLine(digest, name));
  }

  // LF only (never CRLF) — Pitfall 1.
  fs.writeFileSync(sumsFile, lines.join('\n') + '\n');
  console.log(`✅  Checksums: releases/SHA256SUMS.txt (${artifacts.length} artifact${artifacts.length === 1 ? '' : 's'})`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { hashFile, formatChecksumLine };
