import { sha256 } from '../../scripts/lib/contract-validation.mjs';
import { changeSpecDigest, validateChangeSpec, validateWorkflowSpec } from './contract-validation.mjs';

export function compileChangeSpecCandidate({
  change_spec_id: changeSpecId,
  tenant_ref: tenantRef,
  workflow_spec: workflow,
  requester_identity_ref: requesterIdentityRef,
  requester_verified: requesterVerified,
  requester_roles: requesterRoles,
  request_text: requestText,
  requested_delta: requestedDelta,
  affected_node_ids: affectedNodeIds,
  unresolved_questions: unresolvedQuestions,
  unresolved_contradiction_ids: unresolvedContradictionIds,
  policy_impact_subjects: policyImpactSubjects,
  required_tests: requiredTests,
  required_approvals: requiredApprovals,
  fixture_subjects: fixtureSubjects
}) {
  validateWorkflowSpec(workflow);
  const actionClasses = requestedDelta.map((delta) => delta.action_class ?? 'NONE');
  const change = {
    schema: 'fde-agent/change-spec/v1',
    change_spec_id: changeSpecId,
    tenant_ref: tenantRef,
    workflow_spec_digest: workflow.workflow_digest,
    state: 'CANDIDATE',
    source_request: {
      requester_identity_ref: requesterIdentityRef,
      requester_verified: requesterVerified,
      requester_roles: [...requesterRoles],
      request_text_digest: sha256(requestText),
      natural_language_present: true
    },
    requested_delta: requestedDelta.map(({ action_class: _actionClass, ...delta }) => ({ ...delta })),
    affected_node_ids: [...affectedNodeIds],
    unresolved_questions: [...unresolvedQuestions],
    unresolved_contradiction_ids: [...unresolvedContradictionIds],
    blast_radius: {
      workflow_count: 1,
      state_count: new Set(affectedNodeIds).size,
      transition_count: requestedDelta.filter((delta) => delta.target_path.startsWith('/transitions')).length,
      action_classes: [...new Set(actionClasses)],
      tenant_scope: 'SINGLE_TENANT'
    },
    reversibility: actionClasses.some((value) => value === 'APPROVED_COMMIT') ? 'PARTIAL' : 'FULL',
    policy_impact_subjects: [...policyImpactSubjects],
    required_tests: [...requiredTests],
    required_approvals: [...requiredApprovals],
    shadow_plan: {
      required: true,
      fixture_subjects: [...fixtureSubjects],
      divergence_threshold: 0
    },
    canary_plan: {
      maximum_action_class: actionClasses.includes('REVERSIBLE_ACTION') ? 'REVERSIBLE_ACTION' : actionClasses.includes('DRAFT') ? 'DRAFT' : 'RECOMMEND',
      maximum_traffic_percent: 0,
      human_takeover_required: true
    },
    rollback_plan: {
      required: true,
      strategy: 'COMPENSATE',
      trigger_conditions: ['blocking-eval-failed', 'policy-subject-changed', 'postcondition-diverged']
    },
    exact_source_digests: [
      workflow.workflow_digest,
      workflow.source_subjects.process_twin_digest,
      workflow.source_subjects.context_pack_digest,
      workflow.source_subjects.digital_employee_spec_digest,
      ...workflow.source_subjects.policy_request_digests,
      ...workflow.source_subjects.policy_decision_digests,
      ...workflow.source_subjects.connector_capability_digests
    ],
    candidate_digest: '0'.repeat(64),
    execution_authority: 'NONE',
    production_admission: 'HUMAN_ADMIT_REQUIRED'
  };
  change.candidate_digest = changeSpecDigest(change);
  validateChangeSpec(change);
  return change;
}
