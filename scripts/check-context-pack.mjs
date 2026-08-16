import { readFile } from 'node:fs/promises';
import { assembleContextPack } from '../src/context/assemble-context-pack.mjs';
import { assertContradictionsVisible } from '../src/context/contract-validation.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const query = await readJson('../fixtures/context/query.ap-route.json');
const processTwin = await readJson('../fixtures/context/process-twin.ap-route.json');
const claimIndex = await readJson('../fixtures/context/claim-index.ap-route.json');
const killed = [];

const contradictory = structuredClone(processTwin);
contradictory.unresolved_contradictions = [{
  contradiction_id: 'contradiction-route',
  claim_ids: ['claim-route-a', 'claim-route-b'],
  subject_id: 'route-exception',
  predicate: 'owner'
}];
const pack = assembleContextPack({ query, processTwin: contradictory, claimIndex });
const hidden = structuredClone(pack);
hidden.unresolved_contradictions = [];
try {
  assertContradictionsVisible(hidden, contradictory);
} catch (error) {
  if (error?.code === 'CONTRADICTION_SUPPRESSED') killed.push('CONTRADICTION_SUPPRESSED');
  else throw error;
}

const constrained = structuredClone(query);
constrained.max_tokens = 20;
const refused = assembleContextPack({ query: constrained, processTwin, claimIndex });
if (
  refused.state === 'REFUSED' &&
  refused.refusal_reasons.includes('CONTEXT_BUDGET_EXCEEDED')
) {
  killed.push('CONTEXT_BUDGET_TRUNCATION');
}

if (killed.length !== 2) throw new Error(`context verifier insensitive: ${killed.join(',')}`);
console.log('PASS context pack controls');
console.log(`mutations_killed = ${killed.join(', ')}`);
console.log(`context_digest = ${pack.context_digest}`);
console.log(`execution_authority = ${pack.execution_authority}`);
