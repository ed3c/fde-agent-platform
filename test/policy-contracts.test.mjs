import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  validateConnectorCapability,
  validatePolicyRequest
} from '../src/policy/contract-validation.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const code = (fn, expected) => assert.throws(fn, (error) => error?.code === expected);

test('valid bounded capability and policy request pass', async () => {
  assert.equal(
    validateConnectorCapability(await readJson('../fixtures/policy/capability.draft-case.json')),
    true
  );
  assert.equal(
    validatePolicyRequest(await readJson('../fixtures/policy/request.draft-case.json')),
    true
  );
});

test('model cannot own the policy decision', async () => {
  const request = await readJson('../fixtures/policy/request.draft-case.json');
  request.authority_envelope.model_decision_permitted = true;
  code(() => validatePolicyRequest(request), 'MODEL_AUTHORITY_FORBIDDEN');
});

test('capability digest binds reversible compensation semantics', async () => {
  const capability = await readJson('../fixtures/policy/capability.draft-case.json');
  capability.compensation_operation_id = null;
  code(() => validateConnectorCapability(capability), 'CAPABILITY_DIGEST_MISMATCH');
});

test('approved commit cannot omit Human approver roles', async () => {
  const capability = await readJson('../fixtures/policy/capability.draft-case.json');
  Object.assign(capability, {
    action_class: 'APPROVED_COMMIT',
    side_effect_class: 'IRREVERSIBLE',
    reversible: false,
    idempotency_mode: 'CONNECTOR_GUARANTEED',
    compensation_operation_id: null,
    approval_mode: 'NEVER',
    required_approver_roles: []
  });
  code(() => validateConnectorCapability(capability), 'CAPABILITY_DIGEST_MISMATCH');
});
