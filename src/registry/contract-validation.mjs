import { assertNoForbiddenSecrets, canonicalJson, ContractValidationError, sha256 } from '../../scripts/lib/contract-validation.mjs';

const ENTRY_KEYS = [
  'schema', 'registry_entry_id', 'artifact_type', 'logical_id', 'version', 'contract_id',
  'content_digest', 'authority_ceiling_digest', 'state', 'created_at', 'supersedes',
  'private_reference', 'source_subjects', 'validation_receipt_digest'
];
const TYPES = ['ROLE_PACK', 'TENANT_OVERLAY_REFERENCE', 'OUTCOME_CONTRACT', 'DIGITAL_EMPLOYEE_SPEC'];
const STATES = ['DRAFT', 'VALIDATED', 'ACTIVE', 'SUPERSEDED', 'REVOKED'];
const TRANSITIONS = new Map([
  ['DRAFT', new Set(['VALIDATED', 'REVOKED'])],
  ['VALIDATED', new Set(['ACTIVE', 'REVOKED'])],
  ['ACTIVE', new Set(['SUPERSEDED', 'REVOKED'])],
  ['SUPERSEDED', new Set()],
  ['REVOKED', new Set()]
]);
const ID = /^[a-z][a-z0-9-]{2,95}$/;
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const DIGEST = /^[a-f0-9]{64}$/;

const fail = (code, path, message) => { throw new ContractValidationError(code, path, message); };
const plain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const requireObject = (value, path) => { if (!plain(value)) fail('INVALID_TYPE', path, 'expected object'); };
const requireString = (value, path, pattern) => {
  if (typeof value !== 'string' || value.length === 0) fail('INVALID_TYPE', path, 'expected non-empty string');
  if (pattern && !pattern.test(value)) fail('INVALID_VALUE', path, 'invalid format');
};
const requireExactKeys = (value, path) => {
  requireObject(value, path);
  for (const key of Object.keys(value)) if (!ENTRY_KEYS.includes(key)) fail('UNEXPECTED_FIELD', `${path}.${key}`, 'not part of registry contract');
  for (const key of ENTRY_KEYS) if (!(key in value)) fail('MISSING_FIELD', `${path}.${key}`, 'required field absent');
};
const requireDigestOrNull = (value, path) => { if (value !== null) requireString(value, path, DIGEST); };
const requireIsoDate = (value, path) => {
  requireString(value, path);
  if (Number.isNaN(Date.parse(value))) fail('INVALID_VALUE', path, 'expected ISO-8601 timestamp');
};

export function validateRegistryEntry(entry) {
  assertNoForbiddenSecrets(entry);
  requireExactKeys(entry, '$');
  if (entry.schema !== 'fde-agent/registry-entry/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected fde-agent/registry-entry/v1');
  requireString(entry.registry_entry_id, '$.registry_entry_id', ID);
  if (!TYPES.includes(entry.artifact_type)) fail('INVALID_VALUE', '$.artifact_type', `expected one of ${TYPES.join(', ')}`);
  requireString(entry.logical_id, '$.logical_id', ID);
  requireString(entry.version, '$.version', VERSION);
  requireString(entry.contract_id, '$.contract_id');
  requireString(entry.content_digest, '$.content_digest', DIGEST);
  requireDigestOrNull(entry.authority_ceiling_digest, '$.authority_ceiling_digest');
  if (!STATES.includes(entry.state)) fail('INVALID_VALUE', '$.state', `expected one of ${STATES.join(', ')}`);
  requireIsoDate(entry.created_at, '$.created_at');
  if (entry.supersedes !== null) requireString(entry.supersedes, '$.supersedes', ID);
  requireDigestOrNull(entry.validation_receipt_digest, '$.validation_receipt_digest');

  if (!Array.isArray(entry.source_subjects) || entry.source_subjects.length === 0) fail('INVALID_VALUE', '$.source_subjects', 'at least one exact source subject required');
  const seen = new Set();
  entry.source_subjects.forEach((subject, index) => {
    requireString(subject, `$.source_subjects[${index}]`);
    if (seen.has(subject)) fail('DUPLICATE_IDENTITY', `$.source_subjects[${index}]`, 'duplicate source subject');
    seen.add(subject);
  });

  if (entry.artifact_type === 'TENANT_OVERLAY_REFERENCE') {
    requireObject(entry.private_reference, '$.private_reference');
    const allowed = ['tenant_id', 'resolver_profile', 'artifact_digest', 'expires_at'];
    for (const key of Object.keys(entry.private_reference)) if (!allowed.includes(key)) fail('PRIVATE_BODY_FORBIDDEN', `$.private_reference.${key}`, 'only private reference metadata is public');
    for (const key of ['tenant_id', 'resolver_profile', 'artifact_digest', 'expires_at']) if (!(key in entry.private_reference)) fail('MISSING_FIELD', `$.private_reference.${key}`, 'required field absent');
    requireString(entry.private_reference.tenant_id, '$.private_reference.tenant_id', ID);
    requireString(entry.private_reference.resolver_profile, '$.private_reference.resolver_profile', ID);
    requireString(entry.private_reference.artifact_digest, '$.private_reference.artifact_digest', DIGEST);
    if (entry.private_reference.artifact_digest !== entry.content_digest) fail('PRIVATE_DIGEST_MISMATCH', '$.private_reference.artifact_digest', 'must equal public content digest');
    requireIsoDate(entry.private_reference.expires_at, '$.private_reference.expires_at');
  } else if (entry.private_reference !== null) {
    fail('UNEXPECTED_PRIVATE_REFERENCE', '$.private_reference', 'only Tenant Overlay references use private metadata');
  }

  if (entry.state === 'ACTIVE' && entry.validation_receipt_digest === null) fail('ACTIVE_WITHOUT_VALIDATION', '$.validation_receipt_digest', 'ACTIVE requires exact validation receipt');
  if (entry.state === 'SUPERSEDED' && entry.supersedes === null) fail('SUPERSEDED_WITHOUT_PREDECESSOR', '$.supersedes', 'SUPERSEDED entry must identify predecessor');
  return true;
}

export function assertRegistryTransition(previous, next) {
  validateRegistryEntry(previous);
  validateRegistryEntry(next);
  if (previous.registry_entry_id !== next.registry_entry_id) fail('IDENTITY_CHANGED', '$.registry_entry_id', 'transition must preserve entry identity');
  if (previous.logical_id !== next.logical_id || previous.version !== next.version || previous.content_digest !== next.content_digest) fail('IMMUTABLE_SUBJECT_CHANGED', '$', 'logical identity, version, and digest are immutable');
  if (!TRANSITIONS.get(previous.state).has(next.state)) fail('ILLEGAL_STATE_TRANSITION', '$.state', `${previous.state} -> ${next.state} is not admitted`);
  return true;
}

export function assertNoRegistryCollision(candidate, existingEntries) {
  validateRegistryEntry(candidate);
  for (const entry of existingEntries) {
    validateRegistryEntry(entry);
    if (entry.logical_id === candidate.logical_id && entry.version === candidate.version && entry.content_digest !== candidate.content_digest) {
      fail('VERSION_COLLISION', '$.version', 'same logical ID and version already bind a different digest');
    }
    if (entry.registry_entry_id === candidate.registry_entry_id && canonicalJson(entry) !== canonicalJson(candidate)) {
      fail('REGISTRY_ID_COLLISION', '$.registry_entry_id', 'registry identity already binds different content');
    }
  }
  return true;
}

export function registrySubjectDigest(entry) {
  validateRegistryEntry(entry);
  return sha256(entry);
}
