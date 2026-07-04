// distribution/photoshop/macos/__tests__/manifest.test.ts
// Integration test for MAC-02: install-payload.sh must copy a source plugin dir
// into every existing PluginsStorage/PHSP version dir and write a manifest
// listing exactly the paths it created. Sandboxes a fake $GMG_INSTALL_BASE and
// $GMG_MANIFEST_PATH via a temp directory — never touches the real $HOME.

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const SCRIPT_PATH = path.join(process.cwd(), 'distribution/photoshop/macos/install-payload.sh');
const PLUGIN_ID = 'com.guidemygrid.plugin';

describe('install-payload.sh — manifest (MAC-02)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gmg-install-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function makeFixture() {
    const srcDir = path.join(tmpDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'index.js'), '// plugin entry\n');
    fs.writeFileSync(path.join(srcDir, 'manifest.json'), '{"id":"com.guidemygrid.plugin"}\n');

    const baseDir = path.join(tmpDir, 'PHSP');
    fs.mkdirSync(path.join(baseDir, '23'), { recursive: true });

    const manifestPath = path.join(tmpDir, 'meta', 'install-manifest.json');

    return { srcDir, baseDir, manifestPath };
  }

  test('copies source into the version dir and writes a manifest listing every created path', () => {
    const { srcDir, baseDir, manifestPath } = makeFixture();

    const output = execSync(`/bin/sh "${SCRIPT_PATH}" "${srcDir}" 1.7.0`, {
      env: { ...process.env, GMG_INSTALL_BASE: baseDir, GMG_MANIFEST_PATH: manifestPath },
      encoding: 'utf8',
    });

    expect(output.trim()).toBe(manifestPath);
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.pluginId).toBe(PLUGIN_ID);
    expect(manifest.version).toBe('1.7.0');
    expect(typeof manifest.installedAt).toBe('string');
    expect(Array.isArray(manifest.paths)).toBe(true);

    const pluginDir = path.join(baseDir, '23', 'Plugin', PLUGIN_ID);
    const copiedIndex = path.join(pluginDir, 'index.js');
    const copiedManifest = path.join(pluginDir, 'manifest.json');

    expect(manifest.paths).toContain(pluginDir);
    expect(manifest.paths).toContain(copiedIndex);
    expect(manifest.paths).toContain(copiedManifest);

    for (const p of manifest.paths as string[]) {
      expect(fs.existsSync(p)).toBe(true);
    }

    expect(fs.existsSync(copiedIndex)).toBe(true);
    expect(fs.existsSync(copiedManifest)).toBe(true);
  });

  test('copies into ALL existing version subdirs, not just one', () => {
    const { srcDir, baseDir, manifestPath } = makeFixture();
    fs.mkdirSync(path.join(baseDir, '24'), { recursive: true });

    execSync(`/bin/sh "${SCRIPT_PATH}" "${srcDir}" 1.7.0`, {
      env: { ...process.env, GMG_INSTALL_BASE: baseDir, GMG_MANIFEST_PATH: manifestPath },
      encoding: 'utf8',
    });

    const plugin23 = path.join(baseDir, '23', 'Plugin', PLUGIN_ID, 'index.js');
    const plugin24 = path.join(baseDir, '24', 'Plugin', PLUGIN_ID, 'index.js');
    expect(fs.existsSync(plugin23)).toBe(true);
    expect(fs.existsSync(plugin24)).toBe(true);
  });

  test('exits non-zero when the source dir is missing', () => {
    const { baseDir, manifestPath } = makeFixture();
    const missingSrc = path.join(tmpDir, 'does-not-exist');

    expect(() => {
      execSync(`/bin/sh "${SCRIPT_PATH}" "${missingSrc}" 1.7.0`, {
        env: { ...process.env, GMG_INSTALL_BASE: baseDir, GMG_MANIFEST_PATH: manifestPath },
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    }).toThrow();
  });

  test('exits non-zero when GMG_INSTALL_BASE is a relative path', () => {
    const { srcDir, manifestPath } = makeFixture();

    expect(() => {
      execSync(`/bin/sh "${SCRIPT_PATH}" "${srcDir}" 1.7.0`, {
        env: { ...process.env, GMG_INSTALL_BASE: 'relative/PHSP', GMG_MANIFEST_PATH: manifestPath },
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    }).toThrow();
  });

  test('exits non-zero when no version subdir exists under the base', () => {
    const { srcDir, manifestPath } = makeFixture();
    const emptyBase = path.join(tmpDir, 'EmptyPHSP');
    fs.mkdirSync(emptyBase, { recursive: true });

    expect(() => {
      execSync(`/bin/sh "${SCRIPT_PATH}" "${srcDir}" 1.7.0`, {
        env: { ...process.env, GMG_INSTALL_BASE: emptyBase, GMG_MANIFEST_PATH: manifestPath },
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    }).toThrow();
  });
});
