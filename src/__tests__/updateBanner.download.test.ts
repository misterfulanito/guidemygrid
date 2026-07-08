// src/__tests__/updateBanner.download.test.ts
import * as fs from 'fs';
import * as path from 'path';

describe('UpdateBanner manual-download flow (UPD-02)', () => {
  const bannerSource = fs.readFileSync(
    path.resolve(__dirname, '../components/shared/UpdateBanner.tsx'),
    'utf8'
  );

  it('invokes shell.openExternal (manual browser download)', () => {
    expect(bannerSource).toContain('openExternal');
  });

  it('does not contain a filesystem-write call', () => {
    expect(bannerSource).not.toContain('writeFile');
  });

  it('does not contain a Node fs require (no in-app install surface)', () => {
    expect(bannerSource).not.toContain("require('fs')");
  });
});
