import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { evaluatePolicy } from '../src/policy/evaluate-policy.mjs';
import {
  policyApprovalSubjectDigest,
  validatePolicyDecision
} from '../src/policy/contract-validation.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const commit = async () => ({
  capability: await readJson('../fixtures/policy/capability.commit-route.json'),
  request: await readJson('../fixtures/policy/request.commit-route.json')
});
const code = (fn, expected) => assert.throws(fn, (error) => error?.code === expected);

test('prohibited action is denied', async () => {
  const capability = await readJson('../fixtures/policy/capability.draft-case.json');
  const request = await readJson('../fixtures/policy/request.draft-case.json');
  request.action_id = 'post-payment';
  const decision = evaluatePolicy({ capability, request });
  assert.ok(decision.reason_codes.includes('PROHIBITED_ACTION'));
});

test('separation of duties cannot be bypassed', async () => {
  const input = await commit();
  input.request.approval.approver_identity_ref = input.request.caller_identity_ref;
  input.request.approval.subject_digest = policyApprovalSubjectDigest(input.request);
  const decision = evaluatePolicy(input);
  assert.ok(decision.reason_codes.includes('SEPARATION_OF_DUTIES_VIOLATION'));
});

test('expired approval is denied', async () => {
  const input = await commit();
  input.request.approval.expires_at = '2026-08-15T00:00:00Z';
  input.request.approval.subject_digest = policyApprovalSubjectDigest(input.request);
  const decision = evaluatePolicy(input);
  assert.ok(decision.reason_codes.includes('APPROVAL_EXPIRED'));
});

test('tampered decision digest is rejected', async () => {
  const capability = await readJson('../fixtures/policy/capability.draft-case.json');
  const request = await readJson('../fixtures/policy/request.draft-case.json');
  const decision = evaluatePolicy({ capability, request });
  decision.decision_digest = 'f'.repeat(64);
  code(() => validatePolicyDecision(decision), 'DECISION_DIGEST_MISMATCH');
});
