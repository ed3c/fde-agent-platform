import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { checkContracts } from '../scripts/check-contracts.mjs';
import {
  ContractValidationError,
  canonicalJson,
  readJson,
  sha256,
  validateComposition,
  validateOutcomeContractShape
} from '../scripts/lib/contract-validation.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const rolePath = path.join(root, 'fixtures/valid/role-pack.customer-support.json');
const overlayPath = path.join(root, 'fixtures/valid/tenant-overlay.demo.json');

async function expectCompositionError(file, code) {
  const role = await readJson(rolePath);
  const overlay = await readJson(path.join(root, 'fixtures/invalid', file));
  assert.throws(() => validateComposition(role, overlay), (error) => {
    assert.ok(error instanceof ContractValidationError);
    assert.equal(error.code, code);
    return true;
  });
}

test('public contract suite and planted negative controls pass', async () => {
  const receipt = await checkContracts(root);
  assert.equal(receipt.state, 'PASS', JSON.stringify(receipt.failures, null, 2));
  assert.equal(receipt.schema_files.length, 5);
  assert.equal(receipt.negative_controls.length, 4);
});

test('valid Role Pack, Tenant Overlay, and Outcome Contract are compatible', async () => {
  assert.equal(validateComposition(await readJson(rolePath), await readJson(overlayPath)), true);
  assert.equal(validateOutcomeContractShape(await readJson(path.join(root, 'fixtures/valid/outcome-contract.demo.json'))), true);
});

test('authority widening is rejected with a stable error code', async () => {
  await expectCompositionError('tenant-overlay.authority-widening.json', 'AUTHORITY_WIDENING');
});

test('explicitly prohibited actions remain prohibited', async () => {
  await expectCompositionError('tenant-overlay.prohibited-action.json', 'PROHIBITED_ACTION_GRANTED');
});

test('unknown systems and secret-bearing fields fail closed', async () => {
  await expectCompositionError('tenant-overlay.unknown-system.json', 'UNKNOWN_SYSTEM_BINDING');
  await expectCompositionError('tenant-overlay.secret-field.json', 'FORBIDDEN_SECRET_FIELD');
});

test('canonical JSON and SHA-256 identity are deterministic', async () => {
  const overlay = await readJson(overlayPath);
  const reordered = Object.fromEntries(Object.entries(overlay).reverse());
  assert.equal(canonicalJson(overlay), canonicalJson(reordered));
  assert.equal(sha256(overlay), sha256(reordered));
});
