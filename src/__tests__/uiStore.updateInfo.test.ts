// src/__tests__/uiStore.updateInfo.test.ts
import { useUIStore } from '../store';
import { UpdateInfo } from '../services/updateChecker';

const fixture: UpdateInfo = {
  hasUpdate: true,
  latestVersion: '9.9.9',
  downloadUrl: 'https://github.com/misterfulanito/guidemygrid/releases/latest',
};

describe('uiStore update state (UPD-03)', () => {
  afterEach(() => {
    useUIStore.getState().dismissUpdate();
  });

  it('initial updateInfo is null', () => {
    expect(useUIStore.getState().updateInfo).toBeNull();
  });

  it('setUpdateInfo stores the info object', () => {
    useUIStore.getState().setUpdateInfo(fixture);
    expect(useUIStore.getState().updateInfo).toEqual(fixture);
  });

  it('dismissUpdate clears updateInfo back to null', () => {
    useUIStore.getState().setUpdateInfo(fixture);
    useUIStore.getState().dismissUpdate();
    expect(useUIStore.getState().updateInfo).toBeNull();
  });
});
