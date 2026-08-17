import { assertNoForbiddenSecrets } from '../../scripts/lib/contract-validation.mjs';
import {
  ID, TOOL_ID, DIGEST, ACTION_CLASSES, EXECUTOR_CLASSES, SAFE_MODEL_RESPONSIBILITIES,
  TERMINAL_KINDS, SIDE_EFFECT_CLASSES, fail, exact, str, nullableStr, bool, integer,
  iso, enumValue, strings, uniqueBy, setEquals, assertNoArbitraryCode
} from './validation-common.mjs';
import { workflowDigest } from './normalization.mjs';

function hasCycle(transitions, stateIds) {
  const adjacency = new Map([...stateIds].map((stateId) => [stateId, []]));
  for (const transition of transitions) adjacency.get(transition.from).push(transition.to);
  const visiting = new Set();
  const visited = new Set();
  const visit = (state) => {
    if (visiting.has(state)) return true;
    if (visited.has(state)) return false;
    visiting.add(state);
    for (const next of adjacency.get(state) ?? []) if (visit(next)) return true;
    visiting.delete(state);
    visited.add(state);
    return false;
  };
  return [...stateIds].some(visit);
}

function validateControlledCycles(workflow, transitionMap, stateIds) {
  uniqueBy(workflow.controlled_cycles, 'cycle_id', '$.controlled_cycles');
  const controlledTransitionIds = new Set();
  workflow.controlled_cycles.forEach((cycle, index) => {
    const path = `$.controlled_cycles[${index}]`;
    exact(cycle, ['cycle_id', 'transition_ids', 'max_iterations', 'timeout_seconds', 'exit_condition'], path);
    str(cycle.cycle_id, `${path}.cycle_id`, ID);
    strings(cycle.transition_ids, `${path}.transition_ids`, 2);
    integer(cycle.max_iterations, `${path}.max_iterations`, 1, 100);
    integer(cycle.timeout_seconds, `${path}.timeout_seconds`, 1, 86400);
    str(cycle.exit_condition, `${path}.exit_condition`);
    const transitions = cycle.transition_ids.map((transitionId) => {
      const transition = transitionMap.get(transitionId);
      if (!transition) fail('UNKNOWN_TRANSITION_REFERENCE', `${path}.transition_ids`, transitionId);
      if (controlledTransitionIds.has(transitionId)) {
        fail('TRANSITION_IN_MULTIPLE_CYCLES', `${path}.transition_ids`, transitionId);
      }
      controlledTransitionIds.add(transitionId);
      return transition;
    });
    if (!hasCycle(transitions, stateIds)) {
      fail('CONTROLLED_CYCLE_NOT_CYCLIC', path, 'declared cycle does not contain a cycle');
    }
  });
  const uncontrolled = workflow.transitions.filter((transition) => !controlledTransitionIds.has(transition.transition_id));
  if (hasCycle(uncontrolled, stateIds)) {
    fail('UNBOUNDED_CYCLE', '$.transitions', 'cycle must be explicitly bounded');
  }
}

