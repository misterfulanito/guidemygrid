// src/__tests__/manifest-permissions.test.ts
import * as fs from 'fs';
import * as path from 'path';

describe('manifest network permission (UPD-03, D-01/D-03)', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../manifest.json'), 'utf8')
  );

  it('declares requiredPermissions.network.domains as exactly ["https://api.github.com"]', () => {
    expect(manifest.requiredPermissions.network.domains).toEqual(['https://api.github.com']);
  });

  it('does not broaden network access to the wildcard scope', () => {
    expect(manifest.requiredPermissions.network.domains).not.toContain('all');
    expect(manifest.requiredPermissions.network.domains.length).toBe(1);
  });
});
