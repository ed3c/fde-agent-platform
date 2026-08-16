import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  assertContextPackIntegrity,
  contextQueryDigest,
  validateContextPack,
  validateContextQuery
} from '../src/context/contract-validation.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const code = (fn, expected) => assert.throws(fn, (error) => error?.code === expected);

test('ContextQuery and ContextPack fixtures bind exact deterministic subjects', async () => {
  const query = await readJson('../fixtures/context/query.ap-route.json');
  const pack = await readJson('../fixtures/context/context-pack.ready.json');
  assert.equal(validateContextQuery(query), true);
  assert.equal(validateContextPack(pack), true);
  assert.equal(assertContextPackIntegrity(pack), true);
  assert.equal(contextQueryDigest(query), pack.query_digest);
});

test('semantic set ordering does not change query identity', async () => {
  const query = await readJson('../fixtures/context/query.ap-route.json');
  const reordered = structuredClone(query);
  reordered.required_node_ids.reverse();
  reordered.optional_node_ids.reverse();
  reordered.requested_views.reverse();
  reordered.mandatory_policy_subjects.reverse();
  assert.equal(contextQueryDigest(query), contextQueryDigest(reordered));
});

test('release-blocking context cannot include unresolved contradictions by policy', async () => {
  const query = await readJson('../fixtures/context/query.ap-route.json');
  query.decision_use = 'RELEASE_BLOCKING';
  code(() => validateContextQuery(query), 'UNSAFE_CONTRADICTION_POLICY');
});

test('ContextPack cannot widen authority or carry private secret material', async () => {
  const pack = await readJson('../fixtures/context/context-pack.ready.json');
  pack.execution_authority = 'EXECUTE';
  code(() => validateContextPack(pack), 'AUTHORITY_WIDENING');

  const secretBearing = await readJson('../fixtures/context/context-pack.ready.json');
  secretBearing.api_key = 'not-allowed';
  code(() => validateContextPack(secretBearing), 'FORBIDDEN_SECRET_FIELD');
});
