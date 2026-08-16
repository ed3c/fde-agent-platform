import {
  assertNoForbiddenSecrets,
  canonicalJson,
  ContractValidationError,
  sha256
} from '../../scripts/lib/contract-validation.mjs';

const ID = /^[a-z][a-z0-9-]{2,95}$/;
const DIGEST = /^[a-f0-9]{64}$/;
const VIEWS = ['DOCUMENTED', 'OBSERVED', 'SYSTEM_ENFORCED', 'APPROVED_TARGET'];
const CLASS = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'];
const QUERY_KEYS = [
  'schema', 'query_id', 'tenant_ref', 'task_subject', 'process_twin_digest',
  'required_node_ids', 'optional_node_ids', 'requested_views', 'mandatory_policy_subjects',
  'as_of', 'max_nodes', 'max_tokens', 'max_data_classification',
  'contradiction_policy', 'decision_use'
];
const PACK_KEYS = [
  'schema', 'context_pack_id', 'tenant_ref', 'task_subject', 'process_twin_digest',
  'query_digest', 'state', 'selected_nodes', 'selected_claims', 'unresolved_contradictions',
  'omitted_optional_nodes', 'mandatory_policy_subjects', 'budget', 'authority_envelope',
  'refusal_reasons', 'context_digest', 'execution_authority'
];

const fail = (code, path, message) => {
  throw new ContractValidationError(code, path, message);
};
const plain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const exact = (value, keys, path) => {
  if (!plain(value)) fail('INVALID_TYPE', path, 'expected object');
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) fail('UNEXPECTED_FIELD', `${path}.${key}`, 'not part of contract');
  }
  for (const key of keys) {
    if (!(key in value)) fail('MISSING_FIELD', `${path}.${key}`, 'required field absent');
  }
};
const string = (value, path, pattern) => {
  if (typeof value !== 'string' || !value) fail('INVALID_TYPE', path, 'expected non-empty string');
  if (pattern && !pattern.test(value)) fail('INVALID_VALUE', path, 'invalid format');
};
const integer = (value, path, minimum = 0) => {
  if (!Number.isInteger(value) || value < minimum) {
    fail('INVALID_VALUE', path, `expected integer >= ${minimum}`);
  }
};
const strings = (value, path, minimum = 0) => {
  if (!Array.isArray(value) || value.length < minimum) {
    fail('INVALID_VALUE', path, `expected at least ${minimum} items`);
  }
  const seen = new Set();
  value.forEach((item, index) => {
    string(item, `${path}[${index}]`);
    if (seen.has(item)) fail('DUPLICATE_IDENTITY', `${path}[${index}]`, 'duplicate');
    seen.add(item);
  });
};
const iso = (value, path) => {
  string(value, path);
  if (Number.isNaN(Date.parse(value))) fail('INVALID_VALUE', path, 'expected ISO timestamp');
};

export function validateContextQuery(query) {
  assertNoForbiddenSecrets(query);
  exact(query, QUERY_KEYS, '$');
  if (query.schema !== 'fde-agent/context-query/v1') {
    fail('SCHEMA_MISMATCH', '$.schema', 'expected context-query/v1');
  }
  string(query.query_id, '$.query_id', ID);
  string(query.tenant_ref, '$.tenant_ref');
  string(query.task_subject, '$.task_subject');
  string(query.process_twin_digest, '$.process_twin_digest', DIGEST);
  strings(query.required_node_ids, '$.required_node_ids', 1);
  strings(query.optional_node_ids, '$.optional_node_ids');
  strings(query.requested_views, '$.requested_views', 1);
  query.requested_views.forEach((view, index) => {
    if (!VIEWS.includes(view)) fail('INVALID_VALUE', `$.requested_views[${index}]`, 'unknown view');
  });
  strings(query.mandatory_policy_subjects, '$.mandatory_policy_subjects');
  iso(query.as_of, '$.as_of');
  integer(query.max_nodes, '$.max_nodes', 1);
  integer(query.max_tokens, '$.max_tokens', 1);
  if (!CLASS.includes(query.max_data_classification)) {
    fail('INVALID_VALUE', '$.max_data_classification', 'unknown classification');
  }
  if (!['REFUSE', 'INCLUDE_AND_DEGRADE'].includes(query.contradiction_policy)) {
    fail('INVALID_VALUE', '$.contradiction_policy', 'unknown contradiction policy');
  }
  if (!['EXPLORATORY', 'RELEASE_BLOCKING'].includes(query.decision_use)) {
    fail('INVALID_VALUE', '$.decision_use', 'unknown decision use');
  }
  const overlap = query.required_node_ids.filter((id) => query.optional_node_ids.includes(id));
  if (overlap.length) fail('NODE_SCOPE_OVERLAP', '$.optional_node_ids', overlap.join(','));
  if (query.max_nodes < query.required_node_ids.length) {
    fail('NODE_BUDGET_TOO_SMALL', '$.max_nodes', 'smaller than required nodes');
  }
  if (query.decision_use === 'RELEASE_BLOCKING' && query.contradiction_policy !== 'REFUSE') {
    fail(
      'UNSAFE_CONTRADICTION_POLICY',
      '$.contradiction_policy',
      'release-blocking context must refuse contradictions'
    );
  }
  return true;
}

