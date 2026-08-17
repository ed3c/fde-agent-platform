import { sha256 } from '../../scripts/lib/contract-validation.mjs';
import { evaluatePolicy } from '../../src/policy/evaluate-policy.mjs';

const zero = '0'.repeat(64);
const bindDigest = (value, key) => {
  const candidate = structuredClone(value);
  candidate[key] = zero;
  value[key] = sha256(candidate);
  return value;
};

const buildProcessTwin = () => {
  const twin = {
    schema: 'fde-agent/process-twin/v1',
    process_twin_id: 'ap-minimal-twin', version: '1.0.0', tenant_ref: 'tenant-demo', process_id: 'ap-exception', generated_at: '2026-08-17T00:00:00Z',
    input_claim_digests: ['1'.repeat(64)],
    nodes: [
      { node_id: 'detect-mismatch', kind: 'DECISION', owner_role: 'ap-operator', view: 'SYSTEM_ENFORCED', source_claim_ids: ['claim-detect'], preconditions: ['invoice-received'], postconditions: ['mismatch-known'], state: 'ACTIVE' },
      { node_id: 'route-exception', kind: 'TASK', owner_role: 'ap-process-owner', view: 'APPROVED_TARGET', source_claim_ids: ['claim-route'], preconditions: ['mismatch-known'], postconditions: ['owner-assigned'], state: 'ACTIVE' }
    ],
    edges: [{ edge_id: 'detect-route', from: 'detect-mismatch', to: 'route-exception', relation: 'PRECEDES', condition: null, controlled_cycle_id: null }],
    controlled_cycles: [], unresolved_contradictions: [],
    view_digests: { DOCUMENTED: '2'.repeat(64), OBSERVED: '3'.repeat(64), SYSTEM_ENFORCED: '4'.repeat(64), APPROVED_TARGET: '5'.repeat(64) },
    topological_order: ['detect-mismatch', 'route-exception'], twin_digest: zero, execution_authority: 'NONE'
  };
  const { twin_digest: _discarded, ...subject } = twin;
  twin.twin_digest = sha256(subject);
  return twin;
};

const buildContextPack = (twin) => bindDigest({
  schema: 'fde-agent/context-pack/v1', context_pack_id: 'context-ap-minimal', tenant_ref: 'tenant-demo', task_subject: 'ap-exception-draft', process_twin_digest: twin.twin_digest,
  query_digest: '6'.repeat(64), state: 'READY',
  selected_nodes: [
    { node_id: 'detect-mismatch', view: 'SYSTEM_ENFORCED', owner_role: 'ap-operator', source_claim_ids: ['claim-detect'], estimated_tokens: 12, reason: 'DEPENDENCY' },
    { node_id: 'route-exception', view: 'APPROVED_TARGET', owner_role: 'ap-process-owner', source_claim_ids: ['claim-route'], estimated_tokens: 14, reason: 'REQUIRED' }
  ],
  selected_claims: [
    { claim_id: 'claim-detect', claim_digest: '7'.repeat(64), source_id: 'erp-schema', recorded_at: '2026-08-17T00:00:00Z', valid_from: '2026-01-01T00:00:00Z', valid_to: null, data_classification: 'INTERNAL', readiness_state: 'READY' },
    { claim_id: 'claim-route', claim_digest: '8'.repeat(64), source_id: 'approved-routing', recorded_at: '2026-08-17T00:00:00Z', valid_from: '2026-01-01T00:00:00Z', valid_to: null, data_classification: 'CONFIDENTIAL', readiness_state: 'READY' }
  ],
  unresolved_contradictions: [], omitted_optional_nodes: [], mandatory_policy_subjects: ['policy:ap-route/v1'],
  budget: { max_nodes: 4, used_nodes: 2, max_tokens: 200, used_tokens: 26 },
  authority_envelope: { purpose: 'CONTEXT_ONLY', tenant_ref: 'tenant-demo', maximum_data_classification: 'CONFIDENTIAL' },
  refusal_reasons: [], context_digest: zero, execution_authority: 'NONE'
}, 'context_digest');

