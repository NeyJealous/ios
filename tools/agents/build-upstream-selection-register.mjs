#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const PINS = {
  V: { repository: 'VoltAgent/awesome-codex-subagents', commitSha: '5605c9c18b3687993919d6cc467af4a34898fee2', license: 'MIT', licensePath: 'LICENSE', licenseRawSha256: '6d4bdc9a9cf30e7beb593475fdcdbf29f981ea6bd7923f202866145409f87b44', licenseNormalizedSha256: '6d4bdc9a9cf30e7beb593475fdcdbf29f981ea6bd7923f202866145409f87b44' },
  W: { repository: 'wshobson/agents', commitSha: 'b6af3711058190e4b5c5274b9758498fe626ec5a', license: 'MIT', licensePath: 'LICENSE', licenseRawSha256: 'f89abb55d9f073f38f1703e4518f0613c788c6174be7f13b8dfe48a1c076c746', licenseNormalizedSha256: 'f89abb55d9f073f38f1703e4518f0613c788c6174be7f13b8dfe48a1c076c746' },
};

const SELECTED = {
  'data-engineer': ['V:categories/05-data-ai/data-engineer.toml', 'W:plugins/data-engineering/agents/data-engineer.md'],
  'data-scientist': ['V:categories/05-data-ai/data-scientist.toml', 'W:plugins/machine-learning-ops/agents/data-scientist.md', 'W:plugins/machine-learning-ops/agents/ml-engineer.md'],
  'quant-analyst': ['V:categories/07-specialized-domains/quant-analyst.toml', 'W:plugins/quantitative-trading/agents/quant-analyst.md'],
  'risk-manager': ['V:categories/07-specialized-domains/risk-manager.toml', 'W:plugins/quantitative-trading/agents/risk-manager.md'],
  'pit-data-quality-reviewer': ['V:categories/05-data-ai/data-scientist.toml', 'V:categories/05-data-ai/data-engineer.toml', 'W:plugins/machine-learning-ops/agents/data-scientist.md', 'W:plugins/data-engineering/agents/data-engineer.md'],
  'russia-market-regime-economist': ['V:categories/10-research-analysis/research-analyst.toml', 'V:categories/07-specialized-domains/quant-analyst.toml', 'W:plugins/quantitative-trading/agents/quant-analyst.md', 'W:plugins/business-analytics/agents/business-analyst.md'],
  'ios-quant-backtest-auditor': ['V:categories/07-specialized-domains/quant-analyst.toml', 'V:categories/05-data-ai/data-scientist.toml', 'W:plugins/quantitative-trading/agents/quant-analyst.md', 'W:plugins/machine-learning-ops/agents/data-scientist.md'],
  'portfolio-construction-reviewer': ['V:categories/07-specialized-domains/quant-analyst.toml', 'V:categories/07-specialized-domains/risk-manager.toml', 'W:plugins/quantitative-trading/agents/quant-analyst.md', 'W:plugins/quantitative-trading/agents/risk-manager.md'],
  'reserve-cash-management-reviewer': ['V:categories/07-specialized-domains/risk-manager.toml', 'V:categories/07-specialized-domains/quant-analyst.toml', 'V:categories/07-specialized-domains/fintech-engineer.toml', 'W:plugins/quantitative-trading/agents/risk-manager.md', 'W:plugins/quantitative-trading/agents/quant-analyst.md'],
  'fixed-income-bond-reviewer': ['V:categories/07-specialized-domains/quant-analyst.toml', 'V:categories/07-specialized-domains/fintech-engineer.toml', 'W:plugins/quantitative-trading/agents/quant-analyst.md', 'W:plugins/machine-learning-ops/agents/data-scientist.md'],
  'credit-risk-reviewer': ['V:categories/07-specialized-domains/risk-manager.toml', 'V:categories/10-research-analysis/research-analyst.toml', 'W:plugins/quantitative-trading/agents/risk-manager.md', 'W:plugins/business-analytics/agents/business-analyst.md'],
  'performance-attribution-reviewer': ['V:categories/07-specialized-domains/quant-analyst.toml', 'V:categories/05-data-ai/data-scientist.toml', 'W:plugins/quantitative-trading/agents/quant-analyst.md', 'W:plugins/machine-learning-ops/agents/data-scientist.md'],
  'russia-investment-regulatory-tax-reviewer': ['V:categories/08-business-product/legal-advisor.toml', 'V:categories/04-quality-security/compliance-auditor.toml', 'V:categories/10-research-analysis/research-analyst.toml', 'W:plugins/hr-legal-compliance/agents/legal-advisor.md', 'W:plugins/content-marketing/agents/search-specialist.md'],
};

