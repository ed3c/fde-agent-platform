import { sha256 } from '../../scripts/lib/contract-validation.mjs';
import {
  ACTION_CLASSES,
  policyApprovalSubjectDigest,
  validateConnectorCapability,
  validatePolicyDecision,
  validatePolicyRequest
} from './contract-validation.mjs';

const CLASS = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'];
const rank = (actionClass) => ACTION_CLASSES.indexOf(actionClass);

const makeDecision = (request, capability, outcome, reasons) => {
  const decision = {
    schema: 'fde-agent/policy-decision/v1',
    decision_id: `decision-${request.request_id}`,
    request_digest: sha256(request),
    capability_digest: capability.capability_digest,
    outcome,
    reason_codes: [...new Set(reasons)].sort(),
    effective_action_class: capability.action_class,
    approval_required: outcome === 'APPROVAL_REQUIRED',
    expires_at: new Date(Date.parse(request.requested_at) + 300000).toISOString(),
    decision_digest: '0'.repeat(64),
    execution_admission: outcome === 'ALLOW'
      ? 'ELIGIBLE_CANDIDATE'
      : outcome === 'DENY'
        ? 'DENIED'
        : 'PENDING_HUMAN'
  };
  decision.decision_digest = sha256(decision);
  validatePolicyDecision(decision);
  return decision;
};

export function evaluatePolicy({ request, capability }) {
  validatePolicyRequest(request);
  validateConnectorCapability(capability);
  const denialReasons = [];

  if (capability.tenant_ref !== request.tenant_ref) denialReasons.push('TENANT_MISMATCH');
  if (capability.state !== 'ACTIVE') denialReasons.push('CAPABILITY_NOT_ACTIVE');
  if (capability.operation_id !== request.operation_id) denialReasons.push('UNKNOWN_CAPABILITY');
  if (!request.authenticated) denialReasons.push('CALLER_NOT_AUTHENTICATED');
  if (
    request.authority_envelope.prohibited_action_ids.includes(request.action_id) ||
    capability.action_class === 'PROHIBITED'
  ) denialReasons.push('PROHIBITED_ACTION');
  if (!request.authority_envelope.allowed_action_ids.includes(request.action_id)) {
    denialReasons.push('ACTION_NOT_ALLOWED');
  }
  if (
    rank(request.requested_action_class) > rank(request.authority_envelope.maximum_action_class) ||
    rank(capability.action_class) > rank(request.authority_envelope.maximum_action_class)
  ) denialReasons.push('AUTHORITY_CEILING_EXCEEDED');
  if (request.requested_action_class !== capability.action_class) denialReasons.push('ACTION_CLASS_MISMATCH');

  const system = request.authority_envelope.system_capabilities.find(
    (item) => item.system_id === capability.system_id
  );
  if (!system || !system.operation_ids.includes(capability.operation_id)) {
    denialReasons.push('CAPABILITY_NOT_BOUND');
  }
  if (
    CLASS.indexOf(request.data_classification) >
    CLASS.indexOf(capability.maximum_data_classification)
  ) denialReasons.push('DATA_CLASSIFICATION_EXCEEDED');
  if (!capability.allowed_regions.includes(request.region)) denialReasons.push('REGION_NOT_ALLOWED');
  if (
    capability.idempotency_mode === 'CALLER_KEY_REQUIRED' &&
    !request.idempotency_key_present
  ) denialReasons.push('IDEMPOTENCY_KEY_REQUIRED');

  if (denialReasons.length) return makeDecision(request, capability, 'DENY', denialReasons);

  const needsApproval =
    capability.approval_mode === 'ALWAYS' ||
    capability.action_class === 'APPROVED_COMMIT';
  if (needsApproval) {
    if (['EXPIRED', 'REVOKED'].includes(request.approval.status)) {
      return makeDecision(request, capability, 'DENY', ['APPROVAL_NOT_VALID']);
    }
    if (request.approval.status !== 'CONFIRMED') {
      return makeDecision(request, capability, 'APPROVAL_REQUIRED', ['HUMAN_APPROVAL_REQUIRED']);
    }
    if (request.approval.subject_digest !== policyApprovalSubjectDigest(request)) {
      return makeDecision(request, capability, 'DENY', ['APPROVAL_SUBJECT_MISMATCH']);
    }
    if (!capability.required_approver_roles.includes(request.approval.approver_role)) {
      return makeDecision(request, capability, 'DENY', ['APPROVER_ROLE_MISMATCH']);
    }
    if (
      request.authority_envelope.required_separation_of_duties &&
      request.approval.approver_identity_ref === request.caller_identity_ref
    ) {
      return makeDecision(request, capability, 'DENY', ['SEPARATION_OF_DUTIES_VIOLATION']);
    }
    if (Date.parse(request.approval.expires_at) <= Date.parse(request.requested_at)) {
      return makeDecision(request, capability, 'DENY', ['APPROVAL_EXPIRED']);
    }
  }

  return makeDecision(request, capability, 'ALLOW', []);
}
