import { sha256 } from '../../scripts/lib/contract-validation.mjs';
import { validateSemanticMetricDefinition, validateDataQualityProfile, validateDataReadinessDecision, DataContractError } from './contract-validation.mjs';

const fail=(c,p,m)=>{throw new DataContractError(c,p,m)};

export function evaluateDataReadiness({ metric, profile, requiredCriticalFields, maxAgeSeconds, accessDisposition, semanticState, evaluatorVersion, evaluatedAt, invalidatesEvidenceSubjects=[] }) {
  validateSemanticMetricDefinition(metric);
  validateDataQualityProfile(profile);
  if (metric.scope.tenant_ref !== profile.tenant_ref) fail('TENANT_MISMATCH','$.tenant_ref','metric and profile tenant differ');
  if (metric.scope.process_id !== profile.task_id) fail('TASK_MISMATCH','$.task_id','metric process and profile task differ');
  if (!Array.isArray(requiredCriticalFields) || !requiredCriticalFields.length) fail('MISSING_CRITICAL_FIELDS','$.requiredCriticalFields','at least one field required');
  if (!Number.isInteger(maxAgeSeconds) || maxAgeSeconds < 1) fail('INVALID_MAX_AGE','$.maxAgeSeconds','positive integer required');
  if (!['AUTHORIZED','UNAUTHORIZED','UNKNOWN'].includes(accessDisposition)) fail('INVALID_ACCESS_DISPOSITION','$.accessDisposition','unsupported');
  if (!['CONSISTENT','CONFLICTED','UNKNOWN'].includes(semanticState)) fail('INVALID_SEMANTIC_STATE','$.semanticState','unsupported');

  const fields = new Map(profile.fields.map(x => [x.field_path, x]));
  const blocking = [];
  const degraded = [];
  for (const fieldPath of requiredCriticalFields) {
    const field = fields.get(fieldPath);
    if (!field) { blocking.push(`MISSING_CRITICAL_FIELD:${fieldPath}`); continue; }
    if (!field.critical) blocking.push(`CRITICALITY_NOT_DECLARED:${fieldPath}`);
    if (field.status === 'FAIL' || field.completeness < 1 || field.validity < 1) blocking.push(`CRITICAL_FIELD_FAILED:${fieldPath}`);
    else if (field.status === 'DEGRADED' || field.consistency < 1) degraded.push(`CRITICAL_FIELD_DEGRADED:${fieldPath}`);
    if (field.observed_age_seconds > maxAgeSeconds) blocking.push(`CRITICAL_FIELD_STALE:${fieldPath}`);
  }
  for (const field of profile.fields) {
    if (!field.critical && field.status === 'FAIL') degraded.push(`NONCRITICAL_FIELD_FAILED:${field.field_path}`);
    else if (!field.critical && field.status === 'DEGRADED') degraded.push(`NONCRITICAL_FIELD_DEGRADED:${field.field_path}`);
  }
  if (accessDisposition !== 'AUTHORIZED') blocking.push(`ACCESS_${accessDisposition}`);
  if (semanticState !== 'CONSISTENT') blocking.push(`SEMANTIC_${semanticState}`);

  const freshnessState = profile.fields.some(f => f.critical && f.observed_age_seconds > maxAgeSeconds) ? 'STALE' : 'FRESH';
  const state = blocking.length ? 'BLOCKED' : degraded.length ? 'DEGRADED' : 'READY';
  const input = { metric, profile, requiredCriticalFields:[...requiredCriticalFields].sort(), maxAgeSeconds, accessDisposition, semanticState, evaluatorVersion };
  const decision = {
    schema:'fde-agent/data-readiness-decision/v1',
    readiness_id:`readiness-${profile.profile_id}-${metric.version}`,
    tenant_ref:profile.tenant_ref,
    task_id:profile.task_id,
    metric_ref:{metric_id:metric.metric_id,version:metric.version,digest:sha256(metric)},
    profile_ref:{profile_id:profile.profile_id,digest:sha256(profile)},
    access_disposition:accessDisposition,
    semantic_state:semanticState,
    freshness_state:freshnessState,
    state,
    blocking_reasons:[...new Set(blocking)].sort(),
    degraded_reasons:[...new Set(degraded)].sort(),
    evaluated_at:evaluatedAt,
    evaluator_version:evaluatorVersion,
    input_digest:sha256(input),
    invalidates_evidence_subjects:[...new Set(invalidatesEvidenceSubjects)].sort()
  };
  validateDataReadinessDecision(decision);
  return decision;
}