const REQUIRES_OWNER = {
  'data-researcher': { V: ['docs-researcher'], W: ['search-specialist'], gap: 'Normative workflow phrase has no exact profile ID' },
  'research-analyst': { V: ['research-analyst', 'docs-researcher'], W: ['business-analyst', 'docs-architect'] },
  'search-specialist': { V: ['search-specialist', 'docs-researcher'], W: ['search-specialist'] },
  'architect-reviewer': { V: ['architect-reviewer', 'codebase-orchestrator'], W: ['code-reviewer', 'database-architect'] },
  'qa-expert': { V: ['qa-expert'], W: ['code-reviewer', 'test-automator'] },
  'test-automator': { V: ['test-automator'], W: ['test-automator', 'tdd-orchestrator'] },
  'documentation-engineer': { V: ['documentation-engineer', 'docs-researcher'], W: ['docs-architect'] },
  'git-workflow-manager': { V: ['git-workflow-manager'], W: ['deployment-engineer', 'devops-troubleshooter'] },
  'russia-ofz-rates-specialist': { V: ['quant-analyst', 'data-researcher'], W: ['quant-analyst', 'search-specialist'] },
  'market-regime-model-risk-reviewer': { V: ['model-risk-manager', 'risk-manager', 'quant-analyst'], W: ['risk-manager', 'quant-analyst'] },
  'historical-execution-simulator-reviewer': { V: ['quant-analyst', 'performance-engineer'], W: ['quant-analyst', 'performance-engineer'] },
  'ios-agent-orchestrator': { V: ['agent-organizer', 'agent-installer'], W: ['conductor-validator'], gap: 'Normative multi-agent workflow phrase has no exact profile ID' },
  'ios-codebase-auditor': { V: ['codebase-orchestrator', 'code-mapper'], W: ['code-reviewer', 'c4-code'] },
  'apps-script-specialist': { V: ['typescript-pro', 'backend-developer', 'tooling-engineer'], W: ['code-reviewer', 'deployment-engineer'] },
  'google-sheets-systems-reviewer': { V: ['data-analyst', 'qa-expert'], W: ['business-analyst', 'test-automator'] },
  'provider-integration-reviewer': { V: ['fintech-engineer', 'api-designer'], W: ['data-engineer', 'deployment-engineer', 'api-documenter'] },
  'security-privacy-auditor': { V: ['security-auditor', 'compliance-auditor'], W: ['security-auditor', 'code-reviewer'] },
  'release-deployment-gatekeeper': { V: ['deployment-engineer', 'devops-engineer', 'platform-engineer'], W: ['deployment-engineer', 'devops-troubleshooter'] },
  'recovery-idempotency-reviewer': { V: ['incident-responder', 'chaos-engineer', 'error-coordinator'], W: ['incident-responder', 'devops-troubleshooter'] },
  'audit-traceability-reviewer': { V: ['compliance-auditor', 'documentation-engineer'], W: ['docs-architect', 'business-analyst'] },
  'agent-governance-auditor': { V: ['ai-governance-auditor', 'policy-guardrail-designer', 'eval-engineer'], W: ['conductor-validator', 'code-reviewer'] },
  'production-influence-gate-reviewer': { V: ['model-risk-manager', 'code-mapper', 'compliance-auditor'], W: ['risk-manager', 'code-reviewer', 'quant-analyst'] },
  'data-schema-migration-reviewer': { V: ['data-engineer', 'database-administrator', 'database-optimizer'], W: ['database-admin', 'database-optimizer', 'data-engineer'] },
  'performance-quota-reviewer': { V: ['performance-engineer', 'performance-monitor'], W: ['performance-engineer', 'observability-engineer'] },
  'investment-universe-reviewer': { V: ['data-researcher', 'docs-researcher', 'risk-manager', 'fintech-engineer'], W: ['search-specialist', 'risk-manager'] },
  'liquidity-transaction-cost-reviewer': { V: ['quant-analyst', 'performance-engineer'], W: ['quant-analyst', 'performance-engineer'] },
  'ui-ux-accessibility-reviewer': { V: ['ui-ux-tester', 'accessibility-tester'], W: ['code-reviewer', 'test-automator'] },
  'api-contract-documenter': { V: ['api-documenter', 'docs-researcher'], W: ['api-documenter', 'reference-builder'] },
  'dependency-supply-chain-reviewer': { V: ['dependency-manager', 'license-engineer', 'security-auditor'], W: ['security-auditor', 'deployment-engineer'] },
  'observability-diagnostics-reviewer': { V: ['ai-observability-engineer', 'performance-monitor'], W: ['observability-engineer', 'incident-responder'] },
  'russian-technical-editor': { V: ['documentation-engineer'], W: ['docs-architect', 'reference-builder'] },
};

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 2) result[argv[i].replace(/^--/, '')] = argv[i + 1];
  return result;
}

