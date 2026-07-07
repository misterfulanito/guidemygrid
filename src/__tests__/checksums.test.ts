/* eslint-disable @typescript-eslint/no-var-requires */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';

const { hashFile, formatChecksumLine } = require('../../release/checksums.js');

describe('release/checksums.js (INTEG-02, D-05/D-06)', () => {
  it('formatChecksumLine joins digest and filename with exactly two spaces', () => {
    const line = formatChecksumLine('e3b0c4...', 'GuideMyGrid-v1.2.3.ccx');
    expect(line).toBe('e3b0c4...  GuideMyGrid-v1.2.3.ccx');
    expect(line.split('  ').length).toBe(2);
    expect(line).not.toContain('\t');
    // No single-space-only separator: replacing the two-space run should leave no
    // remaining lone space between digest and filename.
    expect(line.replace('  ', '|').includes(' ')).toBe(false);
  });

  it('hashFile resolves to the correct lowercase-hex SHA256 of an empty file', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'checksums-test-'));
    const emptyFile = path.join(tmpDir, 'empty.txt');
    fs.writeFileSync(emptyFile, '');

    const digest = await hashFile(emptyFile);
    expect(digest).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('hashFile resolves to a correct SHA256 for known non-empty content', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'checksums-test-'));
    const contentFile = path.join(tmpDir, 'content.txt');
    const content = 'GuideMyGrid checksum fixture\n';
    fs.writeFileSync(contentFile, content);

    const expected = crypto.createHash('sha256').update(content).digest('hex');
    const digest = await hashFile(contentFile);
    expect(digest).toBe(expected);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('importing the module does not execute main() (require.main guard)', () => {
    // If main() ran on require, it would throw (releases/ artifacts for this
    // package's version won't exist in the test environment) and this require
    // at the top of the file would already have failed the whole test file.
    const checksums = require('../../release/checksums.js');
    expect(typeof checksums.hashFile).toBe('function');
    expect(typeof checksums.formatChecksumLine).toBe('function');
  });
});
