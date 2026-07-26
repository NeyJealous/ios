import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { readJsonCompatibleYaml, resolveRequiredAgents } from '../../tools/agent-governance-lib.mjs';
import { assertAcyclic, buildExecutionPlan, loadPlatform } from '../../tools/agents/orchestration-lib.mjs';

const root = resolve(import.meta.dirname, '../..');
const matrix = readJsonCompatibleYaml(resolve(root, 'architecture/agents/review-matrix.yaml'));
const platform = loadPlatform(root);

test('governance plan is deterministic, parallel and activation-closed after rollback', () => {
  const resolution = resolveRequiredAgents({ changedPaths: ['architecture/agents/registry/agents.yaml'], matrix });
  const first = buildExecutionPlan({ phase: 'PRE_CHANGE', resolution, ...platform });
  const second = buildExecutionPlan({ phase: 'PRE_CHANGE', resolution, ...platform });
  assert.deepEqual(first, second);
  assert.equal(first.result, 'BLOCKED');
  assert.ok(first.blockedBy.includes('PLATFORM_ACTIVATION_CLOSED'));
  assert.equal(first.runtimeDispatchStatus, 'NOT_DISPATCHED_ACTIVATION_CLOSED');
  assert.ok(first.parallelGroups.some((group) => group.length >= 3));
  assert.ok(first.modelBindings.every((binding) => binding.status === 'RUNTIME_AVAILABLE'));
});

test('orchestrator self-change cannot schedule orchestrator as its own reviewer', () => {
  const resolution = resolveRequiredAgents({ changedPaths: ['tools/agents/orchestrate.mjs'], matrix });
  const plan = buildExecutionPlan({ phase: 'POST_CHANGE', resolution, ...platform });
  assert.equal(plan.selfReviewProtection.subjectIsOrchestrator, true);
  assert.equal(plan.executionDag.some((node) => node.id === 'ios-agent-orchestrator'), false);
  assert.ok(plan.blockedBy.includes('ORCHESTRATOR_SELF_REVIEW_FORBIDDEN'));
});

test('DAG cycles and unknown dependencies are rejected', () => {
  assert.throws(() => assertAcyclic([{ id: 'a', dependsOn: ['b'] }, { id: 'b', dependsOn: ['a'] }]), /DAG_CYCLE/);
  assert.throws(() => assertAcyclic([{ id: 'a', dependsOn: ['missing'] }]), /DAG_UNKNOWN_DEPENDENCY/);
});

test('Luna is not eligible for automatic dispatch and no substitution is allowed', () => {
  assert.equal(platform.modelRegistry.lunaPolicy.spawnAgentAvailability, 'MODEL_NOT_AVAILABLE');
  assert.equal(platform.modelRegistry.lunaPolicy.automaticDispatchEligible, false);
  assert.equal(platform.modelRegistry.lunaPolicy.substitutionAllowed, false);
  assert.ok(platform.modelRegistry.agents.every((item) => item.silentDowngradeAllowed === false));
});