function sha(bytes) { return createHash('sha256').update(bytes).digest('hex'); }

export function listPinnedCatalogPaths(root, commitSha, prefix, extension) {
  const result = spawnSync('git', ['-c', 'core.hooksPath=', '--no-optional-locks', 'ls-tree', '-r', '-z', '--name-only', commitSha, '--', prefix], { cwd: root, encoding: 'utf8', shell: false });
  if (result.status !== 0) throw new Error(`Cannot enumerate pinned Git tree: ${prefix}`);
  return result.stdout.split('\0').filter((path) => path.endsWith(extension)).sort();
}

function gitBlob(root, commitSha, sourcePath) {
  const mode = spawnSync('git', ['-c', 'core.hooksPath=', '--no-optional-locks', 'ls-tree', commitSha, '--', sourcePath], { cwd: root, encoding: 'utf8', shell: false });
  if (mode.status !== 0 || !/^(?:100644|100755)\s/.test(mode.stdout)) throw new Error(`Unsafe or missing Git blob: ${sourcePath}`);
  const result = spawnSync('git', ['-c', 'core.hooksPath=', '--no-optional-locks', 'show', `${commitSha}:${sourcePath}`], { cwd: root, encoding: null, shell: false });
  if (result.status !== 0) throw new Error(`Cannot read pinned Git blob: ${sourcePath}`);
  return result.stdout;
}

