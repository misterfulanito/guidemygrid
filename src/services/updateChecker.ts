// src/services/updateChecker.ts

const PLUGIN_VERSION = '1.0.0'; // Sincronizar con manifest.json en cada release
const GITHUB_REPO = 'misterfulanito/guidemygrid';

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes?: string;
}

export async function checkForUpdates(): Promise<UpdateInfo | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );
    if (!response.ok) return null;

    const release = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, '');
    const hasUpdate = compareVersions(latestVersion, PLUGIN_VERSION) > 0;
    const ccxAsset = release.assets?.find((a: { name: string; browser_download_url: string }) =>
      a.name.endsWith('.ccx')
    );

    return {
      hasUpdate,
      latestVersion,
      downloadUrl: ccxAsset?.browser_download_url ?? release.html_url,
      releaseNotes: release.body,
    };
  } catch {
    return null; // Falla silenciosa — nunca bloquear si no hay red
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
