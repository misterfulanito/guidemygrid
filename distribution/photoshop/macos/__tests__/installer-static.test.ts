// distribution/photoshop/macos/__tests__/installer-static.test.ts
// Static/grep-based validation for MAC-01 (no elevation) and MAC-04 (absolute paths only).
// Scans distribution/photoshop/macos/ for every .sh and .applescript file. When
// Plan 04 adds installer.applescript, this same test automatically covers it.

import * as fs from 'fs';
import * as path from 'path';

const MACOS_DIR = path.join(process.cwd(), 'distribution/photoshop/macos');

function listFilesRecursive(dir: string, excludeDirNames: string[] = []): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (excludeDirNames.includes(entry.name)) continue;
      files = files.concat(listFilesRecursive(path.join(dir, entry.name), excludeDirNames));
    } else if (entry.isFile()) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

describe('macOS installer static checks', () => {
  test('MAC-04: every .applescript "do shell script" call uses an absolute path', () => {
    const scriptFiles = listFilesRecursive(MACOS_DIR).filter((f) => f.endsWith('.applescript'));

    for (const file of scriptFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const offendingLines = content
        .split('\n')
        .filter((line) => line.includes('do shell script'))
        .filter((line) => !/do shell script\s+"\s*\//.test(line));

      expect(offendingLines.join('\n')).toBe('');
    }
  });

  test('MAC-04: every .sh script sets an explicit clean PATH and never sources shell rc files', () => {
    const shFiles = listFilesRecursive(MACOS_DIR).filter((f) => f.endsWith('.sh'));

    for (const file of shFiles) {
      const content = fs.readFileSync(file, 'utf8');

      expect(content.includes('PATH=/usr/bin:/bin')).toBe(true);

      const rcSourcingPattern =
        /(^|\n)\s*(source\s+|\.\s+)[^\n]*\.(bashrc|zshenv|zshrc|profile)\b/;
      expect(rcSourcingPattern.test(content)).toBe(false);
    }
  });

  test('MAC-01: no package-installer or privilege-escalation tokens in installer logic under distribution/photoshop/macos (excluding __tests__)', () => {
    // Scoped to executable installer logic (.sh/.applescript), not documentation
    // (READMEs legitimately reference these tokens in prose to describe what
    // this rework replaces — e.g. "no sudo, no pkgbuild"). MAC-01's actual
    // requirement is that installer *behavior* never invokes these, not that
    // the words never appear anywhere in the directory.
    const allFiles = listFilesRecursive(MACOS_DIR, ['__tests__']).filter(
      (f) => f.endsWith('.sh') || f.endsWith('.applescript')
    );
    const forbiddenTokens = ['pkgbuild', 'productbuild', 'sudo'];

    const offenders: string[] = [];
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf8');
      for (const token of forbiddenTokens) {
        if (content.includes(token)) {
          offenders.push(`${file}: ${token}`);
        }
      }
    }

    expect(offenders.join('\n')).toBe('');
  });
});
