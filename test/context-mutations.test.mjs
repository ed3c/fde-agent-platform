import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { assembleContextPack } from '../src/context/assemble-context-pack.mjs';
import {
  assertContextPackIntegrity,
  assertContradictionsVisible
} from '../src/context/contract-validation.mjs';
import { sha256 } from '../scripts/lib/contract-validation.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const load = async () => ({
  query: await readJson('../fixtures/context/query.ap-route.json'),
  processTwin: await readJson('../fixtures/context/process-twin.ap-route.json'),
  claimIndex: await readJson('../fixtures/context/claim-index.ap-route.json')
});
const code = (fn, expected) => assert.throws(fn, (error) => error?.code === expected);

test('selected contradiction cannot be hidden by recomputing the pack digest', async () => {
  const input = await load();
  input.processTwin.unresolved_contradictions = [{
    contradiction_id: 'contradiction-route',
    claim_ids: ['claim-route-a', 'claim-route-b'],
    subject_id: 'route-exception',
    predicate: 'owner'
  }];
  const pack = assembleContextPack(input);
  const hidden = structuredClone(pack);
  hidden.unresolved_contradictions = [];
  hidden.context_digest = '0'.repeat(64);
  hidden.context_digest = sha256(hidden);
  code(() => assertContradictionsVisible(hidden, input.processTwin), 'CONTRADICTION_SUPPRESSED');
});

test('required dependency closure cannot be silently truncated to fit the budget', async () => {
  const input = await load();
  input.query.max_tokens = 20;
  const pack = assembleContextPack(input);
  assert.equal(pack.state, 'REFUSED');
  assert.deepEqual(pack.selected_nodes, []);
  assert.deepEqual(pack.refusal_reasons, ['CONTEXT_BUDGET_EXCEEDED']);
});

test('tampered pack identity is rejected', async () => {
  const input = await load();
  const pack = assembleContextPack(input);
  pack.context_digest = 'f'.repeat(64);
  code(() => assertContextPackIntegrity(pack), 'CONTEXT_DIGEST_MISMATCH');
});
