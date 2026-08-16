import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  assertEvalPackRevision,
  evalPackDigest,
  validateEvalCase,
  validateEvalPack,
  validateEvalReceipt
} from '../evals/lib/contract-validation.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const expectCode = (fn, code) => assert.throws(fn, (error) => error?.code === code);
const load = async () => ({
  pack: await readJson('../fixtures/evals/pack.runtime-core.json'),
  cases: await readJson('../fixtures/evals/cases.runtime-core.json'),
  receipt: await readJson('../fixtures/evals/receipt.runtime-core.pass.json')
});

test('pack, cases, and exact positive receipt validate', async () => {
  const { pack, cases, receipt } = await load();
  cases.forEach((evalCase) => assert.equal(validateEvalCase(evalCase), true));
  assert.equal(validateEvalPack(pack, cases), true);
  assert.equal(validateEvalReceipt(receipt, pack, cases), true);
  assert.match(evalPackDigest(pack, cases), /^[a-f0-9]{64}$/);
});

test('LLM judge cannot own a hard assertion', async () => {
  const { cases } = await load();
  const evalCase = structuredClone(cases[2]);
  evalCase.hard_assertion = true;
  expectCode(() => validateEvalCase(evalCase), 'MODEL_JUDGE_CANNOT_BE_HARD_ORACLE');
});

test('positive receipt requires mutation sensitivity', async () => {
  const { pack, cases, receipt } = await load();
  receipt.mutation_kills = 0;
  expectCode(() => validateEvalReceipt(receipt, pack, cases), 'HOLLOW_PASS');
});

test('hard failure must propagate to overall FAIL', async () => {
  const { pack, cases, receipt } = await load();
  receipt.case_results[0].state = 'FAIL';
  receipt.overall_state = 'PASS';
  expectCode(() => validateEvalReceipt(receipt, pack, cases), 'HOLLOW_PASS');
  receipt.overall_state = 'NOT_EXERCISED';
  expectCode(() => validateEvalReceipt(receipt, pack, cases), 'HARD_FAILURE_NOT_PROPAGATED');
});

test('source-reported statement cannot become repository runtime PASS', async () => {
  const { pack, cases, receipt } = await load();
  receipt.subject.subject_class = 'SOURCE_REPORTED_EXTERNAL';
  expectCode(() => validateEvalReceipt(receipt, pack, cases), 'SOURCE_REPORT_CANNOT_BE_RUNTIME_PASS');
});

test('every declared case needs an explicit state', async () => {
  const { pack, cases, receipt } = await load();
  receipt.case_results.pop();
  receipt.coverage.executed_cases = 2;
  expectCode(() => validateEvalReceipt(receipt, pack, cases), 'INCOMPLETE_CASE_RESULTS');
});

test('active pack thresholds and blocking cases cannot be weakened', async () => {
  const { pack, cases } = await load();
  const previous = { pack, cases };
  const next = { pack: structuredClone(pack), cases: structuredClone(cases) };
  next.pack.release_thresholds.minimum_pass_rate = 0.5;
  expectCode(() => assertEvalPackRevision(previous, next), 'THRESHOLD_WEAKENED');
  next.pack.release_thresholds.minimum_pass_rate = 1;
  next.cases[0].blocking = false;
  expectCode(() => assertEvalPackRevision(previous, next), 'BLOCKING_CASE_REMOVED');
});
