import test from 'node:test';
import assert from 'node:assert/strict';
import { securityFixture } from './security-fixture.mjs';
import { evaluateInvocationSecurity } from '../src/security/evaluate-invocation.mjs';
import { appendSecurityAuditEvent,assertSecurityAuditChain } from '../src/security/audit-chain.mjs';
import { sha256 } from '../scripts/lib/contract-validation.mjs';

const redigest=(x,key)=>{x[key]='0'.repeat(64);x[key]=sha256(x)};
test('valid exact invocation is an eligible candidate only',()=>{const f=securityFixture();const d=evaluateInvocationSecurity({...f,now:'2026-08-17T10:05:00Z'});assert.equal(d.outcome,'ALLOW');assert.equal(d.execution_admission,'ELIGIBLE_CANDIDATE')});
test('audience mismatch denies',()=>{const f=securityFixture();f.invocation.expected_audience='other-gateway';redigest(f.invocation,'invocation_digest');const d=evaluateInvocationSecurity({...f,now:'2026-08-17T10:05:00Z'});assert.equal(d.outcome,'DENY');assert.ok(d.reason_codes.includes('AUDIENCE_MISMATCH'))});
test('cross-tenant invocation denies',()=>{const f=securityFixture();f.invocation.tenant_ref='tenant-other';redigest(f.invocation,'invocation_digest');const d=evaluateInvocationSecurity({...f,now:'2026-08-17T10:05:00Z'});assert.equal(d.outcome,'DENY');assert.ok(d.reason_codes.includes('TENANT_MISMATCH'))});
test('unlisted logical endpoint denies',()=>{const f=securityFixture();f.invocation.endpoint_ref='https://169.254.169.254/latest/meta-data';redigest(f.invocation,'invocation_digest');const d=evaluateInvocationSecurity({...f,now:'2026-08-17T10:05:00Z'});assert.equal(d.outcome,'DENY');assert.ok(d.reason_codes.includes('ENDPOINT_NOT_ALLOWED'))});
test('audit chain is append-only and exact',()=>{const f=securityFixture();const chain=[];appendSecurityAuditEvent(chain,{event_id:'audit-request',tenant_ref:'tenant-demo',event_type:'INVOCATION_REQUESTED',subject_digest:f.invocation.invocation_digest,actor_ref:f.invocation.principal_ref,occurred_at:f.invocation.requested_at,outcome:'PASS',reason_codes:[]});appendSecurityAuditEvent(chain,{event_id:'audit-allow',tenant_ref:'tenant-demo',event_type:'SECURITY_ALLOWED',subject_digest:f.invocation.invocation_digest,actor_ref:'service:security-gateway',occurred_at:'2026-08-17T10:05:01Z',outcome:'PASS',reason_codes:[]});assert.equal(assertSecurityAuditChain(chain),true)});
