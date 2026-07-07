import * as fs from 'fs';
import * as path from 'path';

describe('Windows installer retirement (Phase 2, D-03)', () => {
  const windowsDir = path.resolve(__dirname, '../../distribution/photoshop/windows');
  const retiredFiles = ['install.bat', 'install.ps1', 'install.sh', 'uninstall.bat', 'uninstall.ps1'];

  it.each(retiredFiles)('%s should not exist (retired per D-03)', (file) => {
    expect(fs.existsSync(path.join(windowsDir, file))).toBe(false);
  });

  it('scripts/package.js should not reference any retired Windows script', () => {
    const packageJs = fs.readFileSync(
      path.resolve(__dirname, '../../scripts/package.js'),
      'utf8'
    );
    for (const file of retiredFiles) {
      expect(packageJs).not.toContain(file);
    }
  });
});
