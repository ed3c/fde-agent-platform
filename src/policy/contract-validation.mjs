import { assertNoForbiddenSecrets, ContractValidationError, sha256 } from '../../scripts/lib/contract-validation.mjs';

const ID = /^[a-z][a-z0-9-]{2,95}$/;
const DIGEST = /^[a-f0-9]{64}$/;
export const ACTION_CLASSES = ['READ', 'RECOMMEND', 'DRAFT', 'REVERSIBLE_ACTION', 'APPROVED_COMMIT', 'PROHIBITED'];
const CLASS = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'];
const fail = (code, path, message) => { throw new ContractValidationError(code, path, message); };
const plain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const exact = (value, keys, path) => {
  if (!plain(value)) fail('INVALID_TYPE', path, 'expected object');
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail('UNEXPECTED_FIELD', `${path}.${key}`, 'not part of contract');
  for (const key of keys) if (!(key in value)) fail('MISSING_FIELD', `${path}.${key}`, 'required');
};
const str = (value, path, pattern) => {
  if (typeof value !== 'string' || !value) fail('INVALID_TYPE', path, 'expected string');
  if (pattern && !pattern.test(value)) fail('INVALID_VALUE', path, 'invalid format');
};
const bool = (value, path) => { if (typeof value !== 'boolean') fail('INVALID_TYPE', path, 'expected boolean'); };
const arrStr = (value, path, minimum = 0) => {
  if (!Array.isArray(value) || value.length < minimum) fail('INVALID_VALUE', path, `expected ${minimum}+`);
  const seen = new Set();
  value.forEach((item, index) => {
    str(item, `${path}[${index}]`);
    if (seen.has(item)) fail('DUPLICATE_IDENTITY', `${path}[${index}]`, 'duplicate');
    seen.add(item);
  });
};
const iso = (value, path) => {
  str(value, path);
  if (Number.isNaN(Date.parse(value))) fail('INVALID_VALUE', path, 'expected ISO timestamp');
};

export function validateConnectorCapability(capability) {
  assertNoForbiddenSecrets(capability);
  const keys = [
    'schema', 'capability_id', 'tenant_ref', 'connector_id', 'system_id', 'connector_version',
    'operation_id', 'action_class', 'side_effect_class', 'reversible', 'idempotency_mode',
    'compensation_operation_id', 'audit_required', 'sandbox_supported',
    'maximum_data_classification', 'allowed_regions', 'retention_mode', 'approval_mode',
    'required_approver_roles', 'postcondition_observer', 'state', 'capability_digest'
  ];
  exact(capability, keys, '$');
  if (capability.schema !== 'fde-agent/connector-capability/v1') {
    fail('SCHEMA_MISMATCH', '$.schema', 'expected connector capability');
  }
  for (const [key, pattern] of [
    ['capability_id', ID], ['tenant_ref', null], ['connector_id', ID], ['system_id', ID],
    ['connector_version', null], ['operation_id', ID]
  ]) str(capability[key], `$.${key}`, pattern);
  if (!ACTION_CLASSES.includes(capability.action_class)) fail('INVALID_VALUE', '$.action_class', 'unknown action class');
  if (!['NONE', 'REVERSIBLE', 'IRREVERSIBLE'].includes(capability.side_effect_class)) fail('INVALID_VALUE', '$.side_effect_class', 'unknown side effect');
  bool(capability.reversible, '$.reversible');
  if (!['NOT_APPLICABLE', 'CALLER_KEY_REQUIRED', 'CONNECTOR_GUARANTEED'].includes(capability.idempotency_mode)) fail('INVALID_VALUE', '$.idempotency_mode', 'unknown idempotency mode');
  if (capability.compensation_operation_id !== null) str(capability.compensation_operation_id, '$.compensation_operation_id', ID);
  bool(capability.audit_required, '$.audit_required');
  bool(capability.sandbox_supported, '$.sandbox_supported');
  if (!CLASS.includes(capability.maximum_data_classification)) fail('INVALID_VALUE', '$.maximum_data_classification', 'unknown classification');
  arrStr(capability.allowed_regions, '$.allowed_regions', 1);
  if (!['ZERO', 'BOUNDED', 'LOCAL_ONLY'].includes(capability.retention_mode)) fail('INVALID_VALUE', '$.retention_mode', 'unknown retention');
  if (!['NEVER', 'CONDITIONAL', 'ALWAYS'].includes(capability.approval_mode)) fail('INVALID_VALUE', '$.approval_mode', 'unknown approval');
  arrStr(capability.required_approver_roles, '$.required_approver_roles');
  if (capability.postcondition_observer !== null) str(capability.postcondition_observer, '$.postcondition_observer', ID);
  if (!['DRAFT', 'ACTIVE', 'DEPRECATED', 'REVOKED'].includes(capability.state)) fail('INVALID_VALUE', '$.state', 'unknown state');
  str(capability.capability_digest, '$.capability_digest', DIGEST);
  const digestCandidate = structuredClone(capability);
  digestCandidate.capability_digest = '0'.repeat(64);
  if (sha256(digestCandidate) !== capability.capability_digest) fail('CAPABILITY_DIGEST_MISMATCH', '$.capability_digest', 'digest mismatch');

  if (['READ', 'RECOMMEND'].includes(capability.action_class) && capability.side_effect_class !== 'NONE') {
    fail('SIDE_EFFECT_CLASS_MISMATCH', '$.side_effect_class', 'read/recommend must have no side effect');
  }
  if (capability.side_effect_class === 'NONE' && capability.idempotency_mode !== 'NOT_APPLICABLE') {
    fail('IDEMPOTENCY_MODE_MISMATCH', '$.idempotency_mode', 'no-side-effect operation uses N/A');
  }
  if (capability.side_effect_class !== 'NONE' && capability.idempotency_mode === 'NOT_APPLICABLE') {
    fail('IDEMPOTENCY_REQUIRED', '$.idempotency_mode', 'side effect requires idempotency');
  }
  if (
    capability.side_effect_class === 'REVERSIBLE' &&
    (!capability.reversible || capability.compensation_operation_id === null)
  ) {
    fail('COMPENSATION_REQUIRED', '$.compensation_operation_id', 'reversible side effect needs compensation');
  }
  if (
    capability.side_effect_class === 'IRREVERSIBLE' &&
    !['APPROVED_COMMIT', 'PROHIBITED'].includes(capability.action_class)
  ) {
    fail('IRREVERSIBLE_AUTONOMY_FORBIDDEN', '$.action_class', 'irreversible action requires approved commit or prohibition');
  }
  if (capability.side_effect_class !== 'NONE' && capability.postcondition_observer === null) {
    fail('POSTCONDITION_OBSERVER_REQUIRED', '$.postcondition_observer', 'side effect requires observer');
  }
  if (
    capability.action_class === 'APPROVED_COMMIT' &&
    (capability.approval_mode !== 'ALWAYS' || capability.required_approver_roles.length === 0)
  ) {
    fail('APPROVAL_REQUIRED', '$.approval_mode', 'approved commit requires approver');
  }
  return true;
}

