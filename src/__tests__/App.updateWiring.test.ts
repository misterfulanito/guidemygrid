// src/__tests__/App.updateWiring.test.ts
import * as fs from 'fs';
import * as path from 'path';

describe('App update-checker wiring (UPD-03)', () => {
  const appSource = fs.readFileSync(path.resolve(__dirname, '../App.tsx'), 'utf8');

  it('imports checkForUpdates from the update checker service', () => {
    expect(appSource).toContain("from './services/updateChecker'");
  });

  it('calls checkForUpdates(', () => {
    expect(appSource).toContain('checkForUpdates(');
  });

  it('renders <UpdateBanner', () => {
    expect(appSource).toContain('<UpdateBanner');
  });
});
