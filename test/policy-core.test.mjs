import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { evaluatePolicy } from '../src/policy/evaluate-policy.mjs';
import { policyApprovalSubjectDigest } from '../src/policy/contract-validation.mjs';
import { sha256 } from '../scripts/lib/contract-validation.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const load = async () => ({
  capability: await readJson('../fixtures/policy/capability.draft-case.json'),
  request: await readJson('../fixtures/policy/request.draft-case.json')
});

test('allows a bounded reversible draft candidate', async () => {
  const input = await load();
  const decision = evaluatePolicy(input);
  assert.equal(decision.outcome, 'ALLOW');
  assert.equal(decision.execution_admission, 'ELIGIBLE_CANDIDATE');
});

test('unknown connector operation defaults to deny', async () => {
  const input = await load();
  input.capability.operation_id = 'other-operation';
  input.capability.capability_digest = '0'.repeat(64);
  input.capability.capability_digest = sha256(input.capability);
  const decision = evaluatePolicy(input);
  assert.equal(decision.outcome, 'DENY');
  assert.ok(decision.reason_codes.includes('UNKNOWN_CAPABILITY'));
});

test('side effect missing idempotency key is denied', async () => {
  const input = await load();
  input.request.idempotency_key_present = false;
  const decision = evaluatePolicy(input);
  assert.ok(decision.reason_codes.includes('IDEMPOTENCY_KEY_REQUIRED'));
});

test('approved commit with exact Human approval becomes an eligible candidate', async () => {
  const capability = await readJson('../fixtures/policy/capability.commit-route.json');
  const request = await readJson('../fixtures/policy/request.commit-route.json');
  request.approval.subject_digest = policyApprovalSubjectDigest(request);
  assert.equal(evaluatePolicy({ capability, request }).outcome, 'ALLOW');
});

test('missing approval remains pending Human', async () => {
  const capability = await readJson('../fixtures/policy/capability.commit-route.json');
  const request = await readJson('../fixtures/policy/request.commit-route.json');
  request.approval = {
    status: 'NONE',
    approver_identity_ref: null,
    approver_role: null,
    subject_digest: null,
    expires_at: null
  };
  const decision = evaluatePolicy({ capability, request });
  assert.equal(decision.outcome, 'APPROVAL_REQUIRED');
  assert.equal(decision.execution_admission, 'PENDING_HUMAN');
});
