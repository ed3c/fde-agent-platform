import { assertNoForbiddenSecrets, ContractValidationError, sha256 } from '../../scripts/lib/contract-validation.mjs';

const ID = /^[a-z][a-z0-9-]{2,95}$/;
const DIGEST = /^[a-f0-9]{64}$/;
const SOURCE_TYPES = ['MEETING_NOTE', 'EMAIL_EXPORT', 'TICKET_EXPORT', 'PDF_TEXT', 'PPT_TEXT', 'EVENT_LOG', 'DIRECTORY', 'SYSTEM_EXTRACT'];
const COMPLETENESS = ['COMPLETE', 'PARTIAL', 'DEGRADED', 'UNSUPPORTED'];
const DATA_CLASSES = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'];
const ENTITY_STATES = ['CANDIDATE', 'AMBIGUOUS', 'CONFIRMED', 'REJECTED'];

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
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail('UNEXPECTED_FIELD', `${path}.${key}`, 'not part of public contract');
  for (const key of required) if (!(key in value)) fail('MISSING_FIELD', `${path}.${key}`, 'required field absent');
};
const isoDate = (value, path) => { string(value, path); if (Number.isNaN(Date.parse(value))) fail('INVALID_VALUE', path, 'expected ISO-8601 timestamp'); };
const uniqueStrings = (value, path, min = 0) => {
  if (!Array.isArray(value) || value.length < min) fail('INVALID_VALUE', path, `expected at least ${min} item(s)`);
  const seen = new Set();
  value.forEach((item, index) => {
    string(item, `${path}[${index}]`);
    if (seen.has(item)) fail('DUPLICATE_IDENTITY', `${path}[${index}]`, 'duplicate value');
    seen.add(item);
  });
};

export function validateSourceManifest(manifest) {
  assertNoForbiddenSecrets(manifest);
  const keys = ['schema', 'source_id', 'tenant_ref', 'source_type', 'content_digest', 'byte_size', 'observed_at', 'parser', 'completeness', 'parsed_character_count', 'data_classification', 'redaction_required', 'source_locator', 'access_grant_subject'];
  exact(manifest, keys, keys, '$');
  if (manifest.schema !== 'fde-agent/source-manifest/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected source manifest v1');
  string(manifest.source_id, '$.source_id', ID);
  string(manifest.tenant_ref, '$.tenant_ref', ID);
  if (!SOURCE_TYPES.includes(manifest.source_type)) fail('INVALID_VALUE', '$.source_type', 'unsupported source type');
  string(manifest.content_digest, '$.content_digest', DIGEST);
  number(manifest.byte_size, '$.byte_size', 0, undefined, true);
  number(manifest.parsed_character_count, '$.parsed_character_count', 0, undefined, true);
  isoDate(manifest.observed_at, '$.observed_at');
  exact(manifest.parser, ['parser_id', 'version'], ['parser_id', 'version'], '$.parser');
  string(manifest.parser.parser_id, '$.parser.parser_id', ID);
  string(manifest.parser.version, '$.parser.version');
  const completeKeys = ['state', 'expected_units', 'parsed_units', 'warnings'];
  exact(manifest.completeness, completeKeys, completeKeys, '$.completeness');
  if (!COMPLETENESS.includes(manifest.completeness.state)) fail('INVALID_VALUE', '$.completeness.state', 'unsupported completeness state');
  number(manifest.completeness.expected_units, '$.completeness.expected_units', 0, undefined, true);
  number(manifest.completeness.parsed_units, '$.completeness.parsed_units', 0, undefined, true);
  uniqueStrings(manifest.completeness.warnings, '$.completeness.warnings');
  if (manifest.completeness.parsed_units > manifest.completeness.expected_units) fail('IMPOSSIBLE_COMPLETENESS', '$.completeness.parsed_units', 'parsed units exceed expected units');
  if (manifest.completeness.state === 'COMPLETE' && manifest.completeness.parsed_units !== manifest.completeness.expected_units) fail('FALSE_COMPLETE', '$.completeness.state', 'COMPLETE requires all units parsed');
  if (!DATA_CLASSES.includes(manifest.data_classification)) fail('INVALID_VALUE', '$.data_classification', 'unsupported data classification');
  bool(manifest.redaction_required, '$.redaction_required');
  string(manifest.source_locator, '$.source_locator');
  if (/^(?:https?:\/\/)?(?:[^/]+:)?[^@/]+@/i.test(manifest.source_locator)) fail('CREDENTIAL_BEARING_LOCATOR', '$.source_locator', 'source locator may not contain embedded authentication');
  string(manifest.access_grant_subject, '$.access_grant_subject');
  return true;
}

