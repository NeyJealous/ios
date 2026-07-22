import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { readdirSync, lstatSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '../..');
const register = JSON.parse(readFileSync(resolve(root, 'specification/NORMATIVE-SOURCE-REGISTER.json'), 'utf8'));

function walk(directory, packageRoot = directory, output = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    assert.equal(lstatSync(path).isSymbolicLink(), false);
    if (entry.isDirectory()) walk(path, packageRoot, output);
    else if (entry.isFile()) output.push({
      sourcePath: path.slice(packageRoot.length + 1).replaceAll('\\', '/'),
      rawSha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
    });
  }
  return output;
}

test('authoritative v4 and target v2.1 sources are versioned without machine paths', () => {
  const v4Root = resolve(root, register.authoritativeBaseline.repositoryRoot);
  const v21 = resolve(root, register.agentPlatformSpecification.repositoryPath);
  assert.equal(existsSync(resolve(v4Root, 'IOS_Master_Specification_v4.0_Audit_Baseline.md')), true);
  assert.equal(existsSync(resolve(v4Root, 'specification/v4.0/20_AGENT_GOVERNANCE.md')), true);
  assert.equal(existsSync(resolve(v4Root, 'specification/v4.0/26_RFC_ADR_GOVERNANCE.md')), true);
  assert.equal(existsSync(v21), true);
  assert.doesNotMatch(JSON.stringify(register), /[A-Za-z]:\\|\/Users\//);
});

test('versioned Agent Platform v2.1 source matches owner-provided SHA-256', () => {
  const bytes = readFileSync(resolve(root, register.agentPlatformSpecification.repositoryPath));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), register.agentPlatformSpecification.sha256);
});

test('v4 extracted package matches deterministic per-file and tree manifest', () => {
  const manifest = JSON.parse(readFileSync(resolve(root, register.authoritativeBaseline.treeManifest), 'utf8'));
  const packageRoot = resolve(root, manifest.packageRoot);
  const files = walk(packageRoot).sort((a, b) => a.sourcePath.localeCompare(b.sourcePath, 'en'));
  assert.deepEqual(files, manifest.files);
  const input = files.map((file) => `${file.sourcePath}\0${file.rawSha256}\n`).join('');
  assert.equal(createHash('sha256').update(Buffer.from(input, 'utf8')).digest('hex'), manifest.treeSha256);
  assert.equal(manifest.ownerProvidedArchiveSha256, register.authoritativeBaseline.ownerProvidedArchiveSha256);
});

test('RFC and ADR remain linked while ADR is not accepted', () => {
  const rfc = readFileSync(resolve(root, register.traceability.rfc), 'utf8');
  const adr = readFileSync(resolve(root, register.traceability.adr), 'utf8');
  assert.match(rfc, /NORMATIVE-SOURCE-REGISTER\.json/);
  assert.match(adr, /DRAFT_NOT_ACCEPTED/);
  assert.match(adr, /NORMATIVE-SOURCE-REGISTER\.json/);
});