function gitHead(root) {
  const result = spawnSync('git', ['-c', 'core.hooksPath=', '--no-optional-locks', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', shell: false });
  if (result.status !== 0) throw new Error(`Cannot verify pinned checkout: ${root}`);
  return result.stdout.trim();
}

function record(repoKey, root, sourcePath) {
  if (!sourcePath || sourcePath.startsWith('../') || sourcePath.includes('/../')) throw new Error(`Path escape: ${sourcePath}`);
  const raw = gitBlob(root, PINS[repoKey].commitSha, sourcePath);
  const text = raw.toString('utf8');
  const name = repoKey === 'V'
    ? /^name\s*=\s*["']([^"']+)["']/m.exec(text)?.[1]
    : /^name:\s*(.+?)\s*$/m.exec(text)?.[1];
  if (!name) throw new Error(`Profile ID not found: ${sourcePath}`);
  return {
    repository: PINS[repoKey].repository,
    commitSha: PINS[repoKey].commitSha,
    sourcePath,
    profileId: name.trim(),
    rawSha256: sha(raw),
    normalizedSha256: sha(Buffer.from(text.replace(/\r\n/g, '\n').normalize('NFC'), 'utf8')),
    license: PINS[repoKey].license,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const roots = { V: resolve(args['voltagent-root']), W: resolve(args['wshobson-root']) };
  for (const key of ['V', 'W']) {
    if (gitHead(roots[key]) !== PINS[key].commitSha) throw new Error(`${key} checkout does not match pinned commit`);
    const license = gitBlob(roots[key], PINS[key].commitSha, PINS[key].licensePath);
    if (!license.toString('utf8').startsWith('MIT License') || sha(license) !== PINS[key].licenseRawSha256) throw new Error(`${key} license mismatch`);
  }
  const catalogs = {
    V: listPinnedCatalogPaths(roots.V, PINS.V.commitSha, 'categories', '.toml'),
    W: listPinnedCatalogPaths(roots.W, PINS.W.commitSha, 'plugins', '.md').filter((path) => /(^|\/)agents\//.test(path)),
  };
  const byBase = {};
  for (const key of ['V', 'W']) {
    byBase[key] = new Map();
    for (const path of catalogs[key]) {
      const base = path.split('/').at(-1).replace(/\.(?:toml|md)$/, '');
      if (!byBase[key].has(base)) byBase[key].set(base, []);
      byBase[key].get(base).push(path);
    }
  }

  const selections = [];
  for (const [agentId, sources] of Object.entries(SELECTED)) {
    const profiles = sources.map((source) => {
      const [repoKey, sourcePath] = source.split(':', 2);
      return record(repoKey, roots[repoKey], sourcePath);
    });
    selections.push({ agentId, status: 'SELECTED', decisionReason: 'Specification provides deterministic exact components and order', selectedProfiles: profiles, candidateProfiles: [] });
  }
  for (const [agentId, names] of Object.entries(REQUIRES_OWNER)) {
    const candidates = [];
    for (const repoKey of ['V', 'W']) {
      for (const name of names[repoKey]) {
        for (const path of byBase[repoKey].get(name) || []) candidates.push(record(repoKey, roots[repoKey], path));
      }
    }
    const unique = [...new Map(candidates.map((item) => [`${item.repository}:${item.sourcePath}`, item])).values()]
      .sort((a, b) => `${a.repository}:${a.sourcePath}`.localeCompare(`${b.repository}:${b.sourcePath}`));
    selections.push({ agentId, status: unique.length ? 'REQUIRES_OWNER_DECISION' : 'UPSTREAM_PROFILE_NOT_FOUND', decisionReason: unique.length ? 'Exact candidate paths exist but the normative component choice is not owner-approved' : 'No exact candidate profile exists at either pin', selectionGap: names.gap || 'Normative composition requires an explicit exact component decision', selectedProfiles: [], candidateProfiles: unique });
  }
  selections.sort((a, b) => a.agentId.localeCompare(b.agentId));
  const counts = Object.fromEntries(['SELECTED', 'REQUIRES_OWNER_DECISION', 'UPSTREAM_PROFILE_NOT_FOUND'].map((status) => [status, selections.filter((item) => item.status === status).length]));
  const output = {
    schemaVersion: '1.0.0', generatedFrom: 'IOS Agent Platform Specification v2.1 section 19.2',
    normalization: 'UTF-8; CRLF converted to LF; Unicode NFC', activationAllowed: false,
    repositories: Object.values(PINS), counts, selections,
  };
  writeFileSync(resolve(args.output), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) main();
