import test from 'node:test';
import assert from 'node:assert/strict';
import { compileChangeSpecCandidate, compileWorkflow } from '../src/workflow/compile-workflow.mjs';
import { changeSpecDigest, validateChangeSpec, validateWorkflowSpec, workflowDigest } from '../src/workflow/contract-validation.mjs';
import { buildCompilerInput } from './helpers/workflow-fixture.mjs';

const expectCode = (fn, code) => assert.throws(fn, (error) => error?.code === code);
const compileBase = () => compileWorkflow(buildCompilerInput());
const mutateWorkflow = (mutator) => { const workflow = compileBase(); mutator(workflow); workflow.workflow_digest = workflowDigest(workflow); return workflow; };
const changeCandidate = () => compileChangeSpecCandidate({
  change_spec_id: 'change-owner-candidate', tenant_ref: 'tenant-demo', workflow_spec: compileBase(),
  requester_identity_ref: 'user:ap-process-owner', requester_verified: false, requester_roles: ['ap-process-owner'],
  request_text: 'Change the escalation owner.',
  requested_delta: [{ operation: 'REPLACE', target_path: '/transitions/create-draft-case/escalation_role', candidate_value_digest: 'f'.repeat(64), action_class: 'DRAFT' }],
  affected_node_ids: ['received'], unresolved_questions: ['What is the effective date?'], unresolved_contradiction_ids: [],
  policy_impact_subjects: ['policy:ap-route/v1'], required_tests: ['workflow-contracts'], required_approvals: ['ap-process-owner'], fixture_subjects: ['fixture:ap/v1']
});

test('retry without idempotency and compensation absence are killed', () => {
  const retry = mutateWorkflow((workflow) => { workflow.transitions.find((item) => item.transition_id === 'create-draft-case').retry.requires_idempotency = false; });
  expectCode(() => validateWorkflowSpec(retry), 'IDEMPOTENCY_REQUIRED');
  const compensation = mutateWorkflow((workflow) => { workflow.transitions.find((item) => item.transition_id === 'create-draft-case').compensation_transition_id = null; });
  expectCode(() => validateWorkflowSpec(compensation), 'COMPENSATION_REQUIRED');
});

test('model-owned hard control and prohibited action class are killed', () => {
  const model = mutateWorkflow((workflow) => { const transition = workflow.transitions.find((item) => item.transition_id === 'complete-case'); transition.executor_class = 'MODEL'; transition.model_responsibilities.push('AUTHORIZE'); });
  expectCode(() => validateWorkflowSpec(model), 'MODEL_HARD_CONTROL_FORBIDDEN');
  const prohibited = mutateWorkflow((workflow) => { workflow.transitions.find((item) => item.transition_id === 'create-draft-case').action_class = 'PROHIBITED'; });
  expectCode(() => validateWorkflowSpec(prohibited), 'PROHIBITED_ACTION_CLASS');
});

test('unbounded cycles and stale policy subjects are killed', () => {
  const cycle = mutateWorkflow((workflow) => { const transition = structuredClone(workflow.transitions.find((item) => item.transition_id === 'compensation-complete')); Object.assign(transition, { transition_id: 'reopen-draft', from: 'compensating', to: 'draft-created', preconditions: ['manual-reopen'], postconditions: ['draft-reopened'] }); workflow.transitions.push(transition); });
  expectCode(() => validateWorkflowSpec(cycle), 'UNBOUNDED_CYCLE');
  const stale = mutateWorkflow((workflow) => { workflow.transitions.find((item) => item.transition_id === 'create-draft-case').policy_subjects = ['policy:unknown/v1']; });
  expectCode(() => validateWorkflowSpec(stale), 'STALE_POLICY_SUBJECT');
});

test('workflow and ChangeSpec digest tampering are killed', () => {
  const workflow = compileBase(); workflow.workflow_digest = '0'.repeat(64); expectCode(() => validateWorkflowSpec(workflow), 'WORKFLOW_DIGEST_MISMATCH');
  const change = changeCandidate(); change.candidate_digest = '0'.repeat(64); expectCode(() => validateChangeSpec(change), 'CHANGE_DIGEST_MISMATCH');
});

test('validated ChangeSpec cannot retain ambiguity or omit approval', () => {
  const change = changeCandidate(); change.state = 'VALIDATED'; change.source_request.requester_verified = true; change.required_approvals = []; change.candidate_digest = changeSpecDigest(change);
  expectCode(() => validateChangeSpec(change), 'UNRESOLVED_CHANGE_INPUT');
  change.unresolved_questions = []; change.candidate_digest = changeSpecDigest(change);
  expectCode(() => validateChangeSpec(change), 'CHANGE_APPROVAL_REQUIRED');
});

test('approved commits require expiring Human approval and exact decision subjects', () => {
  const approval = mutateWorkflow((workflow) => { const transition = workflow.transitions.find((item) => item.transition_id === 'create-draft-case'); transition.action_class = 'APPROVED_COMMIT'; transition.approval = { mode: 'NEVER', required_roles: [], expires_after_seconds: null }; });
  expectCode(() => validateWorkflowSpec(approval), 'APPROVAL_REQUIRED');
  const decisions = mutateWorkflow((workflow) => { workflow.release_gates.policy_decision_digests = ['0'.repeat(64)]; });
  expectCode(() => validateWorkflowSpec(decisions), 'POLICY_DECISION_SUBJECT_DIVERGENCE');
});