export function validateWorkflowSpec(workflow) {
  assertNoForbiddenSecrets(workflow);
  assertNoArbitraryCode(workflow);
  const topKeys = [
    'schema', 'workflow_spec_id', 'version', 'tenant_ref', 'state', 'generated_at',
    'source_subjects', 'trigger', 'states', 'transitions', 'controlled_cycles',
    'rollback', 'reconciliation', 'release_gates', 'workflow_digest',
    'execution_authority', 'production_admission'
  ];
  exact(workflow, topKeys, '$');
  if (workflow.schema !== 'fde-agent/workflow-spec/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected workflow-spec/v1');
  str(workflow.workflow_spec_id, '$.workflow_spec_id', ID);
  str(workflow.version, '$.version', /^\d+\.\d+\.\d+$/);
  str(workflow.tenant_ref, '$.tenant_ref');
  enumValue(workflow.state, ['DRAFT', 'VALIDATED', 'COMPILED', 'REFUSED'], '$.state');
  iso(workflow.generated_at, '$.generated_at');

  exact(
    workflow.source_subjects,
    ['process_twin_digest', 'context_pack_digest', 'digital_employee_spec_digest', 'policy_subjects', 'policy_request_digests', 'policy_decision_digests', 'connector_capability_digests', 'eval_pack_subjects', 'model_profile_subject'],
    '$.source_subjects'
  );
  for (const key of ['process_twin_digest', 'context_pack_digest', 'digital_employee_spec_digest']) {
    str(workflow.source_subjects[key], `$.source_subjects.${key}`, DIGEST);
  }
  strings(workflow.source_subjects.policy_subjects, '$.source_subjects.policy_subjects', 1);
  strings(workflow.source_subjects.policy_request_digests, '$.source_subjects.policy_request_digests', 1, DIGEST);
  strings(workflow.source_subjects.policy_decision_digests, '$.source_subjects.policy_decision_digests', 1, DIGEST);
  strings(workflow.source_subjects.connector_capability_digests, '$.source_subjects.connector_capability_digests', 1, DIGEST);
  strings(workflow.source_subjects.eval_pack_subjects, '$.source_subjects.eval_pack_subjects', 1);
  str(workflow.source_subjects.model_profile_subject, '$.source_subjects.model_profile_subject');

  exact(workflow.trigger, ['trigger_id', 'type', 'source', 'event_type', 'deduplication_key_template'], '$.trigger');
  str(workflow.trigger.trigger_id, '$.trigger.trigger_id', ID);
  enumValue(workflow.trigger.type, ['EVENT', 'MANUAL', 'SCHEDULE'], '$.trigger.type');
  str(workflow.trigger.source, '$.trigger.source');
  nullableStr(workflow.trigger.event_type, '$.trigger.event_type');
  str(workflow.trigger.deduplication_key_template, '$.trigger.deduplication_key_template');
  if (workflow.trigger.type === 'EVENT' && workflow.trigger.event_type === null) {
    fail('EVENT_TYPE_REQUIRED', '$.trigger.event_type', 'event trigger requires type');
  }

  if (!Array.isArray(workflow.states) || workflow.states.length < 3) fail('INVALID_VALUE', '$.states', 'expected 3+ states');
  uniqueBy(workflow.states, 'state_id', '$.states');
  const stateMap = new Map();
  let initialCount = 0;
  let successCount = 0;
  let failureCount = 0;
  workflow.states.forEach((state, index) => {
    const path = `$.states[${index}]`;
    exact(state, ['state_id', 'kind', 'owner_role', 'terminal'], path);
    str(state.state_id, `${path}.state_id`, ID);
    enumValue(state.kind, ['INITIAL', 'ACTIVE', 'HUMAN_WAIT', 'RECONCILING', 'COMPENSATING', 'TERMINAL_SUCCESS', 'TERMINAL_FAILURE'], `${path}.kind`);
    str(state.owner_role, `${path}.owner_role`);
    bool(state.terminal, `${path}.terminal`);
    if (state.kind === 'INITIAL') initialCount += 1;
    if (state.kind === 'TERMINAL_SUCCESS') successCount += 1;
    if (state.kind === 'TERMINAL_FAILURE') failureCount += 1;
    if (TERMINAL_KINDS.has(state.kind) !== state.terminal) {
      fail('TERMINAL_FLAG_MISMATCH', `${path}.terminal`, 'terminal flag must match kind');
    }
    stateMap.set(state.state_id, state);
  });
  if (initialCount !== 1) fail('INITIAL_STATE_COUNT', '$.states', 'exactly one initial state required');
  if (successCount < 1 || failureCount < 1) fail('TERMINAL_STATE_REQUIRED', '$.states', 'success and failure terminal states required');

  if (!Array.isArray(workflow.transitions) || workflow.transitions.length < 1) fail('INVALID_VALUE', '$.transitions', 'expected transition');
  uniqueBy(workflow.transitions, 'transition_id', '$.transitions');
  const transitionMap = new Map();
  const connectorDigests = new Set(workflow.source_subjects.connector_capability_digests);
  const sourcePolicies = new Set(workflow.source_subjects.policy_subjects);
  const sideEffectTransitions = [];
  workflow.transitions.forEach((transition, index) => {
    const path = `$.transitions[${index}]`;
    const keys = [
      'transition_id', 'from', 'to', 'executor_class', 'action_id', 'operation_id',
      'operation_identity_template', 'capability_digest', 'action_class', 'preconditions',
      'postconditions', 'allowed_tool_ids', 'prohibited_tool_ids', 'policy_subjects',
      'required_evidence_subjects', 'model_responsibilities', 'approval', 'retry',
      'timeout_seconds', 'postcondition_observer_operation_id', 'compensation_transition_id',
      'escalation_role', 'on_unknown_completion'
    ];
    exact(transition, keys, path);
    str(transition.transition_id, `${path}.transition_id`, ID);
    str(transition.from, `${path}.from`, ID);
    str(transition.to, `${path}.to`, ID);
    if (!stateMap.has(transition.from) || !stateMap.has(transition.to)) {
      fail('UNKNOWN_STATE_REFERENCE', path, `${transition.from}->${transition.to}`);
    }
    if (stateMap.get(transition.from).terminal) fail('TRANSITION_FROM_TERMINAL', `${path}.from`, transition.from);
    enumValue(transition.executor_class, EXECUTOR_CLASSES, `${path}.executor_class`);
    nullableStr(transition.action_id, `${path}.action_id`, ID);
    nullableStr(transition.operation_id, `${path}.operation_id`, ID);
    nullableStr(transition.operation_identity_template, `${path}.operation_identity_template`);
    nullableStr(transition.capability_digest, `${path}.capability_digest`, DIGEST);
    enumValue(transition.action_class, ACTION_CLASSES, `${path}.action_class`);
    if (transition.action_class === 'PROHIBITED') fail('PROHIBITED_ACTION_CLASS', `${path}.action_class`, 'cannot compile');
    strings(transition.preconditions, `${path}.preconditions`, 1);
    strings(transition.postconditions, `${path}.postconditions`, 1);
    strings(transition.allowed_tool_ids, `${path}.allowed_tool_ids`, 0, TOOL_ID);
    strings(transition.prohibited_tool_ids, `${path}.prohibited_tool_ids`, 0, TOOL_ID);
    const overlap = transition.allowed_tool_ids.filter((tool) => transition.prohibited_tool_ids.includes(tool));
    if (overlap.length) fail('TOOL_POLICY_CONFLICT', `${path}.allowed_tool_ids`, overlap.join(','));
    strings(transition.policy_subjects, `${path}.policy_subjects`);
    for (const policy of transition.policy_subjects) if (!sourcePolicies.has(policy)) fail('STALE_POLICY_SUBJECT', `${path}.policy_subjects`, policy);
    strings(transition.required_evidence_subjects, `${path}.required_evidence_subjects`, 1);
    strings(transition.model_responsibilities, `${path}.model_responsibilities`);
    transition.model_responsibilities.forEach((responsibility, responsibilityIndex) => {
      if (!SAFE_MODEL_RESPONSIBILITIES.includes(responsibility)) {
        fail('MODEL_HARD_CONTROL_FORBIDDEN', `${path}.model_responsibilities[${responsibilityIndex}]`, responsibility);
      }
    });

    exact(transition.approval, ['mode', 'required_roles', 'expires_after_seconds'], `${path}.approval`);
    enumValue(transition.approval.mode, ['NEVER', 'CONDITIONAL', 'ALWAYS'], `${path}.approval.mode`);
    strings(transition.approval.required_roles, `${path}.approval.required_roles`);
    if (transition.approval.expires_after_seconds !== null) integer(transition.approval.expires_after_seconds, `${path}.approval.expires_after_seconds`, 1, 86400);
    if (transition.approval.mode === 'ALWAYS' && (transition.approval.required_roles.length === 0 || transition.approval.expires_after_seconds === null)) {
      fail('APPROVAL_CONTRACT_INCOMPLETE', `${path}.approval`, 'ALWAYS requires role and expiry');
    }
    if (transition.approval.mode === 'NEVER' && (transition.approval.required_roles.length > 0 || transition.approval.expires_after_seconds !== null)) {
      fail('UNEXPECTED_APPROVAL_CONSTRAINT', `${path}.approval`, 'NEVER cannot carry approval details');
    }

    exact(transition.retry, ['max_attempts', 'backoff_seconds', 'requires_idempotency'], `${path}.retry`);
    integer(transition.retry.max_attempts, `${path}.retry.max_attempts`, 1, 5);
    integer(transition.retry.backoff_seconds, `${path}.retry.backoff_seconds`, 0, 3600);
    bool(transition.retry.requires_idempotency, `${path}.retry.requires_idempotency`);
    integer(transition.timeout_seconds, `${path}.timeout_seconds`, 1, 86400);
    nullableStr(transition.postcondition_observer_operation_id, `${path}.postcondition_observer_operation_id`, ID);
    nullableStr(transition.compensation_transition_id, `${path}.compensation_transition_id`, ID);
    nullableStr(transition.escalation_role, `${path}.escalation_role`);
    enumValue(transition.on_unknown_completion, ['NOT_APPLICABLE', 'RECONCILE', 'FREEZE'], `${path}.on_unknown_completion`);

    if (transition.executor_class === 'DETERMINISTIC' || transition.executor_class === 'HUMAN') {
      if (transition.action_class !== 'NONE' || transition.action_id !== null || transition.operation_id !== null || transition.capability_digest !== null) {
        fail('EXECUTOR_AUTHORITY_MISMATCH', path, `${transition.executor_class} cannot own connector action`);
      }
      if (transition.allowed_tool_ids.length > 0) fail('EXECUTOR_TOOL_MISMATCH', `${path}.allowed_tool_ids`, 'no tools allowed');
    }
    if (transition.executor_class === 'MODEL') {
      if (!['NONE', 'RECOMMEND'].includes(transition.action_class) || transition.action_id !== null || transition.operation_id !== null || transition.capability_digest !== null) {
        fail('MODEL_AUTHORITY_FORBIDDEN', path, 'model cannot own action or operation');
      }
      if (transition.approval.mode !== 'NEVER') fail('MODEL_APPROVAL_FORBIDDEN', `${path}.approval`, 'model cannot own approval');
      if (transition.retry.max_attempts !== 1 || transition.on_unknown_completion !== 'NOT_APPLICABLE') {
        fail('MODEL_RUNTIME_CONTROL_FORBIDDEN', path, 'model cannot own retry/unknown-completion admission');
      }
    }
    if (transition.executor_class === 'CONNECTOR') {
      if (transition.action_id === null || transition.operation_id === null || transition.capability_digest === null) {
        fail('CONNECTOR_BINDING_REQUIRED', path, 'connector transition requires action, operation and capability');
      }
      if (!connectorDigests.has(transition.capability_digest)) fail('UNKNOWN_CAPABILITY_DIGEST', `${path}.capability_digest`, transition.capability_digest);
      if (transition.policy_subjects.length === 0) fail('POLICY_BINDING_REQUIRED', `${path}.policy_subjects`, 'connector transition requires policy');
      if (transition.postcondition_observer_operation_id === null) fail('POSTCONDITION_OBSERVER_REQUIRED', `${path}.postcondition_observer_operation_id`, 'connector transition requires readback observer');
    }

    if (SIDE_EFFECT_CLASSES.has(transition.action_class)) {
      sideEffectTransitions.push(transition);
      if (transition.executor_class !== 'CONNECTOR') fail('SIDE_EFFECT_EXECUTOR_MISMATCH', path, 'side effect must be connector-bound');
      if (transition.operation_identity_template === null) fail('OPERATION_IDENTITY_REQUIRED', `${path}.operation_identity_template`, 'side effect requires stable identity');
      if (!transition.retry.requires_idempotency) fail('IDEMPOTENCY_REQUIRED', `${path}.retry.requires_idempotency`, 'side effect requires idempotency');
      const isCompensationStep = stateMap.get(transition.from).kind === 'COMPENSATING' || stateMap.get(transition.to).kind === 'COMPENSATING';
      if (!isCompensationStep && transition.compensation_transition_id === null) fail('COMPENSATION_REQUIRED', `${path}.compensation_transition_id`, 'reversible side effect requires compensation');
      if (transition.on_unknown_completion === 'NOT_APPLICABLE') fail('RECONCILIATION_REQUIRED', `${path}.on_unknown_completion`, 'side effect must reconcile/freeze');
    }
    if (SIDE_EFFECT_CLASSES.has(transition.action_class) && transition.retry.max_attempts > 1 && !transition.retry.requires_idempotency) {
      fail('RETRY_WITHOUT_IDEMPOTENCY', `${path}.retry`, 'side-effect retry requires idempotency');
    }
    if (transition.action_class === 'APPROVED_COMMIT' && transition.approval.mode !== 'ALWAYS') {
      fail('APPROVAL_REQUIRED', `${path}.approval`, 'approved commit requires Human approval');
    }
    transitionMap.set(transition.transition_id, transition);
  });

  for (const transition of workflow.transitions) {
    if (transition.compensation_transition_id !== null) {
      const compensation = transitionMap.get(transition.compensation_transition_id);
      if (!compensation) fail('UNKNOWN_COMPENSATION_TRANSITION', '$.transitions', transition.compensation_transition_id);
      if (stateMap.get(compensation.to).kind !== 'COMPENSATING' && !stateMap.get(compensation.from).kind.includes('COMPENSATING')) {
        fail('INVALID_COMPENSATION_PATH', '$.transitions', transition.compensation_transition_id);
      }
    }
  }

  validateControlledCycles(workflow, transitionMap, new Set(stateMap.keys()));

  exact(workflow.rollback, ['strategy', 'entry_transition_id', 'trigger_conditions'], '$.rollback');
  enumValue(workflow.rollback.strategy, ['COMPENSATE', 'RESTORE_SNAPSHOT', 'HUMAN_ONLY', 'NONE'], '$.rollback.strategy');
  nullableStr(workflow.rollback.entry_transition_id, '$.rollback.entry_transition_id', ID);
  strings(workflow.rollback.trigger_conditions, '$.rollback.trigger_conditions');
  if (sideEffectTransitions.length > 0 && workflow.rollback.strategy === 'NONE') {
    fail('ROLLBACK_REQUIRED', '$.rollback.strategy', 'side effects require rollback');
  }
  if (workflow.rollback.entry_transition_id !== null && !transitionMap.has(workflow.rollback.entry_transition_id)) {
    fail('UNKNOWN_ROLLBACK_TRANSITION', '$.rollback.entry_transition_id', workflow.rollback.entry_transition_id);
  }

  exact(workflow.reconciliation, ['required', 'unknown_completion_state', 'observer_operation_ids'], '$.reconciliation');
  bool(workflow.reconciliation.required, '$.reconciliation.required');
  nullableStr(workflow.reconciliation.unknown_completion_state, '$.reconciliation.unknown_completion_state', ID);
  strings(workflow.reconciliation.observer_operation_ids, '$.reconciliation.observer_operation_ids');
  if (sideEffectTransitions.length > 0) {
    if (!workflow.reconciliation.required || workflow.reconciliation.unknown_completion_state === null) {
      fail('RECONCILIATION_REQUIRED', '$.reconciliation', 'side effects require reconciliation');
    }
    const unknownState = stateMap.get(workflow.reconciliation.unknown_completion_state);
    if (!unknownState || unknownState.kind !== 'RECONCILING') {
      fail('INVALID_RECONCILIATION_STATE', '$.reconciliation.unknown_completion_state', 'must reference RECONCILING state');
    }
    for (const transition of sideEffectTransitions) {
      if (!workflow.reconciliation.observer_operation_ids.includes(transition.postcondition_observer_operation_id)) {
        fail('OBSERVER_NOT_RECONCILED', '$.reconciliation.observer_operation_ids', transition.postcondition_observer_operation_id);
      }
    }
  }

  exact(workflow.release_gates, ['eval_pack_subjects', 'required_policy_subjects', 'policy_decision_digests', 'human_admit_required'], '$.release_gates');
  strings(workflow.release_gates.eval_pack_subjects, '$.release_gates.eval_pack_subjects', 1);
  strings(workflow.release_gates.required_policy_subjects, '$.release_gates.required_policy_subjects', 1);
  strings(workflow.release_gates.policy_decision_digests, '$.release_gates.policy_decision_digests', 1, DIGEST);
  bool(workflow.release_gates.human_admit_required, '$.release_gates.human_admit_required');
  if (!workflow.release_gates.human_admit_required) fail('HUMAN_ADMIT_REQUIRED', '$.release_gates.human_admit_required', 'must remain true');
  if (!setEquals(workflow.release_gates.eval_pack_subjects, workflow.source_subjects.eval_pack_subjects)) {
    fail('EVAL_SUBJECT_DIVERGENCE', '$.release_gates.eval_pack_subjects', 'must bind exact source Eval subjects');
  }
  if (!setEquals(workflow.release_gates.required_policy_subjects, workflow.source_subjects.policy_subjects)) {
    fail('POLICY_SUBJECT_DIVERGENCE', '$.release_gates.required_policy_subjects', 'must bind exact source policy subjects');
  }
  if (!setEquals(workflow.release_gates.policy_decision_digests, workflow.source_subjects.policy_decision_digests)) {
    fail('POLICY_DECISION_SUBJECT_DIVERGENCE', '$.release_gates.policy_decision_digests', 'must bind exact decisions');
  }

  str(workflow.workflow_digest, '$.workflow_digest', DIGEST);
  if (workflow.workflow_digest !== workflowDigest(workflow)) {
    fail('WORKFLOW_DIGEST_MISMATCH', '$.workflow_digest', 'digest does not bind workflow');
  }
  if (workflow.execution_authority !== 'NONE') fail('AUTHORITY_WIDENING', '$.execution_authority', 'must remain NONE');
  if (workflow.production_admission !== 'HUMAN_ADMIT_REQUIRED') fail('PRODUCTION_ADMISSION_WIDENED', '$.production_admission', 'Human admission required');
  return true;
}
