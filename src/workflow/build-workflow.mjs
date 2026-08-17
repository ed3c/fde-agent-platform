import { sha256 } from '../../scripts/lib/contract-validation.mjs';
import { normalizeWorkflowSpec, validateWorkflowSpec, workflowDigest } from './contract-validation.mjs';
import { AUTHORITY_TO_ACTION_CLASS, CLASS_ORDER, fail, setEqualsForCompiler } from './compiler-common.mjs';
import { validateCompilerInputs } from './validate-compiler-inputs.mjs';

export function compileWorkflow(input) {
  const { capabilityMap, decisionByCapability } = validateCompilerInputs(input);
  const {
    tenant_ref: tenantRef,
    process_twin: processTwin,
    context_pack: contextPack,
    digital_employee_spec: digitalEmployee,
    eval_pack_subjects: evalPackSubjects,
    plan
  } = input;

  const allowedActions = new Map((digitalEmployee.authority?.enabled_actions ?? []).map((action) => [action.action_id, action]));
  const prohibitedActions = new Set(digitalEmployee.authority?.prohibited_actions ?? []);
  const policySubjects = [...contextPack.mandatory_policy_subjects].sort();
  const connectorDigests = [...capabilityMap.keys()].sort();

  const transitions = plan.transitions.map((transition, index) => {
    const path = `$.plan.transitions[${index}]`;
    if (transition.executor_class !== 'CONNECTOR') return structuredClone(transition);
    if (prohibitedActions.has(transition.action_id)) fail('PROHIBITED_ACTION_GRANTED', `${path}.action_id`, transition.action_id);
    const action = allowedActions.get(transition.action_id);
    if (!action) fail('ACTION_OUTSIDE_COMPILED_CEILING', `${path}.action_id`, transition.action_id);
    const capability = capabilityMap.get(transition.capability_digest);
    if (!capability) fail('UNKNOWN_CAPABILITY_DIGEST', `${path}.capability_digest`, transition.capability_digest);
    if (capability.operation_id !== transition.operation_id) fail('OPERATION_CAPABILITY_MISMATCH', `${path}.operation_id`, transition.operation_id);
    const policyBinding = decisionByCapability.get(transition.capability_digest);
    if (!policyBinding) fail('POLICY_DECISION_MISSING', `${path}.capability_digest`, transition.capability_digest);
    const { decision, request } = policyBinding;
    if (request.action_id !== transition.action_id || request.operation_id !== transition.operation_id) {
      fail('POLICY_REQUEST_OPERATION_MISMATCH', path, `${request.action_id}/${request.operation_id}`);
    }
    if (request.requested_action_class !== transition.action_class) {
      fail('POLICY_REQUEST_ACTION_CLASS_MISMATCH', `${path}.action_class`, request.requested_action_class);
    }
    if (CLASS_ORDER.indexOf(transition.action_class) > CLASS_ORDER.indexOf(decision.effective_action_class)) {
      fail('POLICY_ACTION_CLASS_WIDENING', `${path}.action_class`, `${transition.action_class} > ${decision.effective_action_class}`);
    }
    if (!setEqualsForCompiler(transition.policy_subjects, request.policy_subjects)) {
      fail('POLICY_REQUEST_SUBJECT_DIVERGENCE', `${path}.policy_subjects`, 'transition differs from evaluated request');
    }
    const expectedToolId = `${capability.connector_id}.${capability.operation_id}`;
    if (transition.allowed_tool_ids.length !== 1 || transition.allowed_tool_ids[0] !== expectedToolId) {
      fail('UNAUTHORIZED_TOOL_BINDING', `${path}.allowed_tool_ids`, expectedToolId);
    }
    const systemBinding = digitalEmployee.systems.find((system) => system.system_id === action.system_id);
    if (!systemBinding || !systemBinding.granted_capabilities.includes(action.capability)) {
      fail('DIGITAL_EMPLOYEE_CAPABILITY_MISMATCH', `${path}.action_id`, action.capability);
    }
    if (!transition.required_evidence_subjects.includes(contextPack.context_digest)) {
      fail('CONTEXT_EVIDENCE_REQUIRED', `${path}.required_evidence_subjects`, contextPack.context_digest);
    }
    if (capability.side_effect_class !== 'NONE' && !transition.required_evidence_subjects.includes(processTwin.twin_digest)) {
      fail('PROCESS_TWIN_EVIDENCE_REQUIRED', `${path}.required_evidence_subjects`, processTwin.twin_digest);
    }
    const actionClass = AUTHORITY_TO_ACTION_CLASS[action.authority_level];
    if (CLASS_ORDER.indexOf(transition.action_class) > CLASS_ORDER.indexOf(actionClass)) {
      fail('ACTION_CLASS_WIDENING', `${path}.action_class`, `${transition.action_class} > ${actionClass}`);
    }
    if (CLASS_ORDER.indexOf(transition.action_class) > CLASS_ORDER.indexOf(capability.action_class)) {
      fail('CAPABILITY_CLASS_WIDENING', `${path}.action_class`, `${transition.action_class} > ${capability.action_class}`);
    }
    if (capability.system_id !== action.system_id) fail('SYSTEM_BINDING_MISMATCH', `${path}.action_id`, action.system_id);
    if (!transition.policy_subjects.every((subject) => policySubjects.includes(subject))) {
      fail('POLICY_SUBJECT_MISSING_FROM_CONTEXT', `${path}.policy_subjects`, transition.policy_subjects.join(','));
    }
    if (capability.postcondition_observer !== null && transition.postcondition_observer_operation_id !== capability.postcondition_observer) {
      fail('POSTCONDITION_OBSERVER_MISMATCH', `${path}.postcondition_observer_operation_id`, 'does not match capability');
    }
    return structuredClone(transition);
  });

  const workflow = {
    schema: 'fde-agent/workflow-spec/v1',
    workflow_spec_id: plan.workflow_spec_id,
    version: plan.version,
    tenant_ref: tenantRef,
    state: 'COMPILED',
    generated_at: plan.generated_at,
    source_subjects: {
      process_twin_digest: processTwin.twin_digest,
      context_pack_digest: contextPack.context_digest,
      digital_employee_spec_digest: sha256(digitalEmployee),
      policy_subjects: policySubjects,
      policy_request_digests: input.policy_requests.map((request) => sha256(request)).sort(),
      policy_decision_digests: input.policy_decisions.map((decision) => decision.decision_digest).sort(),
      connector_capability_digests: connectorDigests,
      eval_pack_subjects: [...evalPackSubjects].sort(),
      model_profile_subject: `${digitalEmployee.model_policy.profile_id}@${sha256(digitalEmployee.model_policy)}`
    },
    trigger: structuredClone(plan.trigger),
    states: structuredClone(plan.states),
    transitions,
    controlled_cycles: structuredClone(plan.controlled_cycles),
    rollback: structuredClone(plan.rollback),
    reconciliation: structuredClone(plan.reconciliation),
    release_gates: {
      eval_pack_subjects: [...evalPackSubjects].sort(),
      required_policy_subjects: policySubjects,
      policy_decision_digests: input.policy_decisions.map((decision) => decision.decision_digest).sort(),
      human_admit_required: true
    },
    workflow_digest: '0'.repeat(64),
    execution_authority: 'NONE',
    production_admission: 'HUMAN_ADMIT_REQUIRED'
  };
  workflow.workflow_digest = workflowDigest(workflow);
  const normalized = normalizeWorkflowSpec(workflow);
  validateWorkflowSpec(normalized);
  return normalized;
}
