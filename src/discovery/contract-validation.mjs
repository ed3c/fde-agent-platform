import { assertNoForbiddenSecrets, canonicalJson, ContractValidationError, sha256 } from '../../scripts/lib/contract-validation.mjs';

const ID = /^[a-z][a-z0-9-]{2,95}$/;
const ACTION_LEVELS = ['OBSERVE', 'RECOMMEND', 'DRAFT', 'REVERSIBLE_ACTION'];
const BASELINE_STATES = ['PROPOSED', 'VERIFIED', 'DISPUTED', 'STALE'];
const COUNTERFACTUAL_METHODS = ['A_B_TEST', 'MATCHED_CONTROL', 'TIME_SERIES', 'BEFORE_AFTER_WITH_ADJUSTMENT'];
const DECISIONS = ['CANDIDATE', 'REJECTED', 'HUMAN_REVIEW_REQUIRED'];
const OPERATORS = ['LT', 'LTE', 'GT', 'GTE', 'EQ'];

const fail = (code, path, message) => { throw new ContractValidationError(code, path, message); };
const plain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const object = (value, path) => { if (!plain(value)) fail('INVALID_TYPE', path, 'expected object'); };
const string = (value, path, pattern) => {
  if (typeof value !== 'string' || value.length === 0) fail('INVALID_TYPE', path, 'expected non-empty string');
  if (pattern && !pattern.test(value)) fail('INVALID_VALUE', path, 'invalid format');
};
const number = (value, path, min, max) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail('INVALID_TYPE', path, 'expected finite number');
  if (min !== undefined && value < min) fail('INVALID_VALUE', path, `must be >= ${min}`);
  if (max !== undefined && value > max) fail('INVALID_VALUE', path, `must be <= ${max}`);
};
const bool = (value, path) => { if (typeof value !== 'boolean') fail('INVALID_TYPE', path, 'expected boolean'); };
const exact = (value, allowed, required, path) => {
  object(value, path);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail('UNEXPECTED_FIELD', `${path}.${key}`, 'not part of contract');
  for (const key of required) if (!(key in value)) fail('MISSING_FIELD', `${path}.${key}`, 'required field absent');
};
const uniqueStrings = (value, path, min = 0) => {
  if (!Array.isArray(value) || value.length < min) fail('INVALID_VALUE', path, `expected at least ${min} item(s)`);
  const seen = new Set();
  value.forEach((item, index) => {
    string(item, `${path}[${index}]`);
    if (seen.has(item)) fail('DUPLICATE_IDENTITY', `${path}[${index}]`, 'duplicate value');
    seen.add(item);
  });
};
const isoDate = (value, path) => { string(value, path); if (Number.isNaN(Date.parse(value))) fail('INVALID_VALUE', path, 'expected ISO-8601 timestamp'); };

export function validateOpportunityCandidate(candidate) {
  assertNoForbiddenSecrets(candidate);
  const keys = ['schema', 'opportunity_id', 'title', 'owners', 'dimensions', 'three_high_signals', 'decision', 'assumptions', 'source_subjects'];
  exact(candidate, keys, keys, '$');
  if (candidate.schema !== 'fde-agent/opportunity-candidate/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected opportunity candidate v1');
  string(candidate.opportunity_id, '$.opportunity_id', ID);
  string(candidate.title, '$.title');
  const ownerKeys = ['executive_sponsor', 'outcome_owner', 'data_owner', 'risk_owner', 'it_owner'];
  exact(candidate.owners, ownerKeys, ownerKeys, '$.owners');
  ownerKeys.forEach((key) => string(candidate.owners[key], `$.owners.${key}`));
  const dimensions = ['value', 'frequency', 'observability', 'controllability', 'reversibility', 'attribution', 'reuse_potential', 'integration_cost', 'risk', 'organizational_resistance'];
  exact(candidate.dimensions, dimensions, dimensions, '$.dimensions');
  dimensions.forEach((key) => number(candidate.dimensions[key], `$.dimensions.${key}`, 1, 5));
  const highKeys = ['high_people_cost', 'high_money_cost', 'high_time_cost'];
  exact(candidate.three_high_signals, highKeys, highKeys, '$.three_high_signals');
  highKeys.forEach((key) => bool(candidate.three_high_signals[key], `$.three_high_signals.${key}`));
  if (!DECISIONS.includes(candidate.decision)) fail('INVALID_VALUE', '$.decision', `expected one of ${DECISIONS.join(', ')}`);
  uniqueStrings(candidate.assumptions, '$.assumptions');
  uniqueStrings(candidate.source_subjects, '$.source_subjects', 1);
  return true;
}

