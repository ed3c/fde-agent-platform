import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  assertPilotRevision,
  scoreOpportunity,
  validateBoundedValuePilot,
  validateOpportunityCandidate,
  validateOutcomeCharter
} from '../src/discovery/contract-validation.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const expectCode = (fn, code) => assert.throws(fn, (error) => error?.code === code);

const load = async () => ({
  opportunity: await readJson('../fixtures/discovery/opportunity.ap-exception.json'),
  charter: await readJson('../fixtures/discovery/outcome-charter.ap-exception.json'),
  pilot: await readJson('../fixtures/discovery/pilot.ap-exception.json')
});

test('opportunity score is deterministic and explicit', async () => {
  const { opportunity } = await load();
  assert.equal(validateOpportunityCandidate(opportunity), true);
  assert.equal(scoreOpportunity(opportunity), 1777.777778);
  assert.equal(scoreOpportunity(structuredClone(opportunity)), scoreOpportunity(opportunity));
});

test('verified baseline admits an outcome-linked candidate', async () => {
  const { charter } = await load();
  assert.equal(validateOutcomeCharter(charter), true);
});

test('disputed baseline blocks outcome-linked pricing', async () => {
  const { charter } = await load();
  charter.baseline.state = 'DISPUTED';
  expectCode(() => validateOutcomeCharter(charter), 'BASELINE_NOT_VERIFIED');
});

test('bounded value pilot references exact opportunity and charter', async () => {
  const { opportunity, charter, pilot } = await load();
  assert.equal(validateBoundedValuePilot(pilot, opportunity, charter), true);
});

test('high risk requires a safety POC and lower action ceiling', async () => {
  const { opportunity, charter, pilot } = await load();
  opportunity.dimensions.risk = 5;
  pilot.technical_safety_poc_required = false;
  expectCode(() => validateBoundedValuePilot(pilot, opportunity, charter), 'SAFETY_POC_REQUIRED');
  pilot.technical_safety_poc_required = true;
  pilot.action_ceiling = 'REVERSIBLE_ACTION';
  expectCode(() => validateBoundedValuePilot(pilot, opportunity, charter), 'ACTION_CEILING_TOO_HIGH');
});

test('irreversible production actions are rejected', async () => {
  const { opportunity, charter, pilot } = await load();
  pilot.allowed_actions.push('final-post-payment');
  expectCode(() => validateBoundedValuePilot(pilot, opportunity, charter), 'PROHIBITED_PILOT_ACTION');
});

test('kill criteria cannot be changed after results are observed', async () => {
  const { charter } = await load();
  const previous = { charter };
  const next = { charter: structuredClone(charter) };
  next.charter.kill_criteria[0].threshold = 999;
  expectCode(() => assertPilotRevision(previous, next, true), 'POST_HOC_KILL_CRITERIA_CHANGE');
  assert.equal(assertPilotRevision(previous, next, false), true);
});
