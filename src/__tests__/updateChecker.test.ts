// src/__tests__/updateChecker.test.ts
import { checkForUpdates } from '../services/updateChecker';

describe('checkForUpdates (UPD-01, DIST-01, UPD-03)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns hasUpdate: true when GitHub tag_name is newer than PLUGIN_VERSION', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: 'v99.0.0',
        html_url: 'https://github.com/misterfulanito/guidemygrid/releases/tag/v99.0.0',
        assets: [],
      }),
    });

    const info = await checkForUpdates();
    expect(info?.hasUpdate).toBe(true);
    expect(info?.latestVersion).toBe('99.0.0');
  });

  it('rejects a release whose html_url is outside the allowed domain (isSafeUrl)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: 'v1.0.0',
        html_url: 'https://evil.example.com/fake-release',
        assets: [],
      }),
    });

    const info = await checkForUpdates();
    expect(info).toBeNull();
  });

  it('rejects a non-semver tag_name even with an otherwise-valid html_url', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: 'not-a-version',
        html_url: 'https://github.com/misterfulanito/guidemygrid/releases/tag/not-a-version',
        assets: [],
      }),
    });

    const info = await checkForUpdates();
    expect(info).toBeNull();
  });

  it('returns null (never throws) on a non-2xx response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    await expect(checkForUpdates()).resolves.toBeNull();
  });

  it('returns null (never throws) on network failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    await expect(checkForUpdates()).resolves.toBeNull();
  });

  it('falls back to the validated html_url when the matching asset URL is off-domain', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: 'v2.0.0',
        html_url: 'https://github.com/misterfulanito/guidemygrid/releases/tag/v2.0.0',
        assets: [
          {
            name: 'GuideMyGrid-v2.0.0.ccx',
            browser_download_url: 'https://evil.example.com/GuideMyGrid-v2.0.0.ccx',
          },
        ],
      }),
    });

    const info = await checkForUpdates();
    expect(info?.downloadUrl).toBe('https://github.com/misterfulanito/guidemygrid/releases/tag/v2.0.0');
  });
});