export function scoreOpportunity(candidate) {
  validateOpportunityCandidate(candidate);
  const d = candidate.dimensions;
  const numerator = d.value * d.frequency * d.observability * d.controllability * d.reversibility * d.attribution * d.reuse_potential;
  const denominator = d.integration_cost * d.risk * d.organizational_resistance;
  return Number((numerator / denominator).toFixed(6));
}

export function validateOutcomeCharter(charter) {
  assertNoForbiddenSecrets(charter);
  const keys = ['schema', 'outcome_charter_id', 'opportunity_id', 'baseline', 'counterfactual', 'metrics', 'kill_criteria', 'pricing_eligibility', 'approved_by', 'source_subjects'];
  exact(charter, keys, keys, '$');
  if (charter.schema !== 'fde-agent/outcome-charter/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected outcome charter v1');
  string(charter.outcome_charter_id, '$.outcome_charter_id', ID);
  string(charter.opportunity_id, '$.opportunity_id', ID);

  const baselineKeys = ['state', 'source_of_truth', 'start', 'end', 'owner', 'confidence', 'external_factor_policy'];
  exact(charter.baseline, baselineKeys, baselineKeys, '$.baseline');
  if (!BASELINE_STATES.includes(charter.baseline.state)) fail('INVALID_VALUE', '$.baseline.state', `expected one of ${BASELINE_STATES.join(', ')}`);
  ['source_of_truth', 'owner', 'external_factor_policy'].forEach((key) => string(charter.baseline[key], `$.baseline.${key}`));
  isoDate(charter.baseline.start, '$.baseline.start');
  isoDate(charter.baseline.end, '$.baseline.end');
  if (Date.parse(charter.baseline.start) >= Date.parse(charter.baseline.end)) fail('INVALID_BASELINE_WINDOW', '$.baseline', 'start must precede end');
  number(charter.baseline.confidence, '$.baseline.confidence', 0, 1);

  const counterKeys = ['method', 'control_subject', 'external_factor_policy', 'dispute_owner_role'];
  exact(charter.counterfactual, counterKeys, counterKeys, '$.counterfactual');
  if (!COUNTERFACTUAL_METHODS.includes(charter.counterfactual.method)) fail('INVALID_VALUE', '$.counterfactual.method', 'unsupported method');
  ['control_subject', 'external_factor_policy', 'dispute_owner_role'].forEach((key) => string(charter.counterfactual[key], `$.counterfactual.${key}`));

  if (!Array.isArray(charter.metrics) || charter.metrics.length === 0) fail('INVALID_VALUE', '$.metrics', 'at least one metric required');
  const metricIds = new Set();
  charter.metrics.forEach((metric, index) => {
    const path = `$.metrics[${index}]`;
    const metricKeys = ['metric_id', 'unit', 'grain', 'direction', 'baseline_value', 'target_value', 'source_of_truth', 'owner'];
    exact(metric, metricKeys, metricKeys, path);
    ['metric_id', 'unit', 'grain', 'direction', 'source_of_truth', 'owner'].forEach((key) => string(metric[key], `${path}.${key}`));
    number(metric.baseline_value, `${path}.baseline_value`);
    number(metric.target_value, `${path}.target_value`);
    if (metricIds.has(metric.metric_id)) fail('DUPLICATE_IDENTITY', `${path}.metric_id`, 'duplicate metric');
    metricIds.add(metric.metric_id);
  });

  if (!Array.isArray(charter.kill_criteria) || charter.kill_criteria.length === 0) fail('INVALID_VALUE', '$.kill_criteria', 'at least one kill criterion required');
  const criterionIds = new Set();
  charter.kill_criteria.forEach((criterion, index) => {
    const path = `$.kill_criteria[${index}]`;
    const criterionKeys = ['criterion_id', 'metric_id', 'operator', 'threshold', 'owner', 'reason'];
    exact(criterion, criterionKeys, criterionKeys, path);
    ['criterion_id', 'metric_id', 'owner', 'reason'].forEach((key) => string(criterion[key], `${path}.${key}`));
    if (!metricIds.has(criterion.metric_id)) fail('UNKNOWN_METRIC_REFERENCE', `${path}.metric_id`, 'kill criterion references unknown metric');
    if (!OPERATORS.includes(criterion.operator)) fail('INVALID_VALUE', `${path}.operator`, 'unsupported operator');
    number(criterion.threshold, `${path}.threshold`);
    if (criterionIds.has(criterion.criterion_id)) fail('DUPLICATE_IDENTITY', `${path}.criterion_id`, 'duplicate criterion');
    criterionIds.add(criterion.criterion_id);
  });

  if (!['FIXED_FEE_ONLY', 'OUTCOME_LINKED_CANDIDATE'].includes(charter.pricing_eligibility)) fail('INVALID_VALUE', '$.pricing_eligibility', 'invalid pricing eligibility');
  if (charter.pricing_eligibility === 'OUTCOME_LINKED_CANDIDATE' && charter.baseline.state !== 'VERIFIED') fail('BASELINE_NOT_VERIFIED', '$.baseline.state', 'outcome-linked pricing requires a verified baseline');
  uniqueStrings(charter.approved_by, '$.approved_by', 1);
  uniqueStrings(charter.source_subjects, '$.source_subjects', 1);
  return true;
}

