import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { validateSourceLedger } from '../scripts/check-source-evidence.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const expectCode = (fn, code) => assert.throws(fn, (error) => error?.code === code);

test('source ledger preserves external claims below runtime evidence', async () => {
  const ledger = await readJson('../docs/evidence/source-ledger.json');
  assert.equal(validateSourceLedger(ledger), true);
  assert.equal(ledger.entries.every((entry) => entry.state !== 'PASS'), true);
  assert.equal(ledger.entries.every((entry) => ['NONE', 'SYNTHETIC_ANALOG_ONLY'].includes(entry.runtime_relation)), true);
});

test('external interview prose cannot be labeled PASS', async () => {
  const invalid = await readJson('../fixtures/evidence/source-reported-pass.invalid.json');
  expectCode(() => validateSourceLedger(invalid), 'SOURCE_PASS_FORBIDDEN');
});

test('artifact-obtained state requires an exact digest', async () => {
  const ledger = await readJson('../docs/evidence/source-ledger.json');
  const mutated = structuredClone(ledger);
  mutated.entries[0].state = 'ARTIFACT_OBTAINED';
  expectCode(() => validateSourceLedger(mutated), 'ARTIFACT_EVIDENCE_ABSENT');
});

test('repository runtime relation cannot be inferred from source ledger', async () => {
  const ledger = await readJson('../docs/evidence/source-ledger.json');
  ledger.repository_runtime_relation = 'PASS';
  expectCode(() => validateSourceLedger(ledger), 'RUNTIME_RELATION_OVERCLAIM');
});
