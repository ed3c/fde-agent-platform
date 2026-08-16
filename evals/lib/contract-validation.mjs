import { assertNoForbiddenSecrets, canonicalJson, ContractValidationError, sha256 } from '../../scripts/lib/contract-validation.mjs';

const ID = /^[a-z][a-z0-9-]{2,95}$/;
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const DIGEST = /^[a-f0-9]{64}$/;
const LAYERS = ['EVIDENCE', 'PROCESS', 'CONTEXT', 'WORKFLOW', 'POLICY', 'CONNECTOR', 'RUNTIME', 'SECURITY', 'MODEL', 'OUTCOME', 'ARCHITECTURE'];
const ORACLES = ['DETERMINISTIC', 'SYSTEM_STATE', 'HUMAN_LABEL', 'LLM_JUDGE_SUPPLEMENTARY'];
const RESULT_STATES = ['PASS', 'FAIL', 'NOT_EXERCISED', 'SKIPPED_BY_POLICY'];
const PACK_STATES = ['DRAFT', 'VALIDATED', 'ACTIVE', 'SUPERSEDED'];

const fail = (code, path, message) => { throw new ContractValidationError(code, path, message); };
const plain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const object = (value, path) => { if (!plain(value)) fail('INVALID_TYPE', path, 'expected object'); };
const string = (value, path, pattern) => {
  if (typeof value !== 'string' || value.length === 0) fail('INVALID_TYPE', path, 'expected non-empty string');
  if (pattern && !pattern.test(value)) fail('INVALID_VALUE', path, 'invalid format');
};
const number = (value, path, min, max, integer = false) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || (integer && !Number.isInteger(value))) fail('INVALID_TYPE', path, 'expected finite number');
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

export function validateEvalCase(evalCase) {
  assertNoForbiddenSecrets(evalCase);
  const keys = ['schema', 'case_id', 'description', 'fixture_digest', 'oracle_type', 'blocking', 'hard_assertion', 'expected_state', 'mutation_id', 'source_class'];
  exact(evalCase, keys, keys, '$');
  if (evalCase.schema !== 'fde-agent/eval-case/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected eval case v1');
  string(evalCase.case_id, '$.case_id', ID);
  string(evalCase.description, '$.description');
  string(evalCase.fixture_digest, '$.fixture_digest', DIGEST);
  if (!ORACLES.includes(evalCase.oracle_type)) fail('INVALID_VALUE', '$.oracle_type', 'unsupported oracle');
  bool(evalCase.blocking, '$.blocking');
  bool(evalCase.hard_assertion, '$.hard_assertion');
  if (!RESULT_STATES.includes(evalCase.expected_state)) fail('INVALID_VALUE', '$.expected_state', 'invalid expected state');
  if (evalCase.mutation_id !== null) string(evalCase.mutation_id, '$.mutation_id', ID);
  if (!['REPOSITORY_RUNTIME', 'SOURCE_REPORTED_EXTERNAL', 'SYNTHETIC_ANALOG'].includes(evalCase.source_class)) fail('INVALID_VALUE', '$.source_class', 'invalid source class');
  if (evalCase.oracle_type === 'LLM_JUDGE_SUPPLEMENTARY' && evalCase.hard_assertion) fail('MODEL_JUDGE_CANNOT_BE_HARD_ORACLE', '$.hard_assertion', 'LLM judge cannot own a hard assertion');
  return true;
}