const buildDigitalEmployee = () => ({
  schema: 'fde-agent/digital-employee-spec/v1', spec_id: 'tenant-demo:ap-exception@1.0.0', state: 'COMPILED', tenant_id: 'tenant-demo',
  role_pack_ref: { role_pack_id: 'finance-ap-exception', version: '1.0.0' },
  source_digests: { role_pack_sha256: '9'.repeat(64), tenant_overlay_sha256: 'a'.repeat(64) },
  outcome_contract_id: 'outcome-ap-demo', outcomes: [{ outcome_id: 'reduce-cycle-time', description: 'Reduce exception handling time.', metric_ids: ['cycle_time_minutes'] }],
  systems: [{ system_id: 'erp', connector_id: 'synthetic-erp', granted_capabilities: ['case.draft', 'case.delete'] }],
  authority: {
    enabled_actions: [
      { action_id: 'exception-case-create-draft', system_id: 'erp', capability: 'case.draft', authority_level: 'A2', approval: 'NEVER', reversible: true },
      { action_id: 'exception-case-delete-draft', system_id: 'erp', capability: 'case.delete', authority_level: 'A3', approval: 'NEVER', reversible: true }
    ],
    prohibited_actions: ['payment-transfer']
  },
  human_manager_role: 'ap-process-owner', escalation_roles: ['ap-process-owner'],
  model_policy: { profile_id: 'balanced-private', purpose: 'Classification only.', data_classification: 'CONFIDENTIAL', zero_data_retention_required: true, allowed_regions: ['ap-east'], max_cost_per_call: 0.05, max_latency_ms: 2500 },
  evals: [{ eval_id: 'no-unauthorized-action', description: 'Authority ceiling remains closed.', blocking: true }],
  production_admission: 'HUMAN_ADMIT_REQUIRED'
});

const buildCapability = ({ id, operation, actionClass, observer, compensation }) => bindDigest({
  schema: 'fde-agent/connector-capability/v1', capability_id: id, tenant_ref: 'tenant-demo', connector_id: 'synthetic-erp', system_id: 'erp', connector_version: '1.0.0',
  operation_id: operation, action_class: actionClass, side_effect_class: 'REVERSIBLE', reversible: true, idempotency_mode: 'CALLER_KEY_REQUIRED',
  compensation_operation_id: compensation, audit_required: true, sandbox_supported: true, maximum_data_classification: 'CONFIDENTIAL', allowed_regions: ['ap-east'],
  retention_mode: 'ZERO', approval_mode: 'NEVER', required_approver_roles: [], postcondition_observer: observer, state: 'ACTIVE', capability_digest: zero
}, 'capability_digest');

const buildRequest = ({ id, action, operation, actionClass, context, employee }) => ({
  schema: 'fde-agent/policy-request/v1', request_id: id, tenant_ref: 'tenant-demo', digital_employee_spec_digest: sha256(employee), context_pack_digest: context.context_digest,
  policy_subjects: ['policy:ap-route/v1'], action_id: action, operation_id: operation, requested_action_class: actionClass,
  caller_identity_ref: 'user:ap-operator', caller_roles: ['ap-operator'], authenticated: true, requested_at: '2026-08-17T00:00:00Z', data_classification: 'CONFIDENTIAL', region: 'ap-east',
  operation_identity: `op-${id}`, idempotency_key_present: true,
  approval: { status: 'NONE', approver_identity_ref: null, approver_role: null, subject_digest: null, expires_at: null },
  authority_envelope: {
    allowed_action_ids: [action], prohibited_action_ids: ['payment-transfer'], maximum_action_class: actionClass,
    system_capabilities: [{ system_id: 'erp', operation_ids: [operation] }], required_separation_of_duties: true, model_decision_permitted: false
  }
});

const transitionBase = (overrides) => ({
  action_id: null, operation_id: null, operation_identity_template: null, capability_digest: null, action_class: 'NONE',
  preconditions: ['context-ready'], postconditions: ['state-updated'], allowed_tool_ids: [], prohibited_tool_ids: ['synthetic-erp.payment-transfer'],
  policy_subjects: [], required_evidence_subjects: [], model_responsibilities: [], approval: { mode: 'NEVER', required_roles: [], expires_after_seconds: null },
  retry: { max_attempts: 1, backoff_seconds: 0, requires_idempotency: false }, timeout_seconds: 30,
  postcondition_observer_operation_id: null, compensation_transition_id: null, escalation_role: 'ap-process-owner', on_unknown_completion: 'NOT_APPLICABLE',
  ...overrides
});

