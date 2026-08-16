import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  sourceSubjectDigest,
  validateEntityLinkCandidate,
  validateEvidenceClaimCandidate,
  validateSourceManifest
} from '../src/engagement/contract-validation.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const expectCode = (fn, code) => assert.throws(fn, (error) => error?.code === code);

const load = async () => ({
  source: await readJson('../fixtures/engagement/source-note.complete.json'),
  claim: await readJson('../fixtures/engagement/claim-routing.candidate.json'),
  entity: await readJson('../fixtures/engagement/entity-link.ambiguous.json')
});

test('source manifest binds parser, completeness, authorization, and digest', async () => {
  const { source } = await load();
  assert.equal(validateSourceManifest(source), true);
  assert.match(sourceSubjectDigest(source), /^[a-f0-9]{64}$/);
});

test('claim remains a source-bound candidate', async () => {
  const { source, claim } = await load();
  assert.equal(validateEvidenceClaimCandidate(claim, source), true);
  claim.status = 'ADMITTED';
  expectCode(() => validateEvidenceClaimCandidate(claim, source), 'TRUTH_PROMOTION_FORBIDDEN');
});

test('source digest and tenant mismatch fail closed', async () => {
  const { source, claim } = await load();
  claim.source_ref.content_digest = 'f'.repeat(64);
  expectCode(() => validateEvidenceClaimCandidate(claim, source), 'SOURCE_DIGEST_MISMATCH');
  claim.source_ref.content_digest = source.content_digest;
  claim.tenant_ref = 'other-tenant';
  expectCode(() => validateEvidenceClaimCandidate(claim, source), 'TENANT_BOUNDARY_MISMATCH');
});

test('false COMPLETE state is rejected', async () => {
  const { source } = await load();
  source.completeness.parsed_units = 0;
  expectCode(() => validateSourceManifest(source), 'FALSE_COMPLETE');
});

test('degraded source cannot emit confidence 1', async () => {
  const { source, claim } = await load();
  source.completeness.state = 'DEGRADED';
  source.completeness.warnings = ['OCR quality below threshold'];
  claim.confidence = 1;
  expectCode(() => validateEvidenceClaimCandidate(claim, source), 'DEGRADED_SOURCE_OVERCONFIDENCE');
});

test('same-name ambiguity must escalate to Human review', async () => {
  const { entity } = await load();
  assert.equal(validateEntityLinkCandidate(entity, ['claim-ap-route-001']), true);
  entity.human_review_required = false;
  expectCode(() => validateEntityLinkCandidate(entity, ['claim-ap-route-001']), 'AMBIGUITY_MUST_ESCALATE');
});

test('embedded authentication in source locator is rejected', async () => {
  const { source } = await load();
  source.source_locator = 'https://user:pass@example.invalid/export';
  expectCode(() => validateSourceManifest(source), 'CREDENTIAL_BEARING_LOCATOR');
});
