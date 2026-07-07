import * as fs from 'fs';
import * as path from 'path';

describe('macOS uninstaller retirement (Phase 3, D-01/D-11)', () => {
  const scriptsDir = path.resolve(__dirname, '../../scripts');
  const retiredFiles = ['build-mac-uninstaller.js', 'pkg-resources/uninstall-preinstall'];

  it.each(retiredFiles)('%s should not exist (retired per D-01)', (file) => {
    expect(fs.existsSync(path.join(scriptsDir, file))).toBe(false);
  });

  it('scripts/package.js should not reference the legacy mac-uninstaller build script', () => {
    const packageJs = fs.readFileSync(path.join(scriptsDir, 'package.js'), 'utf8');
    expect(packageJs).not.toContain('build-mac-uninstaller.js');
  });
});
