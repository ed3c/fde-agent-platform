import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256 } from '../scripts/lib/contract-validation.mjs';
import { compileChangeSpecCandidate, compileWorkflow } from '../src/workflow/compile-workflow.mjs';
import { buildCompilerInput } from './helpers/workflow-fixture.mjs';

const expectCode = (fn, code) => assert.throws(fn, (error) => error?.code === code);
const bindTwinDigest = (twin) => { const { twin_digest: _discarded, ...subject } = twin; twin.twin_digest = sha256(subject); };

test('compiler emits a deterministic governed WorkflowSpec', () => {
  const first = compileWorkflow(buildCompilerInput());
  const reordered = buildCompilerInput();
  reordered.connector_capabilities.reverse();
  reordered.policy_requests.reverse();
  reordered.policy_decisions.reverse();
  reordered.plan.states.reverse();
  reordered.plan.transitions.reverse();
  const second = compileWorkflow(reordered);
  assert.equal(first.workflow_digest, second.workflow_digest);
  assert.deepEqual(first, second);
  assert.equal(first.execution_authority, 'NONE');
  assert.equal(first.production_admission, 'HUMAN_ADMIT_REQUIRED');
  assert.equal(first.workflow_digest, 'e0a9bd6cef903cf8c690cba933e40013e19869c1b76947682ddc015053aa5a3e');
});

test('unready context and unresolved Process Twin contradictions block compilation', () => {
  const degraded = buildCompilerInput();
  degraded.context_pack.state = 'DEGRADED';
  degraded.context_pack.context_digest = '0'.repeat(64);
  degraded.context_pack.context_digest = sha256(degraded.context_pack);
  expectCode(() => compileWorkflow(degraded), 'CONTEXT_NOT_READY');

  const contradicted = buildCompilerInput();
  contradicted.process_twin.unresolved_contradictions = [{ contradiction_id: 'route-owner-conflict', claim_ids: ['claim-detect', 'claim-route'], subject_id: 'route-exception', predicate: 'owner-role' }];
  bindTwinDigest(contradicted.process_twin);
  contradicted.context_pack.process_twin_digest = contradicted.process_twin.twin_digest;
  contradicted.context_pack.context_digest = '0'.repeat(64);
  contradicted.context_pack.context_digest = sha256(contradicted.context_pack);
  expectCode(() => compileWorkflow(contradicted), 'UNRESOLVED_PROCESS_CONTRADICTION');
});

test('Process Twin, policy decisions, tools, and evidence are exact subjects', () => {
  const twin = buildCompilerInput();
  twin.process_twin.nodes[0].owner_role = 'unknown-owner';
  expectCode(() => compileWorkflow(twin), 'TWIN_DIGEST_MISMATCH');

  const policy = buildCompilerInput();
  policy.policy_decisions[0].reason_codes = ['UNREVIEWED_OVERRIDE'];
  policy.policy_decisions[0].decision_digest = '0'.repeat(64);
  policy.policy_decisions[0].decision_digest = sha256(policy.policy_decisions[0]);
  expectCode(() => compileWorkflow(policy), 'POLICY_DECISION_DIVERGENCE');

  const tool = buildCompilerInput();
  tool.plan.transitions.find((item) => item.transition_id === 'create-draft-case').allowed_tool_ids = ['synthetic-erp.payment-transfer'];
  expectCode(() => compileWorkflow(tool), 'UNAUTHORIZED_TOOL_BINDING');

  const missing = buildCompilerInput();
  missing.plan.transitions.find((item) => item.transition_id === 'create-draft-case').required_evidence_subjects = [missing.context_pack.context_digest];
  expectCode(() => compileWorkflow(missing), 'PROCESS_TWIN_EVIDENCE_REQUIRED');
});

test('stale policy and actions outside the compiled ceiling fail closed', () => {
  const stale = buildCompilerInput();
  stale.plan.generated_at = '2026-08-17T00:06:00Z';
  expectCode(() => compileWorkflow(stale), 'STALE_POLICY_DECISION');

  const widened = buildCompilerInput();
  widened.plan.transitions.find((item) => item.transition_id === 'create-draft-case').action_id = 'payment-transfer';
  expectCode(() => compileWorkflow(widened), 'PROHIBITED_ACTION_GRANTED');
});

test('natural-language request compiles only an untrusted ChangeSpec candidate', () => {
  const workflow = compileWorkflow(buildCompilerInput());
  const change = compileChangeSpecCandidate({
    change_spec_id: 'change-owner-candidate', tenant_ref: 'tenant-demo', workflow_spec: workflow,
    requester_identity_ref: 'user:ap-process-owner', requester_verified: false, requester_roles: ['ap-process-owner'],
    request_text: 'Change the escalation owner.',
    requested_delta: [{ operation: 'REPLACE', target_path: '/transitions/create-draft-case/escalation_role', candidate_value_digest: 'f'.repeat(64), action_class: 'DRAFT' }],
    affected_node_ids: ['received'], unresolved_questions: ['What is the effective date?'], unresolved_contradiction_ids: [],
    policy_impact_subjects: ['policy:ap-route/v1'], required_tests: ['workflow-contracts'], required_approvals: ['ap-process-owner'], fixture_subjects: ['fixture:ap/v1']
  });
  assert.equal(change.state, 'CANDIDATE');
  assert.equal(change.execution_authority, 'NONE');
  assert.equal(change.canary_plan.maximum_traffic_percent, 0);
  assert.equal(change.production_admission, 'HUMAN_ADMIT_REQUIRED');
});
