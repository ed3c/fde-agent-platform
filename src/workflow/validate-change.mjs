import { assertNoForbiddenSecrets } from '../../scripts/lib/contract-validation.mjs';
import {
  ID, DIGEST, ACTION_CLASSES, fail, exact, str, bool, integer, number,
  enumValue, strings, assertNoArbitraryCode
} from './validation-common.mjs';
import { changeSpecDigest } from './normalization.mjs';

export function validateChangeSpec(change) {
  assertNoForbiddenSecrets(change);
  assertNoArbitraryCode(change);
  const keys = [
    'schema', 'change_spec_id', 'tenant_ref', 'workflow_spec_digest', 'state',
    'source_request', 'requested_delta', 'affected_node_ids', 'unresolved_questions',
    'unresolved_contradiction_ids', 'blast_radius', 'reversibility', 'policy_impact_subjects',
    'required_tests', 'required_approvals', 'shadow_plan', 'canary_plan', 'rollback_plan',
    'exact_source_digests', 'candidate_digest', 'execution_authority', 'production_admission'
  ];
  exact(change, keys, '$');
  if (change.schema !== 'fde-agent/change-spec/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected change-spec/v1');
  str(change.change_spec_id, '$.change_spec_id', ID);
  str(change.tenant_ref, '$.tenant_ref');
  str(change.workflow_spec_digest, '$.workflow_spec_digest', DIGEST);
  enumValue(change.state, ['CANDIDATE', 'VALIDATED', 'REFUSED'], '$.state');

  exact(change.source_request, ['requester_identity_ref', 'requester_verified', 'requester_roles', 'request_text_digest', 'natural_language_present'], '$.source_request');
  str(change.source_request.requester_identity_ref, '$.source_request.requester_identity_ref');
  bool(change.source_request.requester_verified, '$.source_request.requester_verified');
  strings(change.source_request.requester_roles, '$.source_request.requester_roles');
  str(change.source_request.request_text_digest, '$.source_request.request_text_digest', DIGEST);
  bool(change.source_request.natural_language_present, '$.source_request.natural_language_present');

  if (!Array.isArray(change.requested_delta) || change.requested_delta.length < 1) fail('INVALID_VALUE', '$.requested_delta', 'expected delta');
  change.requested_delta.forEach((delta, index) => {
    const path = `$.requested_delta[${index}]`;
    exact(delta, ['operation', 'target_path', 'candidate_value_digest'], path);
    enumValue(delta.operation, ['ADD', 'REMOVE', 'REPLACE'], `${path}.operation`);
    str(delta.target_path, `${path}.target_path`, /^\/(states|transitions|controlled_cycles|rollback|reconciliation|release_gates)(\/.*)?$/);
    str(delta.candidate_value_digest, `${path}.candidate_value_digest`, DIGEST);
    if (/\/(execution_authority|production_admission|source_subjects)(\/|$)/.test(delta.target_path)) {
      fail('PROTECTED_PATH_MUTATION', `${path}.target_path`, 'cannot change authority or source identity');
    }
  });
  strings(change.affected_node_ids, '$.affected_node_ids');
  strings(change.unresolved_questions, '$.unresolved_questions');
  strings(change.unresolved_contradiction_ids, '$.unresolved_contradiction_ids');

  exact(change.blast_radius, ['workflow_count', 'state_count', 'transition_count', 'action_classes', 'tenant_scope'], '$.blast_radius');
  integer(change.blast_radius.workflow_count, '$.blast_radius.workflow_count', 1, 100);
  integer(change.blast_radius.state_count, '$.blast_radius.state_count', 0, 10000);
  integer(change.blast_radius.transition_count, '$.blast_radius.transition_count', 0, 10000);
  if (!Array.isArray(change.blast_radius.action_classes)) fail('INVALID_TYPE', '$.blast_radius.action_classes', 'expected array');
  change.blast_radius.action_classes.forEach((actionClass, index) => enumValue(actionClass, ACTION_CLASSES, `$.blast_radius.action_classes[${index}]`));
  if (change.blast_radius.action_classes.includes('PROHIBITED')) fail('PROHIBITED_ACTION_CLASS', '$.blast_radius.action_classes', 'cannot request prohibited action');
  if (change.blast_radius.tenant_scope !== 'SINGLE_TENANT') fail('TENANT_SCOPE_WIDENED', '$.blast_radius.tenant_scope', 'single tenant only');

  enumValue(change.reversibility, ['FULL', 'PARTIAL', 'NONE'], '$.reversibility');
  strings(change.policy_impact_subjects, '$.policy_impact_subjects');
  strings(change.required_tests, '$.required_tests', 1);
  strings(change.required_approvals, '$.required_approvals');

  exact(change.shadow_plan, ['required', 'fixture_subjects', 'divergence_threshold'], '$.shadow_plan');
  bool(change.shadow_plan.required, '$.shadow_plan.required');
  if (!change.shadow_plan.required) fail('SHADOW_REQUIRED', '$.shadow_plan.required', 'must remain true');
  strings(change.shadow_plan.fixture_subjects, '$.shadow_plan.fixture_subjects', 1);
  number(change.shadow_plan.divergence_threshold, '$.shadow_plan.divergence_threshold', 0, 1);

  exact(change.canary_plan, ['maximum_action_class', 'maximum_traffic_percent', 'human_takeover_required'], '$.canary_plan');
  enumValue(change.canary_plan.maximum_action_class, ['NONE', 'READ', 'RECOMMEND', 'DRAFT', 'REVERSIBLE_ACTION'], '$.canary_plan.maximum_action_class');
  number(change.canary_plan.maximum_traffic_percent, '$.canary_plan.maximum_traffic_percent', 0, 100);
  bool(change.canary_plan.human_takeover_required, '$.canary_plan.human_takeover_required');
  if (!change.canary_plan.human_takeover_required) fail('HUMAN_TAKEOVER_REQUIRED', '$.canary_plan.human_takeover_required', 'must remain true');

  exact(change.rollback_plan, ['required', 'strategy', 'trigger_conditions'], '$.rollback_plan');
  bool(change.rollback_plan.required, '$.rollback_plan.required');
  if (!change.rollback_plan.required) fail('ROLLBACK_REQUIRED', '$.rollback_plan.required', 'must remain true');
  enumValue(change.rollback_plan.strategy, ['COMPENSATE', 'RESTORE_SNAPSHOT', 'HUMAN_ONLY'], '$.rollback_plan.strategy');
  strings(change.rollback_plan.trigger_conditions, '$.rollback_plan.trigger_conditions', 1);
  strings(change.exact_source_digests, '$.exact_source_digests', 1, DIGEST);

  if (change.state === 'VALIDATED') {
    if (!change.source_request.requester_verified) fail('REQUESTER_UNVERIFIED', '$.source_request.requester_verified', 'validated change requires verified requester');
    if (change.unresolved_questions.length || change.unresolved_contradiction_ids.length) {
      fail('UNRESOLVED_CHANGE_INPUT', '$', 'validated change cannot retain unresolved questions/contradictions');
    }
    if (change.policy_impact_subjects.length > 0 && change.required_approvals.length === 0) {
      fail('CHANGE_APPROVAL_REQUIRED', '$.required_approvals', 'policy-impacting change needs approval');
    }
  }
  if (change.source_request.natural_language_present && change.execution_authority !== 'NONE') {
    fail('NATURAL_LANGUAGE_EXECUTION_FORBIDDEN', '$.execution_authority', 'natural language remains candidate-only');
  }
  str(change.candidate_digest, '$.candidate_digest', DIGEST);
  if (change.candidate_digest !== changeSpecDigest(change)) {
    fail('CHANGE_DIGEST_MISMATCH', '$.candidate_digest', 'digest does not bind change');
  }
  if (change.execution_authority !== 'NONE') fail('AUTHORITY_WIDENING', '$.execution_authority', 'must remain NONE');
  if (change.production_admission !== 'HUMAN_ADMIT_REQUIRED') fail('PRODUCTION_ADMISSION_WIDENED', '$.production_admission', 'Human admission required');
  return true;
}
