import test from 'node:test';
import assert from 'node:assert/strict';
import { securityFixture } from './security-fixture.mjs';
import { validateCapabilityGrant,validateEndpointPolicy,validateToolInvocation } from '../src/security/contract-validation.mjs';

test('security contracts accept the reviewed synthetic subjects',()=>{const f=securityFixture();assert.equal(validateCapabilityGrant(f.grant),true);assert.equal(validateEndpointPolicy(f.endpointPolicy),true);assert.equal(validateToolInvocation(f.invocation),true)});
test('grant cannot contain a secret-bearing field',()=>{const f=securityFixture();f.grant.client_secret='x';assert.throws(()=>validateCapabilityGrant(f.grant),e=>e.code==='FORBIDDEN_SECRET_FIELD')});
test('approved commit grant requires approval subject',()=>{const f=securityFixture();f.grant.action_class='APPROVED_COMMIT';f.grant.grant_digest='0'.repeat(64);assert.throws(()=>validateCapabilityGrant(f.grant),e=>e.code==='APPROVAL_SUBJECT_REQUIRED')});
test('invocation digest is exact-subject bound',()=>{const f=securityFixture();f.invocation.region='us-east';assert.throws(()=>validateToolInvocation(f.invocation),e=>e.code==='INVOCATION_DIGEST_MISMATCH')});
