import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  changeSpecDigest,
  validateChangeSpec,
  validateWorkflowSpec,
  workflowDigest
} from '../src/workflow/contract-validation.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const expectCode = (fn, code) => assert.throws(fn, (error) => error?.code === code);

test('reviewed WorkflowSpec and ChangeSpec fixtures satisfy closed contracts', async () => {
  const workflow = await readJson('../fixtures/workflow/workflow-spec.contract.json');
  const change = await readJson('../fixtures/workflow/change-spec.contract.json');
  assert.equal(validateWorkflowSpec(workflow), true);
  assert.equal(validateChangeSpec(change), true);
  assert.equal(workflow.execution_authority, 'NONE');
  assert.equal(change.execution_authority, 'NONE');
});

test('semantic ordering does not change WorkflowSpec identity', async () => {
  const workflow = await readJson('../fixtures/workflow/workflow-spec.contract.json');
  const reordered = structuredClone(workflow);
  reordered.states.reverse();
  reordered.transitions.reverse();
  reordered.source_subjects.policy_request_digests.reverse();
  reordered.source_subjects.policy_decision_digests.reverse();
  reordered.source_subjects.connector_capability_digests.reverse();
  reordered.release_gates.eval_pack_subjects.reverse();
  reordered.release_gates.policy_decision_digests.reverse();
  reordered.workflow_digest = workflowDigest(reordered);
  assert.equal(reordered.workflow_digest, workflow.workflow_digest);
  assert.equal(validateWorkflowSpec(reordered), true);
});

test('arbitrary generated code is rejected before workflow admission', async () => {
  const workflow = await readJson('../fixtures/workflow/workflow-spec.contract.json');
  const mutated = structuredClone(workflow);
  mutated.transitions[0].preconditions = ['bash -c rm -rf /'];
  mutated.workflow_digest = workflowDigest(mutated);
  expectCode(() => validateWorkflowSpec(mutated), 'ARBITRARY_CODE_FORBIDDEN');
});

test('unknown state references and authority widening fail closed', async () => {
  const workflow = await readJson('../fixtures/workflow/workflow-spec.contract.json');
  const unknown = structuredClone(workflow);
  unknown.transitions[0].to = 'missing-state';
  unknown.workflow_digest = workflowDigest(unknown);
  expectCode(() => validateWorkflowSpec(unknown), 'UNKNOWN_STATE_REFERENCE');

  const widened = structuredClone(workflow);
  widened.execution_authority = 'EXECUTE';
  widened.workflow_digest = workflowDigest(widened);
  expectCode(() => validateWorkflowSpec(widened), 'AUTHORITY_WIDENING');
});

test('ChangeSpec cannot target protected identity or production authority', async () => {
  const change = await readJson('../fixtures/workflow/change-spec.contract.json');
  const protectedMutation = structuredClone(change);
  protectedMutation.requested_delta[0].target_path = '/source_subjects/policy_subjects';
  protectedMutation.candidate_digest = changeSpecDigest(protectedMutation);
  expectCode(() => validateChangeSpec(protectedMutation), 'INVALID_VALUE');

  const executable = structuredClone(change);
  executable.execution_authority = 'EXECUTE';
  executable.candidate_digest = changeSpecDigest(executable);
  expectCode(() => validateChangeSpec(executable), 'NATURAL_LANGUAGE_EXECUTION_FORBIDDEN');
});