export function validateBoundedValuePilot(plan, opportunity, charter) {
  assertNoForbiddenSecrets(plan);
  validateOpportunityCandidate(opportunity);
  validateOutcomeCharter(charter);
  const keys = ['schema', 'pilot_id', 'opportunity_id', 'outcome_charter_id', 'mode', 'action_ceiling', 'technical_safety_poc_required', 'max_duration_days', 'max_cases', 'entry_criteria', 'exit_criteria', 'kill_criterion_ids', 'allowed_actions', 'state', 'source_subjects'];
  exact(plan, keys, keys, '$');
  if (plan.schema !== 'fde-agent/bounded-value-pilot/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected bounded-value pilot v1');
  string(plan.pilot_id, '$.pilot_id', ID);
  if (plan.opportunity_id !== opportunity.opportunity_id) fail('OPPORTUNITY_REFERENCE_MISMATCH', '$.opportunity_id', 'does not match opportunity');
  if (plan.outcome_charter_id !== charter.outcome_charter_id) fail('CHARTER_REFERENCE_MISMATCH', '$.outcome_charter_id', 'does not match charter');
  if (plan.mode !== 'BOUNDED_VALUE_PILOT') fail('INVALID_VALUE', '$.mode', 'slideware-only POC is not admitted');
  if (!ACTION_LEVELS.includes(plan.action_ceiling)) fail('INVALID_VALUE', '$.action_ceiling', 'unsupported action ceiling');
  bool(plan.technical_safety_poc_required, '$.technical_safety_poc_required');
  number(plan.max_duration_days, '$.max_duration_days', 1, 90);
  number(plan.max_cases, '$.max_cases', 1, 100000);
  uniqueStrings(plan.entry_criteria, '$.entry_criteria', 1);
  uniqueStrings(plan.exit_criteria, '$.exit_criteria', 1);
  uniqueStrings(plan.kill_criterion_ids, '$.kill_criterion_ids', 1);
  const knownCriteria = new Set(charter.kill_criteria.map((criterion) => criterion.criterion_id));
  plan.kill_criterion_ids.forEach((id, index) => { if (!knownCriteria.has(id)) fail('UNKNOWN_KILL_CRITERION', `$.kill_criterion_ids[${index}]`, 'unknown criterion'); });
  uniqueStrings(plan.allowed_actions, '$.allowed_actions');
  if (!['DRAFT', 'READY_FOR_REVIEW', 'REJECTED'].includes(plan.state)) fail('INVALID_VALUE', '$.state', 'invalid pilot state');
  uniqueStrings(plan.source_subjects, '$.source_subjects', 1);

  const highRisk = opportunity.dimensions.risk >= 4 || opportunity.dimensions.reversibility <= 2;
  if (highRisk && !plan.technical_safety_poc_required) fail('SAFETY_POC_REQUIRED', '$.technical_safety_poc_required', 'high-risk or low-reversibility scenario requires safety POC');
  if (highRisk && plan.action_ceiling === 'REVERSIBLE_ACTION') fail('ACTION_CEILING_TOO_HIGH', '$.action_ceiling', 'high-risk first pilot cannot execute actions');
  if (plan.allowed_actions.some((action) => /(?:payment|final-post|delete|overwrite|permission-change)/i.test(action))) fail('PROHIBITED_PILOT_ACTION', '$.allowed_actions', 'irreversible production action forbidden');
  return true;
}

export function assertPilotRevision(previous, next, resultsObserved) {
  validateOutcomeCharter(previous.charter);
  validateOutcomeCharter(next.charter);
  if (resultsObserved && canonicalJson(previous.charter.kill_criteria) !== canonicalJson(next.charter.kill_criteria)) fail('POST_HOC_KILL_CRITERIA_CHANGE', '$.charter.kill_criteria', 'kill criteria cannot change after observing results');
  if (resultsObserved && previous.charter.baseline.source_of_truth !== next.charter.baseline.source_of_truth) fail('POST_HOC_BASELINE_CHANGE', '$.charter.baseline.source_of_truth', 'baseline source cannot change after observing results');
  return true;
}

export const opportunitySubjectDigest = (candidate) => { validateOpportunityCandidate(candidate); return sha256(candidate); };
