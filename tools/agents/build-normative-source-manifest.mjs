#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

function sha(bytes) { return createHash('sha256').update(bytes).digest('hex'); }

function walk(root, directory = root, output = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink forbidden: ${path}`);
    if (entry.isDirectory()) walk(root, path, output);
    else if (entry.isFile()) {
      const sourcePath = relative(root, path).replaceAll('\\', '/');
      if (!sourcePath || sourcePath.startsWith('../') || sourcePath.includes('/../')) throw new Error(`Path escape: ${sourcePath}`);
      output.push({ sourcePath, rawSha256: sha(readFileSync(path)) });
    }
  }
  return output;
}

const packageRoot = resolve(process.argv[2] || 'specification/IOS_Master_Specification_v4.0_Package');
const output = resolve(process.argv[3] || 'specification/IOS_Master_Specification_v4.0_Package.manifest.json');
const files = walk(packageRoot).sort((a, b) => a.sourcePath.localeCompare(b.sourcePath, 'en'));
const treeInput = files.map((file) => `${file.sourcePath}\0${file.rawSha256}\n`).join('');
const manifest = {
  schemaVersion: '1.0.0',
  sourceTitle: 'IOS Master Specification v4.0 — Audit Baseline',
  packageRoot: 'specification/IOS_Master_Specification_v4.0_Package',
  ownerProvidedArchiveSha256: 'a8e941965c140c88434dc14804c256b83a87da40ca896c0674be319863ace889',
  archiveEvidenceStatus: 'ACQUISITION_VERIFIED_ARCHIVE_NOT_TRACKED',
  treeAlgorithm: 'Sort sourcePath ordinal; SHA-256 of UTF-8 sourcePath + NUL + rawSha256 + LF records',
  fileCount: files.length,
  treeSha256: sha(Buffer.from(treeInput, 'utf8')),
  files,
};
writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