export function validateEvidenceClaimCandidate(claim, manifest) {
  assertNoForbiddenSecrets(claim);
  validateSourceManifest(manifest);
  const keys = ['schema', 'claim_id', 'tenant_ref', 'source_ref', 'subject', 'predicate', 'object', 'valid_time', 'observed_at', 'confidence', 'status', 'parser_subject', 'redaction_digest'];
  exact(claim, keys, keys, '$');
  if (claim.schema !== 'fde-agent/evidence-claim-candidate/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected evidence claim candidate v1');
  string(claim.claim_id, '$.claim_id', ID);
  if (claim.tenant_ref !== manifest.tenant_ref) fail('TENANT_BOUNDARY_MISMATCH', '$.tenant_ref', 'claim tenant differs from source tenant');
  exact(claim.source_ref, ['source_id', 'content_digest', 'span'], ['source_id', 'content_digest', 'span'], '$.source_ref');
  if (claim.source_ref.source_id !== manifest.source_id) fail('SOURCE_REFERENCE_MISMATCH', '$.source_ref.source_id', 'claim references another source');
  if (claim.source_ref.content_digest !== manifest.content_digest) fail('SOURCE_DIGEST_MISMATCH', '$.source_ref.content_digest', 'claim must bind exact source digest');
  exact(claim.source_ref.span, ['start', 'end'], ['start', 'end'], '$.source_ref.span');
  number(claim.source_ref.span.start, '$.source_ref.span.start', 0, manifest.parsed_character_count, true);
  number(claim.source_ref.span.end, '$.source_ref.span.end', 0, manifest.parsed_character_count, true);
  if (claim.source_ref.span.start >= claim.source_ref.span.end) fail('INVALID_SOURCE_SPAN', '$.source_ref.span', 'start must precede end');
  ['subject', 'predicate', 'object', 'parser_subject'].forEach((key) => string(claim[key], `$.${key}`));
  exact(claim.valid_time, ['from', 'to'], ['from', 'to'], '$.valid_time');
  isoDate(claim.valid_time.from, '$.valid_time.from');
  if (claim.valid_time.to !== null) isoDate(claim.valid_time.to, '$.valid_time.to');
  isoDate(claim.observed_at, '$.observed_at');
  number(claim.confidence, '$.confidence', 0, 1);
  if (claim.status !== 'CLAIM_CANDIDATE') fail('TRUTH_PROMOTION_FORBIDDEN', '$.status', 'ingestion can only emit claim candidates');
  string(claim.redaction_digest, '$.redaction_digest', DIGEST);
  if (manifest.redaction_required && claim.redaction_digest === '0'.repeat(64)) fail('REDACTION_EVIDENCE_ABSENT', '$.redaction_digest', 'redaction-required source needs a non-zero receipt digest');
  if (['PARTIAL', 'DEGRADED', 'UNSUPPORTED'].includes(manifest.completeness.state) && claim.confidence === 1) fail('DEGRADED_SOURCE_OVERCONFIDENCE', '$.confidence', 'degraded source cannot claim certainty');
  return true;
}

export function validateEntityLinkCandidate(link, claimIds = []) {
  assertNoForbiddenSecrets(link);
  const keys = ['schema', 'entity_link_id', 'tenant_ref', 'mention_ids', 'candidate_entity_ids', 'confidence', 'status', 'evidence_claim_ids', 'human_review_required'];
  exact(link, keys, keys, '$');
  if (link.schema !== 'fde-agent/entity-link-candidate/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected entity link candidate v1');
  string(link.entity_link_id, '$.entity_link_id', ID);
  string(link.tenant_ref, '$.tenant_ref', ID);
  uniqueStrings(link.mention_ids, '$.mention_ids', 1);
  uniqueStrings(link.candidate_entity_ids, '$.candidate_entity_ids', 1);
  uniqueStrings(link.evidence_claim_ids, '$.evidence_claim_ids', 1);
  const known = new Set(claimIds);
  link.evidence_claim_ids.forEach((id, index) => { if (known.size > 0 && !known.has(id)) fail('UNKNOWN_CLAIM_REFERENCE', `$.evidence_claim_ids[${index}]`, 'unknown claim'); });
  number(link.confidence, '$.confidence', 0, 1);
  if (!ENTITY_STATES.includes(link.status)) fail('INVALID_VALUE', '$.status', 'unsupported entity-link state');
  bool(link.human_review_required, '$.human_review_required');
  const ambiguous = link.candidate_entity_ids.length !== 1 || link.confidence < 0.95;
  if (ambiguous && (!link.human_review_required || link.status !== 'AMBIGUOUS')) fail('AMBIGUITY_MUST_ESCALATE', '$', 'ambiguous identity must enter Human review');
  if (!ambiguous && link.status === 'CONFIRMED' && link.human_review_required) fail('CONFIRMED_STILL_REQUIRES_REVIEW', '$.human_review_required', 'confirmed exact link should not remain pending');
  if (link.status === 'CONFIRMED' && link.candidate_entity_ids.length !== 1) fail('MULTIPLE_CONFIRMED_ENTITIES', '$.candidate_entity_ids', 'only one exact entity may be confirmed');
  return true;
}

export const sourceSubjectDigest = (manifest) => { validateSourceManifest(manifest); return sha256(manifest); };
