// src/services/updateChecker.ts
import { VERSION as PLUGIN_VERSION } from '../version';

const GITHUB_REPO  = 'misterfulanito/guidemygrid';
const SEMVER_RE    = /^\d+\.\d+\.\d+$/;
const ALLOWED_URL  = `https://github.com/${GITHUB_REPO}/`;

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes?: string;
}

// ── Schema validation ─────────────────────────────────────────────────────────

function isSafeUrl(url: unknown): url is string {
  return typeof url === 'string' && url.startsWith(ALLOWED_URL);
}

function validateRelease(data: unknown): {
  tag_name: string;
  html_url: string;
  body?: string;
  assets?: Array<{ name: string; browser_download_url: string }>;
} {
  if (!data || typeof data !== 'object') throw new Error('Invalid response shape');

  const r = data as Record<string, unknown>;

  if (typeof r.tag_name !== 'string') throw new Error('Missing tag_name');
  if (typeof r.html_url !== 'string') throw new Error('Missing html_url');

  const version = r.tag_name.replace(/^v/, '');
  if (!SEMVER_RE.test(version))         throw new Error('tag_name is not semver');
  if (!isSafeUrl(r.html_url))           throw new Error('html_url outside allowed domain');

  if (r.assets !== undefined && !Array.isArray(r.assets)) throw new Error('assets must be an array');

  return r as ReturnType<typeof validateRelease>;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function checkForUpdates(): Promise<UpdateInfo | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );
    if (!response.ok) return null;

    const release = validateRelease(await response.json());

    const latestVersion = release.tag_name.replace(/^v/, '');
    const hasUpdate     = compareVersions(latestVersion, PLUGIN_VERSION) > 0;

    const ccxAsset = release.assets?.find(
      (a) => a.name.endsWith('.ccx') && isSafeUrl(a.browser_download_url)
    );

    // Only use asset URL if it passes the domain check; fall back to html_url (already validated)
    const downloadUrl = ccxAsset?.browser_download_url ?? release.html_url;

    return { hasUpdate, latestVersion, downloadUrl, releaseNotes: release.body };
  } catch {
    return null; // Silent failure — never block the UI on network issues
  }
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return 1;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return -1;
  }
  return 0;
}
