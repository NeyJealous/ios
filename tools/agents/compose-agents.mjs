#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const FIRST_WAVE = ['ios-agent-orchestrator', 'agent-governance-auditor', 'security-privacy-auditor', 'audit-traceability-reviewer', 'ios-codebase-auditor'];
const CONFLICTS = {
  'ios-agent-orchestrator': ['preserve every base byte-for-byte', 'capability envelope removes installation, mutation and activation authority', 'Resolver and evidence contracts control routing', 'supervisor cannot issue subject-matter verdicts or self-review'],
  'agent-governance-auditor': ['preserve every base byte-for-byte', 'IOS security floor cannot be weakened by evaluation', 'successful evaluation cannot cancel a blocker', 'code-review scope is limited to governance/platform paths'],
  'security-privacy-auditor': ['preserve overlapping security duties', 'technical audit precedes compliance mapping, independent validation and changed-code confirmation', 'strictest prohibition wins', 'no automatic remediation or self-approval'],
  'audit-traceability-reviewer': ['preserve every base byte-for-byte', 'documentation accuracy and documentation architecture remain distinct', 'business analysis cannot create owner requirements', 'least-advanced evidenced status wins'],
  'ios-codebase-auditor': ['preserve every base byte-for-byte', 'planning, mapping, defect review and C4 mapping remain distinct', 'read-only overlay wins over implementation recommendations', 'runtime/spec conflicts remain findings without correction'],
};
const sha = (value) => createHash('sha256').update(value).digest('hex');
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

function main() {
  const generateProfiles = process.argv.includes('--generate-profiles');
  const rootArg = process.argv.indexOf('--root');
  const root = resolve(rootArg >= 0 ? process.argv[rootArg + 1] : resolve(import.meta.dirname, '../..'));
  const register = readJson(resolve(root, 'architecture/agents/registry/upstream-selection-register.yaml'));
  const lock = readJson(resolve(root, 'architecture/agents/registry/upstream-lock.json'));
  const lockByKey = new Map(lock.entries.map((entry) => [`${entry.repository}:${entry.sourcePath}`, entry]));
  const compositionLock = { schemaVersion: '1.0.0', status: 'PROVISIONAL', activationAllowed: false, agents: [] };

  for (const agentId of FIRST_WAVE) {
    const selection = register.selections.find((row) => row.agentId === agentId);
    if (!selection || selection.status !== 'SELECTED') throw new Error(`${agentId}: SELECTION_NOT_READY`);
    const overlayPath = `architecture/agents/overlays/${agentId}.yaml`;
    const overlayBytes = readFileSync(resolve(root, overlayPath));
    const overlay = JSON.parse(overlayBytes.toString('utf8'));
    if (overlay.agentId !== agentId || overlay.mode !== 'APPEND_ONLY' || overlay.status !== 'PROVISIONAL' || overlay.activationEligible !== false || overlay.platformActivationEligible !== false) throw new Error(`${agentId}: OVERLAY_CONTRACT_INVALID`);
    const bases = selection.selectedProfiles.map((profile) => {
      const entry = lockByKey.get(`${profile.repository}:${profile.sourcePath}`);
      if (!entry) throw new Error(`${agentId}: LOCK_ENTRY_MISSING`);
      return { repository: profile.repository, commit: profile.commitSha, sourcePath: profile.sourcePath, profileId: profile.profileId, rawHash: profile.rawSha256, normalizedHash: profile.normalizedSha256, snapshotPath: entry.snapshotPath, inclusionMode: 'FULL_UNMODIFIED' };
    });
    const compositionOrder = bases.map((base) => `${base.repository}:${base.sourcePath}`);
    if (JSON.stringify(compositionOrder) !== JSON.stringify(selection.compositionOrder)) throw new Error(`${agentId}: COMPOSITION_ORDER_MISMATCH`);
    const upstreamCompositionHash = sha(Buffer.from(JSON.stringify(bases.map(({ repository, commit, sourcePath, profileId, rawHash, normalizedHash, inclusionMode }) => ({ repository, commit, sourcePath, profileId, rawHash, normalizedHash, inclusionMode }))), 'utf8'));
    const generatedPath = `.codex/agents/${agentId}.toml`;
    if (generateProfiles) {
      const sections = bases.map((base, index) => `=== IMMUTABLE UPSTREAM BASE ${index + 1}: ${base.repository}:${base.sourcePath}@${base.commit} ===\n${readFileSync(resolve(root, base.snapshotPath), 'utf8')}\n=== END IMMUTABLE UPSTREAM BASE ${index + 1} ===`);
      sections.push(`=== APPEND-ONLY IOS OVERLAY ===\n${JSON.stringify(overlay, null, 2)}\n=== END APPEND-ONLY IOS OVERLAY ===`);
      const instructions = sections.join('\n\n');
      const model = overlay.modelContract.primaryModel;
      const reasoning = overlay.modelContract.primaryReasoning;
      const profile = [
        '# generated_by = tools/agents/compose-agents.mjs',
        '# status = PROVISIONAL',
        '# activationEligible = false',
        `# upstreamCompositionHash = ${upstreamCompositionHash}`,
        `# overlayHash = ${sha(overlayBytes)}`,
        `name = ${JSON.stringify(agentId)}`,
        `description = ${JSON.stringify(`PROVISIONAL IOS first-wave agent ${agentId}; activation is disabled.`)}`,
        `model = ${JSON.stringify(model)}`,
        `model_reasoning_effort = ${JSON.stringify(reasoning)}`,
        'sandbox_mode = "read-only"',
        `developer_instructions = ${JSON.stringify(instructions)}`,
        '',
      ].join('\n');
      const output = resolve(root, generatedPath);
      mkdirSync(dirname(output), { recursive: true });
      writeFileSync(output, profile, 'utf8');
    }
    const generatedHash = existsSync(resolve(root, generatedPath)) ? sha(readFileSync(resolve(root, generatedPath))) : null;
    const composition = { agentId, compositionVersion: '1.0.0', bases, compositionOrder, conflictResolution: CONFLICTS[agentId], overlayPath, overlayHash: sha(overlayBytes), generatedPath, generatedHash, upstreamCompositionHash, status: 'PROVISIONAL', activationEligible: false, platformActivationEligible: false };
    const compositionPath = resolve(root, 'architecture/agents/compositions', `${agentId}.yaml`);
    mkdirSync(dirname(compositionPath), { recursive: true });
    writeFileSync(compositionPath, `${JSON.stringify(composition, null, 2)}\n`, 'utf8');
    compositionLock.agents.push({ agentId, compositionPath: `architecture/agents/compositions/${agentId}.yaml`, compositionHash: sha(Buffer.from(`${JSON.stringify(composition, null, 2)}\n`, 'utf8')), upstreamCompositionHash, overlayHash: composition.overlayHash, generatedPath, generatedHash, status: 'PROVISIONAL' });
  }
  writeFileSync(resolve(root, 'architecture/agents/registry/composition-lock.json'), `${JSON.stringify(compositionLock, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ agents: compositionLock.agents.length, generatedProfiles: generateProfiles, status: compositionLock.status }, null, 2));
}

main();
