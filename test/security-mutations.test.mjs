import test from 'node:test';
import assert from 'node:assert/strict';
import { securityFixture } from './security-fixture.mjs';
import { evaluateInvocationSecurity } from '../src/security/evaluate-invocation.mjs';
import { appendSecurityAuditEvent,assertSecurityAuditChain } from '../src/security/audit-chain.mjs';
import { sha256 } from '../scripts/lib/contract-validation.mjs';
const redigest=(x,key)=>{x[key]='0'.repeat(64);x[key]=sha256(x)};

test('revoked grant is killed',()=>{const f=securityFixture();f.grant.revocation_state='REVOKED';redigest(f.grant,'grant_digest');f.invocation.grant_digest=f.grant.grant_digest;redigest(f.invocation,'invocation_digest');const d=evaluateInvocationSecurity({...f,now:'2026-08-17T10:05:00Z'});assert.ok(d.reason_codes.includes('GRANT_NOT_ACTIVE'))});
test('expired grant replay is killed',()=>{const f=securityFixture();const d=evaluateInvocationSecurity({...f,now:'2026-08-17T11:00:01Z'});assert.ok(d.reason_codes.includes('GRANT_EXPIRED'))});
test('policy subject laundering is killed',()=>{const f=securityFixture();f.invocation.policy_decision_digest='f'.repeat(64);redigest(f.invocation,'invocation_digest');const d=evaluateInvocationSecurity({...f,now:'2026-08-17T10:05:00Z'});assert.ok(d.reason_codes.includes('POLICY_SUBJECT_MISMATCH'))});
test('model-selected endpoint field is refused by closed contract',async()=>{const f=securityFixture();f.invocation.model_selected_endpoint='local:evil';const {validateToolInvocation}=await import('../src/security/contract-validation.mjs');assert.throws(()=>validateToolInvocation(f.invocation),e=>e.code==='UNEXPECTED_FIELD')});
test('audit-chain tampering is detected',()=>{const f=securityFixture();const chain=[];appendSecurityAuditEvent(chain,{event_id:'audit-request',tenant_ref:'tenant-demo',event_type:'INVOCATION_REQUESTED',subject_digest:f.invocation.invocation_digest,actor_ref:f.invocation.principal_ref,occurred_at:f.invocation.requested_at,outcome:'PASS',reason_codes:[]});appendSecurityAuditEvent(chain,{event_id:'audit-deny',tenant_ref:'tenant-demo',event_type:'SECURITY_DENIED',subject_digest:f.invocation.invocation_digest,actor_ref:'service:security-gateway',occurred_at:'2026-08-17T10:05:01Z',outcome:'FAIL',reason_codes:['ENDPOINT_NOT_ALLOWED']});chain[0].reason_codes.push('tampered');assert.throws(()=>assertSecurityAuditChain(chain),e=>e.code==='AUDIT_EVENT_DIGEST_MISMATCH')});