export function validateContextPack(pack) {
  assertNoForbiddenSecrets(pack);
  exact(pack, PACK_KEYS, '$');
  if (pack.schema !== 'fde-agent/context-pack/v1') {
    fail('SCHEMA_MISMATCH', '$.schema', 'expected context-pack/v1');
  }
  string(pack.context_pack_id, '$.context_pack_id', ID);
  string(pack.tenant_ref, '$.tenant_ref');
  string(pack.task_subject, '$.task_subject');
  string(pack.process_twin_digest, '$.process_twin_digest', DIGEST);
  string(pack.query_digest, '$.query_digest', DIGEST);
  if (!['READY', 'DEGRADED', 'REFUSED'].includes(pack.state)) {
    fail('INVALID_VALUE', '$.state', 'unknown state');
  }
  if (
    !Array.isArray(pack.selected_nodes) ||
    !Array.isArray(pack.selected_claims) ||
    !Array.isArray(pack.unresolved_contradictions)
  ) {
    fail('INVALID_TYPE', '$', 'selection arrays required');
  }

  const nodeIds = new Set();
  pack.selected_nodes.forEach((node, index) => {
    const path = `$.selected_nodes[${index}]`;
    exact(node, ['node_id', 'view', 'owner_role', 'source_claim_ids', 'estimated_tokens', 'reason'], path);
    string(node.node_id, `${path}.node_id`, ID);
    if (nodeIds.has(node.node_id)) fail('DUPLICATE_IDENTITY', `${path}.node_id`, 'duplicate');
    nodeIds.add(node.node_id);
    if (!VIEWS.includes(node.view)) fail('INVALID_VALUE', `${path}.view`, 'unknown view');
    string(node.owner_role, `${path}.owner_role`);
    strings(node.source_claim_ids, `${path}.source_claim_ids`, 1);
    integer(node.estimated_tokens, `${path}.estimated_tokens`, 1);
    if (!['REQUIRED', 'DEPENDENCY', 'OPTIONAL'].includes(node.reason)) {
      fail('INVALID_VALUE', `${path}.reason`, 'unknown selection reason');
    }
  });

  const claimIds = new Set();
  pack.selected_claims.forEach((claim, index) => {
    const path = `$.selected_claims[${index}]`;
    exact(
      claim,
      [
        'claim_id', 'claim_digest', 'source_id', 'recorded_at', 'valid_from',
        'valid_to', 'data_classification', 'readiness_state'
      ],
      path
    );
    string(claim.claim_id, `${path}.claim_id`);
    if (claimIds.has(claim.claim_id)) fail('DUPLICATE_IDENTITY', `${path}.claim_id`, 'duplicate');
    claimIds.add(claim.claim_id);
    string(claim.claim_digest, `${path}.claim_digest`, DIGEST);
    string(claim.source_id, `${path}.source_id`);
    iso(claim.recorded_at, `${path}.recorded_at`);
    iso(claim.valid_from, `${path}.valid_from`);
    if (claim.valid_to !== null) iso(claim.valid_to, `${path}.valid_to`);
    if (!CLASS.includes(claim.data_classification)) {
      fail('INVALID_VALUE', `${path}.data_classification`, 'unknown classification');
    }
    if (!['READY', 'DEGRADED'].includes(claim.readiness_state)) {
      fail('INVALID_VALUE', `${path}.readiness_state`, 'claim not context-admissible');
    }
  });

  pack.unresolved_contradictions.forEach((contradiction, index) => {
    const path = `$.unresolved_contradictions[${index}]`;
    exact(contradiction, ['contradiction_id', 'claim_ids', 'subject_id', 'predicate'], path);
    string(contradiction.contradiction_id, `${path}.contradiction_id`);
    strings(contradiction.claim_ids, `${path}.claim_ids`, 2);
    string(contradiction.subject_id, `${path}.subject_id`);
    string(contradiction.predicate, `${path}.predicate`);
  });

  strings(pack.omitted_optional_nodes, '$.omitted_optional_nodes');
  strings(pack.mandatory_policy_subjects, '$.mandatory_policy_subjects');
  exact(pack.budget, ['max_nodes', 'used_nodes', 'max_tokens', 'used_tokens'], '$.budget');
  integer(pack.budget.max_nodes, '$.budget.max_nodes', 1);
  integer(pack.budget.used_nodes, '$.budget.used_nodes', 0);
  integer(pack.budget.max_tokens, '$.budget.max_tokens', 1);
  integer(pack.budget.used_tokens, '$.budget.used_tokens', 0);
  if (
    pack.budget.used_nodes > pack.budget.max_nodes ||
    pack.budget.used_tokens > pack.budget.max_tokens
  ) {
    fail('BUDGET_OVERFLOW', '$.budget', 'usage exceeds maximum');
  }

  exact(
    pack.authority_envelope,
    ['purpose', 'tenant_ref', 'maximum_data_classification'],
    '$.authority_envelope'
  );
  if (pack.authority_envelope.purpose !== 'CONTEXT_ONLY') {
    fail('AUTHORITY_WIDENING', '$.authority_envelope.purpose', 'context cannot authorize execution');
  }
  if (pack.authority_envelope.tenant_ref !== pack.tenant_ref) {
    fail('TENANT_MISMATCH', '$.authority_envelope.tenant_ref', 'tenant differs');
  }
  if (!CLASS.includes(pack.authority_envelope.maximum_data_classification)) {
    fail('INVALID_VALUE', '$.authority_envelope.maximum_data_classification', 'unknown classification');
  }
  strings(pack.refusal_reasons, '$.refusal_reasons');
  string(pack.context_digest, '$.context_digest', DIGEST);
  if (pack.execution_authority !== 'NONE') {
    fail('AUTHORITY_WIDENING', '$.execution_authority', 'must remain NONE');
  }
  if (pack.state === 'REFUSED' && pack.refusal_reasons.length === 0) {
    fail('REFUSAL_REASON_REQUIRED', '$.refusal_reasons', 'REFUSED needs reason');
  }
  if (pack.state !== 'REFUSED' && pack.refusal_reasons.length) {
    fail('UNEXPECTED_REFUSAL_REASON', '$.refusal_reasons', 'non-refused pack cannot carry refusal');
  }
  return true;
}

