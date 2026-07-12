import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repo = process.argv[2];
const remote = process.argv[3];
if (!repo || !remote) throw new Error('Usage: node tools/codex01-audit.mjs <repo> <remote>');

const localDir = path.join(repo, 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script');
const auditDir = path.join(repo, 'audit');
await mkdir(auditDir, { recursive: true });

const sha = (text) => createHash('sha256').update(text).digest('hex');
const lines = (text) => text.split(/\r?\n/).length;
const functions = (text) => [...text.matchAll(/(?:^|\n)\s*function\s+([A-Za-z_$][\w$]*)\s*\(/g)]
  .map((match) => match[1]);
const unique = (values) => [...new Set(values)].sort();
const apiSignals = (text) => ({
  SpreadsheetApp: (text.match(/\bSpreadsheetApp\b/g) || []).length,
  UrlFetchApp: (text.match(/\bUrlFetchApp\b/g) || []).length,
  CacheService: (text.match(/\bCacheService\b/g) || []).length,
  LockService: (text.match(/\bLockService\b/g) || []).length,
  PropertiesService: (text.match(/\bPropertiesService\b/g) || []).length,
});

async function inventory(dir, source) {
  const names = (await readdir(dir)).filter((name) => /\.(gs|js|json|html)$/i.test(name)).sort();
  const result = [];
  for (const name of names) {
    const file = path.join(dir, name);
    const text = await readFile(file, 'utf8');
    const info = await stat(file);
    result.push({ name, extension: path.extname(name).slice(1), size: info.size, sha256: sha(text), source });
  }
  return result;
}

const localInventory = await inventory(localDir, 'local');
const remoteInventory = await inventory(remote, 'remote');
const allInventory = [...localInventory, ...remoteInventory];
const bySourceName = new Map(allInventory.map((item) => [`${item.source}:${item.name}`, item]));
for (const item of allInventory) {
  const base = path.basename(item.name, path.extname(item.name));
  const pairExt = item.extension === 'gs' ? 'js' : item.extension === 'js' ? 'gs' : null;
  item.hasPair = pairExt ? bySourceName.has(`${item.source}:${base}.${pairExt}`) : false;
  const remoteName = item.extension === 'gs' ? `${base}.js` : item.name;
  const counterpart = item.source === 'local'
    ? bySourceName.get(`remote:${remoteName}`)
    : bySourceName.get(`local:${item.extension === 'js' ? `${base}.gs` : item.name}`);
  item.matchesCounterpart = counterpart ? counterpart.sha256 === item.sha256 : null;
}

await writeFile(path.join(auditDir, 'remote_baseline_inventory.json'), JSON.stringify(allInventory, null, 2) + '\n');
const inventoryMd = ['# Remote Baseline Inventory', '', `Remote folder: \`${remote}\``, '',
  '| Source | File | Ext | Size | SHA-256 | Pair | Matches counterpart |',
  '|---|---|---:|---:|---|---|---|',
  ...allInventory.map((x) => `| ${x.source} | ${x.name} | ${x.extension} | ${x.size} | ${x.sha256} | ${x.hasPair} | ${x.matchesCounterpart ?? 'n/a'} |`), ''];
await writeFile(path.join(auditDir, 'remote_baseline_inventory.md'), inventoryMd.join('\n'));

const localNames = new Set(localInventory.map((x) => x.name));
const stems = unique([...localNames].filter((name) => name.endsWith('.gs')).map((name) => name.slice(0, -3)));
const pairs = [];
for (const baseName of stems) {
  const gsName = `${baseName}.gs`;
  const jsName = `${baseName}.js`;
  if (!localNames.has(jsName)) continue;
  const gsText = await readFile(path.join(localDir, gsName), 'utf8');
  const jsText = await readFile(path.join(localDir, jsName), 'utf8');
  const gsFunctions = unique(functions(gsText));
  const jsFunctions = unique(functions(jsText));
  const gsOnly = gsFunctions.filter((x) => !jsFunctions.includes(x));
  const jsOnly = jsFunctions.filter((x) => !gsFunctions.includes(x));
  let classification = 'DIVERGED';
  if (gsText === jsText) classification = 'IDENTICAL';
  else if (!jsOnly.length && (gsOnly.length || gsText.length >= jsText.length)) classification = 'GS_SUPERSET';
  else if (!gsOnly.length && (jsOnly.length || jsText.length > gsText.length)) classification = 'JS_SUPERSET';
  const signalGs = apiSignals(gsText);
  const signalJs = apiSignals(jsText);
  const signalDiff = Object.fromEntries(Object.keys(signalGs).map((key) => [key, signalGs[key] - signalJs[key]]));
  const remoteItem = bySourceName.get(`remote:${baseName}.js`);
  pairs.push({
    baseName, gsPath: path.join(localDir, gsName), jsPath: path.join(localDir, jsName),
    gsSha256: sha(gsText), jsSha256: sha(jsText), identical: gsText === jsText,
    gsLines: lines(gsText), jsLines: lines(jsText), gsOnlyFunctions: gsOnly, jsOnlyFunctions: jsOnly,
    publicEntryPointDifference: gsOnly.filter((x) => /^TI_|^on(Open|Edit)$/.test(x)).concat(jsOnly.filter((x) => /^TI_|^on(Open|Edit)$/.test(x))),
    apiSignalDeltaGsMinusJs: signalDiff,
    localVersion: classification, remoteVersion: remoteItem?.sha256 === sha(gsText) ? 'matches_local_gs' : 'differs_from_local_gs',
    recommendedCanonicalSource: classification === 'JS_SUPERSET' ? 'REQUIRES_MANUAL_DECISION' : 'GS',
    risk: classification === 'IDENTICAL' ? 'LOW' : classification === 'GS_SUPERSET' ? 'MEDIUM' : 'HIGH',
    safeToArchiveJs: classification === 'IDENTICAL', requiresUserDecision: classification !== 'IDENTICAL', classification,
    commentVersionDifferences: 'See hashes and line counts; semantic review required for non-identical pairs.',
    businessLogicDifferences: classification === 'IDENTICAL' ? 'none' : 'potential; requires semantic review',
  });
}
await writeFile(path.join(auditDir, 'gs_js_diff.json'), JSON.stringify(pairs, null, 2) + '\n');
const pairsMd = ['# GS / JS Diff', '',
  '| Base | Class | GS lines | JS lines | GS-only functions | JS-only functions | Remote | Risk | Archive JS | Decision |',
  '|---|---|---:|---:|---|---|---|---|---|---|',
  ...pairs.map((x) => `| ${x.baseName} | ${x.classification} | ${x.gsLines} | ${x.jsLines} | ${x.gsOnlyFunctions.join(', ') || '—'} | ${x.jsOnlyFunctions.join(', ') || '—'} | ${x.remoteVersion} | ${x.risk} | ${x.safeToArchiveJs} | ${x.requiresUserDecision} |`), '',
  'Non-identical pairs require semantic review before any legacy `.js` archival or removal.', ''];
await writeFile(path.join(auditDir, 'gs_js_diff.md'), pairsMd.join('\n'));

const canonicalNames = (await readdir(localDir)).filter((name) => name.endsWith('.gs')).sort();
const registry = [];
for (const file of canonicalNames) {
  const text = await readFile(path.join(localDir, file), 'utf8');
  const rows = text.split(/\r?\n/);
  for (let index = 0; index < rows.length; index++) {
    const match = rows[index].match(/^\s*function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (!match) continue;
    const name = match[1];
    const callPattern = new RegExp(`\\b${name.replace(/[$]/g, '\\$&')}\\s*\\(`, 'g');
    let callCount = 0;
    for (const other of canonicalNames) {
      const otherText = await readFile(path.join(localDir, other), 'utf8');
      callCount += (otherText.match(callPattern) || []).length;
    }
    registry.push({ name, file, line: index + 1,
      type: name === 'onOpen' || name === 'onEdit' ? 'trigger' : /^TI_Remote/.test(name) ? 'remote_entry' : /^TI_Test/.test(name) ? 'test' : /^TI_/.test(name) ? 'public_wrapper' : 'unknown',
      callCountIncludingDefinition: callCount, needsGlobalVisibility: /^TI_|^on(Open|Edit)$/.test(name), recommendedOwner: file });
  }
}
const nameCounts = Object.fromEntries(registry.map((x) => [x.name, registry.filter((y) => y.name === x.name).length]));
for (const entry of registry) { entry.definitionCount = nameCounts[entry.name]; entry.duplicate = entry.definitionCount > 1; }
await writeFile(path.join(auditDir, 'top_level_functions.json'), JSON.stringify(registry, null, 2) + '\n');
const functionMd = ['# Top-level Functions', '', '| Name | File:line | Type | Definitions | Calls* | Global | Duplicate | Owner |', '|---|---|---|---:|---:|---|---|---|',
  ...registry.map((x) => `| ${x.name} | ${x.file}:${x.line} | ${x.type} | ${x.definitionCount} | ${x.callCountIncludingDefinition} | ${x.needsGlobalVisibility} | ${x.duplicate} | ${x.recommendedOwner} |`), '',
  '\* Static calls include the declaration match; Apps Script/UI/deployment calls may be dynamic.', ''];
await writeFile(path.join(auditDir, 'top_level_functions.md'), functionMd.join('\n'));

const dead = ['# Dead Code Findings', '', 'No code removed.', '',
  'Static absence of callers is not treated as proof of dead code because Apps Script menus, triggers, deployments and HTML may call global functions dynamically.', ''];
await writeFile(path.join(auditDir, 'dead_code_findings.md'), dead.join('\n'));

const pushSet = canonicalNames.concat(['TokenDialog.html', 'appsscript.json']).sort();
await writeFile(path.join(auditDir, 'clasp_push_set.txt'), pushSet.join('\n') + '\n');
