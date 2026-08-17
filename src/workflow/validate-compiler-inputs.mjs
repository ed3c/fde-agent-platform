import { sha256 } from '../../scripts/lib/contract-validation.mjs';
import { assertContextPackIntegrity, validateContextPack } from '../context/contract-validation.mjs';
import { validateProcessTwin } from '../evidence/contract-validation.mjs';
import { evaluatePolicy } from '../policy/evaluate-policy.mjs';
import { validateConnectorCapability, validatePolicyDecision, validatePolicyRequest } from '../policy/contract-validation.mjs';
import { fail, ensureTenant, exactDigest } from './compiler-common.mjs';

export function validateCompilerInputs(input) {
  const {
    tenant_ref: tenantRef,
    process_twin: processTwin,
    context_pack: contextPack,
    digital_employee_spec: digitalEmployee,
    connector_capabilities: capabilities,
    policy_requests: policyRequests,
    policy_decisions: policyDecisions,
    eval_pack_subjects: evalPackSubjects,
    plan
  } = input;
  if (typeof tenantRef !== 'string' || tenantRef.length === 0) fail('TENANT_REQUIRED', '$.tenant_ref', 'required');
  validateProcessTwin(processTwin);
  ensureTenant(processTwin.tenant_ref, tenantRef, '$.process_twin.tenant_ref');
  if (processTwin.execution_authority !== 'NONE') fail('PROCESS_TWIN_AUTHORITY_WIDENED', '$.process_twin.execution_authority', 'must remain NONE');
  if ((processTwin.unresolved_contradictions ?? []).length > 0) fail('UNRESOLVED_PROCESS_CONTRADICTION', '$.process_twin.unresolved_contradictions', 'must be resolved before compilation');

  validateContextPack(contextPack);
  assertContextPackIntegrity(contextPack);
  ensureTenant(contextPack.tenant_ref, tenantRef, '$.context_pack.tenant_ref');
  if (contextPack.state !== 'READY') fail('CONTEXT_NOT_READY', '$.context_pack.state', contextPack.state);
  if ((contextPack.unresolved_contradictions ?? []).length > 0) fail('UNRESOLVED_CONTEXT_CONTRADICTION', '$.context_pack.unresolved_contradictions', 'must be empty');
  exactDigest(contextPack.process_twin_digest, processTwin.twin_digest, '$.context_pack.process_twin_digest', 'PROCESS_TWIN_SUBJECT_MISMATCH');

  if (digitalEmployee?.schema !== 'fde-agent/digital-employee-spec/v1') fail('SCHEMA_MISMATCH', '$.digital_employee_spec.schema', 'expected DigitalEmployeeSpec');
  ensureTenant(digitalEmployee.tenant_id, tenantRef, '$.digital_employee_spec.tenant_id');
  if (digitalEmployee.state !== 'COMPILED') fail('DIGITAL_EMPLOYEE_NOT_COMPILED', '$.digital_employee_spec.state', digitalEmployee.state);
  if (digitalEmployee.production_admission !== 'HUMAN_ADMIT_REQUIRED') fail('PRODUCTION_ADMISSION_WIDENED', '$.digital_employee_spec.production_admission', 'Human admission required');

  if (!Array.isArray(capabilities) || capabilities.length === 0) fail('CAPABILITY_REQUIRED', '$.connector_capabilities', 'expected capabilities');
  const capabilityMap = new Map();
  capabilities.forEach((capability, index) => {
    validateConnectorCapability(capability);
    ensureTenant(capability.tenant_ref, tenantRef, `$.connector_capabilities[${index}].tenant_ref`);
    if (capability.state !== 'ACTIVE') fail('CAPABILITY_NOT_ACTIVE', `$.connector_capabilities[${index}].state`, capability.state);
    capabilityMap.set(capability.capability_digest, capability);
  });

  if (!Array.isArray(policyRequests) || policyRequests.length === 0) fail('POLICY_REQUEST_REQUIRED', '$.policy_requests', 'expected requests');
  const requestByDigest = new Map();
  policyRequests.forEach((request, index) => {
    validatePolicyRequest(request);
    ensureTenant(request.tenant_ref, tenantRef, `$.policy_requests[${index}].tenant_ref`);
    exactDigest(request.context_pack_digest, contextPack.context_digest, `$.policy_requests[${index}].context_pack_digest`, 'POLICY_CONTEXT_SUBJECT_MISMATCH');
    exactDigest(request.digital_employee_spec_digest, sha256(digitalEmployee), `$.policy_requests[${index}].digital_employee_spec_digest`, 'POLICY_DIGITAL_EMPLOYEE_SUBJECT_MISMATCH');
    if (!request.policy_subjects.every((subject) => contextPack.mandatory_policy_subjects.includes(subject))) {
      fail('POLICY_SUBJECT_MISSING_FROM_CONTEXT', `$.policy_requests[${index}].policy_subjects`, request.policy_subjects.join(','));
    }
    if (Date.parse(request.requested_at) > Date.parse(plan.generated_at)) {
      fail('POLICY_REQUEST_FROM_FUTURE', `$.policy_requests[${index}].requested_at`, request.requested_at);
    }
    const digest = sha256(request);
    if (requestByDigest.has(digest)) fail('DUPLICATE_POLICY_REQUEST', `$.policy_requests[${index}]`, digest);
    requestByDigest.set(digest, request);
  });

  if (!Array.isArray(policyDecisions) || policyDecisions.length === 0) fail('POLICY_DECISION_REQUIRED', '$.policy_decisions', 'expected decisions');
  const decisionByCapability = new Map();
  policyDecisions.forEach((decision, index) => {
    validatePolicyDecision(decision);
    if (decision.outcome !== 'ALLOW' || decision.execution_admission !== 'ELIGIBLE_CANDIDATE') {
      fail('POLICY_NOT_ALLOWED', `$.policy_decisions[${index}]`, decision.outcome);
    }
    if (Date.parse(decision.expires_at) <= Date.parse(plan.generated_at)) {
      fail('STALE_POLICY_DECISION', `$.policy_decisions[${index}].expires_at`, decision.expires_at);
    }
    const capability = capabilityMap.get(decision.capability_digest);
    if (!capability) fail('POLICY_CAPABILITY_MISMATCH', `$.policy_decisions[${index}].capability_digest`, 'unknown capability');
    const request = requestByDigest.get(decision.request_digest);
    if (!request) fail('POLICY_REQUEST_SUBJECT_MISSING', `$.policy_decisions[${index}].request_digest`, decision.request_digest);
    const recomputed = evaluatePolicy({ request, capability });
    if (recomputed.decision_digest !== decision.decision_digest) {
      fail('POLICY_DECISION_DIVERGENCE', `$.policy_decisions[${index}].decision_digest`, 'does not match deterministic policy evaluation');
    }
    if (decision.approval_required) fail('POLICY_APPROVAL_UNRESOLVED', `$.policy_decisions[${index}].approval_required`, 'cannot compile pending approval');
    decisionByCapability.set(decision.capability_digest, { decision, request });
  });

  if (!Array.isArray(evalPackSubjects) || evalPackSubjects.length === 0) fail('EVAL_SUBJECT_REQUIRED', '$.eval_pack_subjects', 'expected subjects');
  if (!plan || typeof plan !== 'object') fail('WORKFLOW_PLAN_REQUIRED', '$.plan', 'expected plan');
  return { capabilityMap, decisionByCapability, requestByDigest };
}