export function buildCompilerInput() {
  const processTwin = buildProcessTwin();
  const context = buildContextPack(processTwin);
  const employee = buildDigitalEmployee();
  const create = buildCapability({ id: 'cap-create-draft', operation: 'create-draft-case', actionClass: 'DRAFT', observer: 'read-draft-case', compensation: 'delete-draft-case' });
  const remove = buildCapability({ id: 'cap-delete-draft', operation: 'delete-draft-case', actionClass: 'REVERSIBLE_ACTION', observer: 'confirm-draft-deleted', compensation: 'restore-draft-case' });
  const createRequest = buildRequest({ id: 'create-draft', action: 'exception-case-create-draft', operation: 'create-draft-case', actionClass: 'DRAFT', context, employee });
  const deleteRequest = buildRequest({ id: 'delete-draft', action: 'exception-case-delete-draft', operation: 'delete-draft-case', actionClass: 'REVERSIBLE_ACTION', context, employee });
  const createDecision = evaluatePolicy({ request: createRequest, capability: create });
  const deleteDecision = evaluatePolicy({ request: deleteRequest, capability: remove });
  const evidence = [context.context_digest, processTwin.twin_digest];
  return {
    tenant_ref: 'tenant-demo', process_twin: processTwin, context_pack: context, digital_employee_spec: employee,
    connector_capabilities: [create, remove], policy_requests: [createRequest, deleteRequest], policy_decisions: [createDecision, deleteDecision],
    eval_pack_subjects: ['eval-pack:workflow-ap/v1'],
    plan: {
      workflow_spec_id: 'ap-exception-draft-workflow', version: '1.0.0', generated_at: '2026-08-17T00:01:00Z',
      trigger: { trigger_id: 'invoice-exception-received', type: 'EVENT', source: 'synthetic-erp', event_type: 'invoice-po-mismatch', deduplication_key_template: '{{tenant_ref}}:{{invoice_id}}:{{event_id}}' },
      states: [
        { state_id: 'received', kind: 'INITIAL', owner_role: 'ap-operator', terminal: false },
        { state_id: 'draft-created', kind: 'ACTIVE', owner_role: 'ap-process-owner', terminal: false },
        { state_id: 'compensating', kind: 'COMPENSATING', owner_role: 'ap-process-owner', terminal: false },
        { state_id: 'unknown-completion', kind: 'RECONCILING', owner_role: 'ap-process-owner', terminal: false },
        { state_id: 'completed', kind: 'TERMINAL_SUCCESS', owner_role: 'ap-process-owner', terminal: true },
        { state_id: 'failed', kind: 'TERMINAL_FAILURE', owner_role: 'ap-process-owner', terminal: true }
      ],
      transitions: [
        transitionBase({ transition_id: 'create-draft-case', from: 'received', to: 'draft-created', executor_class: 'CONNECTOR', action_id: 'exception-case-create-draft', operation_id: 'create-draft-case', operation_identity_template: '{{tenant_ref}}:{{invoice_id}}:draft', capability_digest: create.capability_digest, action_class: 'DRAFT', postconditions: ['draft-visible'], allowed_tool_ids: ['synthetic-erp.create-draft-case'], policy_subjects: ['policy:ap-route/v1'], required_evidence_subjects: evidence, retry: { max_attempts: 3, backoff_seconds: 2, requires_idempotency: true }, postcondition_observer_operation_id: 'read-draft-case', compensation_transition_id: 'delete-draft-case', on_unknown_completion: 'RECONCILE' }),
        transitionBase({ transition_id: 'complete-case', from: 'draft-created', to: 'completed', executor_class: 'DETERMINISTIC', preconditions: ['draft-visible'], postconditions: ['workflow-complete'], prohibited_tool_ids: [], required_evidence_subjects: [context.context_digest], timeout_seconds: 5 }),
        transitionBase({ transition_id: 'delete-draft-case', from: 'draft-created', to: 'compensating', executor_class: 'CONNECTOR', action_id: 'exception-case-delete-draft', operation_id: 'delete-draft-case', operation_identity_template: '{{tenant_ref}}:{{draft_case_id}}:delete', capability_digest: remove.capability_digest, action_class: 'REVERSIBLE_ACTION', preconditions: ['rollback-triggered'], postconditions: ['draft-deleted'], allowed_tool_ids: ['synthetic-erp.delete-draft-case'], prohibited_tool_ids: [], policy_subjects: ['policy:ap-route/v1'], required_evidence_subjects: evidence, retry: { max_attempts: 3, backoff_seconds: 2, requires_idempotency: true }, postcondition_observer_operation_id: 'confirm-draft-deleted', on_unknown_completion: 'FREEZE' }),
        transitionBase({ transition_id: 'compensation-complete', from: 'compensating', to: 'failed', executor_class: 'DETERMINISTIC', preconditions: ['draft-deleted'], postconditions: ['rollback-complete'], prohibited_tool_ids: [], required_evidence_subjects: [context.context_digest], timeout_seconds: 5 }),
        transitionBase({ transition_id: 'reconciliation-failed', from: 'unknown-completion', to: 'failed', executor_class: 'DETERMINISTIC', preconditions: ['draft-not-observed'], postconditions: ['human-escalation-created'], prohibited_tool_ids: [], required_evidence_subjects: [context.context_digest], timeout_seconds: 5 })
      ],
      controlled_cycles: [], rollback: { strategy: 'COMPENSATE', entry_transition_id: 'delete-draft-case', trigger_conditions: ['blocking-eval-failed', 'postcondition-diverged'] },
      reconciliation: { required: true, unknown_completion_state: 'unknown-completion', observer_operation_ids: ['read-draft-case', 'confirm-draft-deleted'] }
    }
  };
}
