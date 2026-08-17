import { compileWorkflow } from '../src/workflow/compile-workflow.mjs';
import { validateWorkflowSpec, workflowDigest } from '../src/workflow/contract-validation.mjs';
import { buildCompilerInput } from '../test/helpers/workflow-fixture.mjs';

const workflow = compileWorkflow(buildCompilerInput());
const expectedDigest = 'e0a9bd6cef903cf8c690cba933e40013e19869c1b76947682ddc015053aa5a3e';
if (workflow.workflow_digest !== expectedDigest) throw new Error(`compiled artifact drifted: ${workflow.workflow_digest}`);
const mutations = [
  ['RETRY_WITHOUT_IDEMPOTENCY', (candidate) => { candidate.transitions.find((item) => item.transition_id === 'create-draft-case').retry.requires_idempotency = false; }],
  ['COMPENSATION_REQUIRED', (candidate) => { candidate.transitions.find((item) => item.transition_id === 'create-draft-case').compensation_transition_id = null; }],
  ['UNBOUNDED_CYCLE', (candidate) => { const transition = structuredClone(candidate.transitions.find((item) => item.transition_id === 'compensation-complete')); Object.assign(transition, { transition_id: 'reopen-draft', from: 'compensating', to: 'draft-created', preconditions: ['manual-reopen'], postconditions: ['draft-reopened'] }); candidate.transitions.push(transition); }],
  ['MODEL_HARD_CONTROL_FORBIDDEN', (candidate) => { const transition = candidate.transitions.find((item) => item.transition_id === 'complete-case'); transition.executor_class = 'MODEL'; transition.model_responsibilities.push('AUTHORIZE'); }]
];
const killed = [];
for (const [expectedCode, mutate] of mutations) {
  const candidate = structuredClone(workflow);
  mutate(candidate);
  candidate.workflow_digest = workflowDigest(candidate);
  try {
    validateWorkflowSpec(candidate);
  } catch (error) {
    if (error?.code === expectedCode || (expectedCode === 'RETRY_WITHOUT_IDEMPOTENCY' && error?.code === 'IDEMPOTENCY_REQUIRED')) {
      killed.push(expectedCode);
      continue;
    }
    throw error;
  }
  throw new Error(`mutation survived: ${expectedCode}`);
}
if (killed.length !== mutations.length) throw new Error('workflow verifier insensitive');
console.log('PASS workflow compiler controls');
console.log(`workflow_digest = ${workflow.workflow_digest}`);
console.log(`mutations_killed = ${killed.join(', ')}`);
console.log(`execution_authority = ${workflow.execution_authority}`);
console.log(`production_admission = ${workflow.production_admission}`);