export function validateEvalPack(pack, cases) {
  assertNoForbiddenSecrets(pack);
  const keys = ['schema', 'eval_pack_id', 'version', 'layer', 'state', 'subject_contracts', 'case_ids', 'release_thresholds', 'model_judge_policy', 'source_subjects'];
  exact(pack, keys, keys, '$');
  if (pack.schema !== 'fde-agent/eval-pack/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected eval pack v1');
  string(pack.eval_pack_id, '$.eval_pack_id', ID);
  string(pack.version, '$.version', VERSION);
  if (!LAYERS.includes(pack.layer)) fail('INVALID_VALUE', '$.layer', 'unsupported layer');
  if (!PACK_STATES.includes(pack.state)) fail('INVALID_VALUE', '$.state', 'unsupported pack state');
  uniqueStrings(pack.subject_contracts, '$.subject_contracts', 1);
  uniqueStrings(pack.case_ids, '$.case_ids', 1);
  exact(pack.release_thresholds, ['minimum_pass_rate', 'maximum_blocking_failures', 'minimum_mutation_kills'], ['minimum_pass_rate', 'maximum_blocking_failures', 'minimum_mutation_kills'], '$.release_thresholds');
  number(pack.release_thresholds.minimum_pass_rate, '$.release_thresholds.minimum_pass_rate', 0, 1);
  number(pack.release_thresholds.maximum_blocking_failures, '$.release_thresholds.maximum_blocking_failures', 0, undefined, true);
  number(pack.release_thresholds.minimum_mutation_kills, '$.release_thresholds.minimum_mutation_kills', 1, undefined, true);
  exact(pack.model_judge_policy, ['allowed', 'may_override_hard_failure'], ['allowed', 'may_override_hard_failure'], '$.model_judge_policy');
  bool(pack.model_judge_policy.allowed, '$.model_judge_policy.allowed');
  bool(pack.model_judge_policy.may_override_hard_failure, '$.model_judge_policy.may_override_hard_failure');
  if (pack.model_judge_policy.may_override_hard_failure) fail('MODEL_JUDGE_OVERRIDE_FORBIDDEN', '$.model_judge_policy.may_override_hard_failure', 'hard failures cannot be overridden');
  uniqueStrings(pack.source_subjects, '$.source_subjects', 1);

  const byId = new Map();
  cases.forEach((evalCase) => {
    validateEvalCase(evalCase);
    if (byId.has(evalCase.case_id)) fail('DUPLICATE_IDENTITY', '$.case_ids', `duplicate case ${evalCase.case_id}`);
    byId.set(evalCase.case_id, evalCase);
  });
  pack.case_ids.forEach((id, index) => { if (!byId.has(id)) fail('UNKNOWN_CASE_REFERENCE', `$.case_ids[${index}]`, 'case not supplied'); });
  if (cases.some((evalCase) => !pack.case_ids.includes(evalCase.case_id))) fail('UNDECLARED_CASE', '$.case_ids', 'supplied case missing from pack');
  if (!cases.some((evalCase) => evalCase.mutation_id !== null)) fail('MUTATION_CANARY_ABSENT', '$.case_ids', 'at least one planted mutation is required');
  return true;
}

