import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  ContractValidationError,
  readJson,
  sha256
} from '../scripts/lib/contract-validation.mjs';
import {
  compileDigitalEmployee,
  normalizeRolePack,
  normalizeTenantOverlay
} from '../src/compiler/compile-digital-employee.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const rolePath = path.join(root, 'fixtures/valid/role-pack.customer-support.json');
const overlayPath = path.join(root, 'fixtures/valid/tenant-overlay.demo.json');
const expectedPath = path.join(root, 'fixtures/expected/digital-employee.customer-support.json');

async function loadValidInputs() {
  return {
    rolePack: await readJson(rolePath),
    overlay: await readJson(overlayPath)
  };
}

function reverseObject(value) {
  return Object.fromEntries(Object.entries(value).reverse());
}

async function expectCompileError(file, code) {
  const rolePack = await readJson(rolePath);
  const overlay = await readJson(path.join(root, 'fixtures/invalid', file));
  assert.throws(() => compileDigitalEmployee(rolePack, overlay), (error) => {
    assert.ok(error instanceof ContractValidationError);
    assert.equal(error.code, code);
    return true;
  });
}

test('compiler output matches the reviewed expected DigitalEmployeeSpec', async () => {
  const { rolePack, overlay } = await loadValidInputs();
  const expected = await readJson(expectedPath);
  assert.deepEqual(compileDigitalEmployee(rolePack, overlay), expected);
});

test('semantic ordering and object key ordering do not change the compiled subject', async () => {
  const { rolePack, overlay } = await loadValidInputs();
  const baseline = compileDigitalEmployee(rolePack, overlay);

  const reorderedRolePack = reverseObject({
    ...rolePack,
    outcomes: [...rolePack.outcomes].reverse().map((item) => reverseObject({
      ...item,
      metric_ids: [...item.metric_ids].reverse()
    })),
    systems: [...rolePack.systems].reverse().map((item) => reverseObject({
      ...item,
      required_capabilities: [...item.required_capabilities].reverse()
    })),
    actions: [...rolePack.actions].reverse().map(reverseObject),
    prohibited_actions: [...rolePack.prohibited_actions].reverse(),
    model_profiles: [...rolePack.model_profiles].reverse().map((item) => reverseObject({
      ...item,
      allowed_regions: [...item.allowed_regions].reverse()
    })),
    evals: [...rolePack.evals].reverse().map(reverseObject),
    required_escalation_roles: [...rolePack.required_escalation_roles].reverse()
  });

  const reorderedOverlay = reverseObject({
    ...overlay,
    systems: [...overlay.systems].reverse().map((item) => reverseObject({
      ...item,
      granted_capabilities: [...item.granted_capabilities].reverse()
    })),
    enabled_actions: [...overlay.enabled_actions].reverse().map(reverseObject),
    escalation_roles: [...overlay.escalation_roles].reverse(),
    privacy: reverseObject({
      ...overlay.privacy,
      allowed_regions: [...overlay.privacy.allowed_regions].reverse()
    })
  });

  assert.deepEqual(compileDigitalEmployee(reorderedRolePack, reorderedOverlay), baseline);
});

test('compiled source identities bind normalized Role Pack and Tenant Overlay inputs', async () => {
  const { rolePack, overlay } = await loadValidInputs();
  const compiled = compileDigitalEmployee(rolePack, overlay);
  assert.equal(compiled.source_digests.role_pack_sha256, sha256(normalizeRolePack(rolePack)));
  assert.equal(compiled.source_digests.tenant_overlay_sha256, sha256(normalizeTenantOverlay(overlay)));
  assert.match(compiled.source_digests.role_pack_sha256, /^[0-9a-f]{64}$/);
  assert.match(compiled.source_digests.tenant_overlay_sha256, /^[0-9a-f]{64}$/);
});

test('authority ceiling, prohibited actions, systems, and secret boundary fail closed', async () => {
  await expectCompileError('tenant-overlay.authority-widening.json', 'AUTHORITY_WIDENING');
  await expectCompileError('tenant-overlay.prohibited-action.json', 'PROHIBITED_ACTION_GRANTED');
  await expectCompileError('tenant-overlay.unknown-system.json', 'UNKNOWN_SYSTEM_BINDING');
  await expectCompileError('tenant-overlay.secret-field.json', 'FORBIDDEN_SECRET_FIELD');
});

test('compiled output keeps high-risk admission and human ownership explicit', async () => {
  const { rolePack, overlay } = await loadValidInputs();
  const compiled = compileDigitalEmployee(rolePack, overlay);
  assert.equal(compiled.production_admission, 'HUMAN_ADMIT_REQUIRED');
  assert.equal(compiled.human_manager_role, 'customer_support_process_owner');
  assert.ok(compiled.escalation_roles.includes('security_incident_owner'));
  assert.ok(compiled.authority.prohibited_actions.includes('payment.transfer'));
  assert.equal(
    compiled.authority.enabled_actions.find((action) => action.action_id === 'fulfillment-route.change').approval_role,
    'customer_support_process_owner'
  );
});

test('compiler source contains no network or model provider imports', async () => {
  const source = await readFile(path.join(root, 'src/compiler/compile-digital-employee.mjs'), 'utf8');
  assert.doesNotMatch(source, /node:(?:http|https|net|tls)|\bfetch\s*\(|openai|anthropic|modelcontextprotocol/i);
});
