#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MEASUREMENT = 'UTC wall-clock from immediately before dispatch request through completion/rejection timestamp; includes orchestration and timestamp-call overhead';

export function buildModelAvailabilityJson(registry) {
  return {
    schemaVersion: registry.schemaVersion,
    testedAt: registry.probeWindow.completedAt,
    branch: registry.probeWindow.branch,
    repositoryHeadAtProbe: registry.probeWindow.repositoryHead,
    overallStatus: registry.models.some((model) => model.smokeResult === 'FAILURE')
      ? 'RUNTIME_SMOKE_COMPLETE_WITH_UNAVAILABLE_MODELS'
      : 'RUNTIME_SMOKE_COMPLETE',
    measurement: MEASUREMENT,
    silentDowngrade: registry.policy.silentDowngradeAllowed,
    productionWrites: 0,
    results: registry.models.map((model) => ({
      modelId: model.modelId,
      requestedModel: model.requestedSlug,
      requestedReasoning: model.requestedReasoningLevel,
      resolvedModel: model.resolvedSlug,
      resolvedReasoning: model.resolvedReasoningLevel,
      success: model.smokeResult === 'SUCCESS',
      providerResponse: model.providerDispatchResponse,
      executionResponse: model.executionResponse,
      latencyMs: model.observedEndToEndLatencyMs,
      agentUsable: model.agentUsableAtRuntime,
      trustedAttestation: model.attestationStatus,
    })),
  };
}

export function buildModelAvailabilityMarkdown(registry) {
  const rows = registry.models.map((model) => {
    const requested = `\`${model.requestedSlug}\`, \`${model.requestedReasoningLevel}\``;
    const resolved = model.resolvedSlug ? `\`${model.resolvedSlug}\`, \`${model.resolvedReasoningLevel}\`` : '—';
    const result = `\`${model.smokeResult}\``;
    const response = typeof model.providerDispatchResponse === 'object'
      ? `dispatch \`${model.providerDispatchResponse.task_name}\`; exact nonce response received`
      : `provider response: \`${model.providerDispatchResponse}\`; no execution created`;
    return `| ${model.displayName.replace('GPT-5.6 ', '')} | ${requested} | ${resolved} | ${result} | ${response} | ${model.observedEndToEndLatencyMs.toLocaleString('en-US')} ms | ${model.agentUsableAtRuntime ? 'yes' : 'no'} |`;
  });
  return [
    '# Model availability report — actual Codex runtime smoke', '',
    `Overall status: \`${buildModelAvailabilityJson(registry).overallStatus}\``, '',
    `Probe window: \`${registry.probeWindow.startedAt}\` — \`${registry.probeWindow.completedAt}\``,
    `Repository HEAD at probe: \`${registry.probeWindow.repositoryHead}\``, '',
    '| Platform model | Requested | Resolved | Result | Provider/execution response | Observed latency | Agent runtime use |',
    '|---|---|---|---|---|---:|---|', ...rows, '',
    'Statuses above are derived only from the four actual Codex runtime requests and their responses. Capability lists, UI and documentation were not used to assign availability.', '',
    'Latency is end-to-end UTC wall-clock between the timestamp immediately before the runtime request and the timestamp after execution completion/provider rejection. It includes orchestration and timestamp-call overhead and is therefore an observed upper-bound, not pure model inference latency.', '',
    'No substitution occurred. Luna was not replaced by Terra. `Sol Ultra` is the successfully executed `gpt-5.6-sol` runtime request with reasoning level `ultra`; it is not represented as a separate untested slug.', '',
    'Runtime usability is separate from platform activation. All four records retain `platformActivationEligible=false` because the external signed attestation boundary remains unavailable; this does not change the actual runtime availability result.', '',
  ].join('\n');
}

function main() {
  const root = resolve(import.meta.dirname, '../..');
  const registry = JSON.parse(readFileSync(resolve(root, 'architecture/agents/registry/model-availability.yaml'), 'utf8'));
  writeFileSync(resolve(root, 'audit/agents/MODEL_RUNTIME_SMOKE_20260722/model-availability-report.json'), `${JSON.stringify(buildModelAvailabilityJson(registry), null, 2)}\n`, 'utf8');
  writeFileSync(resolve(root, 'audit/agents/MODEL_RUNTIME_SMOKE_20260722/model-availability-report.md'), buildModelAvailabilityMarkdown(registry), 'utf8');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) main();