export function policyApprovalSubjectDigest(request) {
  const copy = structuredClone(request);
  copy.approval = {
    status: 'NONE',
    approver_identity_ref: null,
    approver_role: null,
    subject_digest: null,
    expires_at: null
  };
  return sha256(copy);
}

export function validatePolicyRequest(request) {
  assertNoForbiddenSecrets(request);
  const keys = [
    'schema', 'request_id', 'tenant_ref', 'digital_employee_spec_digest', 'context_pack_digest',
    'policy_subjects', 'action_id', 'operation_id', 'requested_action_class',
    'caller_identity_ref', 'caller_roles', 'authenticated', 'requested_at',
    'data_classification', 'region', 'operation_identity', 'idempotency_key_present',
    'approval', 'authority_envelope'
  ];
  exact(request, keys, '$');
  if (request.schema !== 'fde-agent/policy-request/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected policy request');
  str(request.request_id, '$.request_id', ID);
  str(request.tenant_ref, '$.tenant_ref');
  str(request.digital_employee_spec_digest, '$.digital_employee_spec_digest', DIGEST);
  str(request.context_pack_digest, '$.context_pack_digest', DIGEST);
  arrStr(request.policy_subjects, '$.policy_subjects', 1);
  str(request.action_id, '$.action_id', ID);
  str(request.operation_id, '$.operation_id', ID);
  if (!ACTION_CLASSES.includes(request.requested_action_class)) fail('INVALID_VALUE', '$.requested_action_class', 'unknown action class');
  str(request.caller_identity_ref, '$.caller_identity_ref');
  arrStr(request.caller_roles, '$.caller_roles', 1);
  bool(request.authenticated, '$.authenticated');
  iso(request.requested_at, '$.requested_at');
  if (!CLASS.includes(request.data_classification)) fail('INVALID_VALUE', '$.data_classification', 'unknown classification');
  str(request.region, '$.region');
  str(request.operation_identity, '$.operation_identity');
  bool(request.idempotency_key_present, '$.idempotency_key_present');

  exact(request.approval, ['status', 'approver_identity_ref', 'approver_role', 'subject_digest', 'expires_at'], '$.approval');
  if (!['NONE', 'PENDING', 'CONFIRMED', 'EXPIRED', 'REVOKED'].includes(request.approval.status)) fail('INVALID_VALUE', '$.approval.status', 'unknown approval status');
  for (const key of ['approver_identity_ref', 'approver_role', 'subject_digest', 'expires_at']) {
    if (request.approval[key] === null) continue;
    if (key === 'subject_digest') str(request.approval[key], `$.approval.${key}`, DIGEST);
    else if (key === 'expires_at') iso(request.approval[key], `$.approval.${key}`);
    else str(request.approval[key], `$.approval.${key}`);
  }

  exact(
    request.authority_envelope,
    ['allowed_action_ids', 'prohibited_action_ids', 'maximum_action_class', 'system_capabilities', 'required_separation_of_duties', 'model_decision_permitted'],
    '$.authority_envelope'
  );
  arrStr(request.authority_envelope.allowed_action_ids, '$.authority_envelope.allowed_action_ids');
  arrStr(request.authority_envelope.prohibited_action_ids, '$.authority_envelope.prohibited_action_ids');
  if (!ACTION_CLASSES.includes(request.authority_envelope.maximum_action_class)) fail('INVALID_VALUE', '$.authority_envelope.maximum_action_class', 'unknown class');
  if (!Array.isArray(request.authority_envelope.system_capabilities)) fail('INVALID_TYPE', '$.authority_envelope.system_capabilities', 'expected array');
  request.authority_envelope.system_capabilities.forEach((system, index) => {
    const path = `$.authority_envelope.system_capabilities[${index}]`;
    exact(system, ['system_id', 'operation_ids'], path);
    str(system.system_id, `${path}.system_id`, ID);
    arrStr(system.operation_ids, `${path}.operation_ids`, 1);
  });
  bool(request.authority_envelope.required_separation_of_duties, '$.authority_envelope.required_separation_of_duties');
  bool(request.authority_envelope.model_decision_permitted, '$.authority_envelope.model_decision_permitted');
  if (request.authority_envelope.model_decision_permitted) {
    fail('MODEL_AUTHORITY_FORBIDDEN', '$.authority_envelope.model_decision_permitted', 'model cannot decide policy');
  }
  return true;
}