export function assertContextPackIntegrity(pack) {
  validateContextPack(pack);
  const candidate = structuredClone(pack);
  candidate.context_digest = '0'.repeat(64);
  const expected = sha256(candidate);
  if (pack.context_digest !== expected) {
    fail('CONTEXT_DIGEST_MISMATCH', '$.context_digest', 'digest does not bind pack');
  }
  return true;
}

export function assertContradictionsVisible(pack, processTwin) {
  validateContextPack(pack);
  const selectedClaims = new Set(pack.selected_claims.map((claim) => claim.claim_id));
  const included = new Set(
    pack.unresolved_contradictions.map((contradiction) => contradiction.contradiction_id)
  );
  for (const contradiction of processTwin.unresolved_contradictions ?? []) {
    if (
      contradiction.claim_ids.some((id) => selectedClaims.has(id)) &&
      !included.has(contradiction.contradiction_id)
    ) {
      fail(
        'CONTRADICTION_SUPPRESSED',
        '$.unresolved_contradictions',
        contradiction.contradiction_id
      );
    }
  }
  return true;
}

export const contextQueryDigest = (query) => {
  validateContextQuery(query);
  const normalized = structuredClone(query);
  normalized.required_node_ids.sort();
  normalized.optional_node_ids.sort();
  normalized.requested_views.sort();
  normalized.mandatory_policy_subjects.sort();
  return sha256(normalized);
};

export const contextPackCanonical = (pack) => canonicalJson(pack);
