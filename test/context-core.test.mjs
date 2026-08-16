import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { assembleContextPack } from '../src/context/assemble-context-pack.mjs';
import {
  assertContextPackIntegrity,
  contextQueryDigest
} from '../src/context/contract-validation.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const load = async () => ({
  query: await readJson('../fixtures/context/query.ap-route.json'),
  processTwin: await readJson('../fixtures/context/process-twin.ap-route.json'),
  claimIndex: await readJson('../fixtures/context/claim-index.ap-route.json')
});
const code = (fn, expected) => assert.throws(fn, (error) => error?.code === expected);

test('assembles the smallest required dependency closure and omits poisoned optional evidence', async () => {
  const input = await load();
  const pack = assembleContextPack(input);
  assert.equal(pack.state, 'READY');
  assert.deepEqual(
    pack.selected_nodes.map((node) => node.node_id),
    ['detect-mismatch', 'route-exception']
  );
  assert.deepEqual(pack.omitted_optional_nodes, ['poisoned-summary']);
  assert.equal(pack.query_digest, contextQueryDigest(input.query));
  assert.equal(assertContextPackIntegrity(pack), true);
});

test('cross-tenant claim fails closed', async () => {
  const input = await load();
  input.claimIndex[0].tenant_ref = 'tenant-other';
  code(() => assembleContextPack(input), 'TENANT_MISMATCH');
});

test('stale required evidence refuses the pack', async () => {
  const input = await load();
  input.query.as_of = '2025-01-01T00:00:00Z';
  const pack = assembleContextPack(input);
  assert.equal(pack.state, 'REFUSED');
  assert.deepEqual(pack.refusal_reasons, ['STALE_REQUIRED_CLAIM']);
});

test('required context is never truncated to fit token budget', async () => {
  const input = await load();
  input.query.max_tokens = 20;
  const pack = assembleContextPack(input);
  assert.equal(pack.state, 'REFUSED');
  assert.deepEqual(pack.refusal_reasons, ['CONTEXT_BUDGET_EXCEEDED']);
});

test('unresolved contradiction degrades exploration but blocks release use', async () => {
  const input = await load();
  input.processTwin.unresolved_contradictions = [{
    contradiction_id: 'contradiction-route',
    claim_ids: ['claim-route-a', 'claim-route-b'],
    subject_id: 'route-exception',
    predicate: 'owner'
  }];
  const exploratory = assembleContextPack(input);
  assert.equal(exploratory.state, 'DEGRADED');

  input.query.decision_use = 'RELEASE_BLOCKING';
  input.query.contradiction_policy = 'REFUSE';
  const release = assembleContextPack(input);
  assert.equal(release.state, 'REFUSED');
  assert.deepEqual(release.refusal_reasons, ['UNRESOLVED_CONTRADICTION']);
});