export function validatePolicyDecision(decision) {
  assertNoForbiddenSecrets(decision);
  const keys = [
    'schema', 'decision_id', 'request_digest', 'capability_digest', 'outcome',
    'reason_codes', 'effective_action_class', 'approval_required', 'expires_at',
    'decision_digest', 'execution_admission'
  ];
  exact(decision, keys, '$');
  if (decision.schema !== 'fde-agent/policy-decision/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected policy decision');
  str(decision.decision_id, '$.decision_id', ID);
  str(decision.request_digest, '$.request_digest', DIGEST);
  str(decision.capability_digest, '$.capability_digest', DIGEST);
  if (!['ALLOW', 'DENY', 'APPROVAL_REQUIRED'].includes(decision.outcome)) fail('INVALID_VALUE', '$.outcome', 'unknown outcome');
  arrStr(decision.reason_codes, '$.reason_codes');
  if (!ACTION_CLASSES.includes(decision.effective_action_class)) fail('INVALID_VALUE', '$.effective_action_class', 'unknown class');
  bool(decision.approval_required, '$.approval_required');
  iso(decision.expires_at, '$.expires_at');
  str(decision.decision_digest, '$.decision_digest', DIGEST);
  if (!['ELIGIBLE_CANDIDATE', 'DENIED', 'PENDING_HUMAN'].includes(decision.execution_admission)) fail('INVALID_VALUE', '$.execution_admission', 'unknown admission');
  const digestCandidate = structuredClone(decision);
  digestCandidate.decision_digest = '0'.repeat(64);
  if (sha256(digestCandidate) !== decision.decision_digest) fail('DECISION_DIGEST_MISMATCH', '$.decision_digest', 'digest mismatch');
  if (decision.outcome === 'ALLOW' && decision.execution_admission !== 'ELIGIBLE_CANDIDATE') fail('DECISION_STATE_MISMATCH', '$.execution_admission', 'allow must be eligible candidate');
  if (decision.outcome === 'DENY' && decision.execution_admission !== 'DENIED') fail('DECISION_STATE_MISMATCH', '$.execution_admission', 'deny must be denied');
  if (decision.outcome === 'APPROVAL_REQUIRED' && decision.execution_admission !== 'PENDING_HUMAN') fail('DECISION_STATE_MISMATCH', '$.execution_admission', 'approval required must wait Human');
  return true;
}
