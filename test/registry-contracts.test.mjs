import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  assertNoRegistryCollision,
  assertRegistryTransition,
  registrySubjectDigest,
  validateRegistryEntry
} from '../src/registry/contract-validation.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const expectCode = (fn, code) => assert.throws(fn, (error) => error?.code === code);

test('valid public and private-reference entries pass', async () => {
  const role = await readJson('../fixtures/registry/role-pack.active.json');
  const overlay = await readJson('../fixtures/registry/tenant-overlay-reference.validated.json');
  assert.equal(validateRegistryEntry(role), true);
  assert.equal(validateRegistryEntry(overlay), true);
  assert.match(registrySubjectDigest(role), /^[a-f0-9]{64}$/);
});

test('private reference cannot carry a private body', async () => {
  const overlay = await readJson('../fixtures/registry/tenant-overlay-reference.validated.json');
  overlay.private_reference.payload = { customer: 'forbidden' };
  expectCode(() => validateRegistryEntry(overlay), 'PRIVATE_BODY_FORBIDDEN');
});

test('ACTIVE entry requires validation evidence', async () => {
  const role = await readJson('../fixtures/registry/role-pack.active.json');
  role.validation_receipt_digest = null;
  expectCode(() => validateRegistryEntry(role), 'ACTIVE_WITHOUT_VALIDATION');
});

test('same version cannot bind a different digest', async () => {
  const role = await readJson('../fixtures/registry/role-pack.active.json');
  const collision = structuredClone(role);
  collision.registry_entry_id = 'registry-role-support-collision';
  collision.content_digest = 'f'.repeat(64);
  expectCode(() => assertNoRegistryCollision(collision, [role]), 'VERSION_COLLISION');
});

test('registry lifecycle preserves immutable subject', async () => {
  const validated = await readJson('../fixtures/registry/tenant-overlay-reference.validated.json');
  const active = structuredClone(validated);
  active.state = 'ACTIVE';
  assert.equal(assertRegistryTransition(validated, active), true);
  const changed = structuredClone(active);
  changed.state = 'SUPERSEDED';
  changed.supersedes = active.registry_entry_id;
  changed.content_digest = '1'.repeat(64);
  changed.private_reference.artifact_digest = changed.content_digest;
  expectCode(() => assertRegistryTransition(active, changed), 'IMMUTABLE_SUBJECT_CHANGED');
});

test('terminal state cannot be reactivated', async () => {
  const active = await readJson('../fixtures/registry/role-pack.active.json');
  const revoked = structuredClone(active);
  revoked.state = 'REVOKED';
  assert.equal(assertRegistryTransition(active, revoked), true);
  const reactivated = structuredClone(revoked);
  reactivated.state = 'ACTIVE';
  expectCode(() => assertRegistryTransition(revoked, reactivated), 'ILLEGAL_STATE_TRANSITION');
});
