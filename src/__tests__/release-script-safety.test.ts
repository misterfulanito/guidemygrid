import * as fs from 'fs';
import * as path from 'path';

describe('release script safety (Phase 3, INTEG-04)', () => {
  it('build-ccx.js has a zip-availability preflight before the zip -r call', () => {
    const buildCcx = fs.readFileSync(
      path.resolve(__dirname, '../../distribution/photoshop/build-ccx.js'),
      'utf8'
    );
    expect(buildCcx).toContain('command -v zip');
  });

  it('release.yml no longer references the retired installer-zip artifact', () => {
    const releaseYml = fs.readFileSync(
      path.resolve(__dirname, '../../.github/workflows/release.yml'),
      'utf8'
    );
    expect(releaseYml).not.toContain('installer.zip');
    expect(releaseYml).toContain('releases/GuideMyGrid-v*.ccx');
  });
});
