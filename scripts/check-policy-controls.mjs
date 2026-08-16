import { readFile } from 'node:fs/promises';
import { sha256 } from './lib/contract-validation.mjs';
import { evaluatePolicy } from '../src/policy/evaluate-policy.mjs';
import { policyApprovalSubjectDigest } from '../src/policy/contract-validation.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const capability = await readJson('../fixtures/policy/capability.draft-case.json');
const request = await readJson('../fixtures/policy/request.draft-case.json');
const killed = [];

const unknown = structuredClone(capability);
unknown.operation_id = 'unknown-operation';
unknown.capability_digest = '0'.repeat(64);
unknown.capability_digest = sha256(unknown);
if (
  evaluatePolicy({ capability: unknown, request }).reason_codes.includes('UNKNOWN_CAPABILITY')
) killed.push('DEFAULT_ALLOW_UNKNOWN_CAPABILITY');

const commitCapability = await readJson('../fixtures/policy/capability.commit-route.json');
const commitRequest = await readJson('../fixtures/policy/request.commit-route.json');
commitRequest.approval.approver_identity_ref = commitRequest.caller_identity_ref;
commitRequest.approval.subject_digest = policyApprovalSubjectDigest(commitRequest);
if (
  evaluatePolicy({ capability: commitCapability, request: commitRequest })
    .reason_codes.includes('SEPARATION_OF_DUTIES_VIOLATION')
) killed.push('SOD_BYPASS');

if (killed.length !== 2) throw new Error(`policy verifier insensitive: ${killed.join(',')}`);
console.log('PASS policy controls');
console.log(`mutations_killed = ${killed.join(', ')}`);