export function validateEvalReceipt(receipt, pack, cases) {
  assertNoForbiddenSecrets(receipt);
  validateEvalPack(pack, cases);
  const keys = ['schema', 'receipt_id', 'eval_pack_ref', 'subject', 'evaluator', 'environment', 'command', 'started_at', 'finished_at', 'case_results', 'mutation_kills', 'coverage', 'overall_state', 'artifact_digest'];
  exact(receipt, keys, keys, '$');
  if (receipt.schema !== 'fde-agent/eval-receipt/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected eval receipt v1');
  string(receipt.receipt_id, '$.receipt_id', ID);
  exact(receipt.eval_pack_ref, ['eval_pack_id', 'version'], ['eval_pack_id', 'version'], '$.eval_pack_ref');
  if (receipt.eval_pack_ref.eval_pack_id !== pack.eval_pack_id || receipt.eval_pack_ref.version !== pack.version) fail('EVAL_PACK_REFERENCE_MISMATCH', '$.eval_pack_ref', 'receipt targets another pack');
  exact(receipt.subject, ['subject_class', 'subject_id', 'digest'], ['subject_class', 'subject_id', 'digest'], '$.subject');
  if (!['REPOSITORY_RUNTIME', 'SOURCE_REPORTED_EXTERNAL', 'SYNTHETIC_ANALOG'].includes(receipt.subject.subject_class)) fail('INVALID_VALUE', '$.subject.subject_class', 'invalid subject class');
  string(receipt.subject.subject_id, '$.subject.subject_id');
  string(receipt.subject.digest, '$.subject.digest', DIGEST);
  exact(receipt.evaluator, ['evaluator_id', 'version'], ['evaluator_id', 'version'], '$.evaluator');
  string(receipt.evaluator.evaluator_id, '$.evaluator.evaluator_id', ID);
  string(receipt.evaluator.version, '$.evaluator.version', VERSION);
  string(receipt.environment, '$.environment');
  string(receipt.command, '$.command');
  isoDate(receipt.started_at, '$.started_at');
  isoDate(receipt.finished_at, '$.finished_at');
  if (Date.parse(receipt.started_at) > Date.parse(receipt.finished_at)) fail('INVALID_TIME_RANGE', '$', 'started_at must precede finished_at');
  if (!Array.isArray(receipt.case_results)) fail('INVALID_TYPE', '$.case_results', 'expected array');
  const caseMap = new Map(cases.map((evalCase) => [evalCase.case_id, evalCase]));
  const seen = new Set();
  receipt.case_results.forEach((result, index) => {
    const path = `$.case_results[${index}]`;
    exact(result, ['case_id', 'state', 'evidence_digest', 'message'], ['case_id', 'state', 'evidence_digest', 'message'], path);
    string(result.case_id, `${path}.case_id`, ID);
    if (!caseMap.has(result.case_id)) fail('UNKNOWN_CASE_REFERENCE', `${path}.case_id`, 'result case not in pack');
    if (seen.has(result.case_id)) fail('DUPLICATE_IDENTITY', `${path}.case_id`, 'duplicate result');
    seen.add(result.case_id);
    if (!RESULT_STATES.includes(result.state)) fail('INVALID_VALUE', `${path}.state`, 'invalid result state');
    if (result.evidence_digest !== null) string(result.evidence_digest, `${path}.evidence_digest`, DIGEST);
    string(result.message, `${path}.message`);
  });
  number(receipt.mutation_kills, '$.mutation_kills', 0, undefined, true);
  exact(receipt.coverage, ['declared_cases', 'executed_cases', 'blocking_cases'], ['declared_cases', 'executed_cases', 'blocking_cases'], '$.coverage');
  number(receipt.coverage.declared_cases, '$.coverage.declared_cases', 0, undefined, true);
  number(receipt.coverage.executed_cases, '$.coverage.executed_cases', 0, undefined, true);
  number(receipt.coverage.blocking_cases, '$.coverage.blocking_cases', 0, undefined, true);
  if (!RESULT_STATES.includes(receipt.overall_state)) fail('INVALID_VALUE', '$.overall_state', 'invalid overall state');
  string(receipt.artifact_digest, '$.artifact_digest', DIGEST);

  if (receipt.coverage.declared_cases !== pack.case_ids.length) fail('DECLARED_COVERAGE_MISMATCH', '$.coverage.declared_cases', 'must equal pack case count');
  const executed = receipt.case_results.filter((result) => ['PASS', 'FAIL'].includes(result.state)).length;
  if (receipt.coverage.executed_cases !== executed) fail('EXECUTED_COVERAGE_MISMATCH', '$.coverage.executed_cases', 'must equal executed results');
  if (seen.size !== pack.case_ids.length) fail('INCOMPLETE_CASE_RESULTS', '$.case_results', 'every declared case needs an explicit result');

  const blockingFailures = receipt.case_results.filter((result) => caseMap.get(result.case_id).blocking && result.state !== 'PASS');
  const hardFailures = receipt.case_results.filter((result) => caseMap.get(result.case_id).hard_assertion && result.state === 'FAIL');
  const passRate = receipt.case_results.filter((result) => result.state === 'PASS').length / receipt.case_results.length;
  const positiveAllowed = blockingFailures.length <= pack.release_thresholds.maximum_blocking_failures
    && hardFailures.length === 0
    && passRate >= pack.release_thresholds.minimum_pass_rate
    && receipt.mutation_kills >= pack.release_thresholds.minimum_mutation_kills;

  if (receipt.subject.subject_class === 'SOURCE_REPORTED_EXTERNAL' && receipt.overall_state === 'PASS') fail('SOURCE_REPORT_CANNOT_BE_RUNTIME_PASS', '$.overall_state', 'external source statement is not repository runtime evidence');
  if (receipt.overall_state === 'PASS' && !positiveAllowed) fail('HOLLOW_PASS', '$.overall_state', 'thresholds, hard assertions, or mutation gate not satisfied');
  if (hardFailures.length > 0 && receipt.overall_state !== 'FAIL') fail('HARD_FAILURE_NOT_PROPAGATED', '$.overall_state', 'hard deterministic failure must fail receipt');
  return true;
}

export function assertEvalPackRevision(previous, next) {
  validateEvalPack(previous.pack, previous.cases);
  validateEvalPack(next.pack, next.cases);
  if (previous.pack.state === 'ACTIVE') {
    if (next.pack.release_thresholds.minimum_pass_rate < previous.pack.release_thresholds.minimum_pass_rate) fail('THRESHOLD_WEAKENED', '$.release_thresholds.minimum_pass_rate', 'active threshold cannot be lowered');
    if (next.pack.release_thresholds.maximum_blocking_failures > previous.pack.release_thresholds.maximum_blocking_failures) fail('THRESHOLD_WEAKENED', '$.release_thresholds.maximum_blocking_failures', 'blocking failure allowance cannot increase');
    const priorBlocking = new Set(previous.cases.filter((evalCase) => evalCase.blocking).map((evalCase) => evalCase.case_id));
    const nextBlocking = new Set(next.cases.filter((evalCase) => evalCase.blocking).map((evalCase) => evalCase.case_id));
    for (const id of priorBlocking) if (!nextBlocking.has(id)) fail('BLOCKING_CASE_REMOVED', '$.case_ids', `${id} no longer blocking`);
  }
  return true;
}

export const evalPackDigest = (pack, cases) => { validateEvalPack(pack, cases); return sha256({ pack, cases }); };
export const receiptCanonicalJson = (receipt) => canonicalJson(receipt);
