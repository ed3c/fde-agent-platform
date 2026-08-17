import { securityFixture } from '../test/security-fixture.mjs';
import { evaluateInvocationSecurity } from '../src/security/evaluate-invocation.mjs';
import { appendSecurityAuditEvent,assertSecurityAuditChain } from '../src/security/audit-chain.mjs';
import { sha256 } from './lib/contract-validation.mjs';
const killed=[];const redigest=(x,key)=>{x[key]='0'.repeat(64);x[key]=sha256(x)};
{
  const f=securityFixture();f.grant.revocation_state='REVOKED';redigest(f.grant,'grant_digest');f.invocation.grant_digest=f.grant.grant_digest;redigest(f.invocation,'invocation_digest');const d=evaluateInvocationSecurity({...f,now:'2026-08-17T10:05:00Z'});if(d.reason_codes.includes('GRANT_NOT_ACTIVE'))killed.push('REVOKED_GRANT_REPLAY');
}
{
  const f=securityFixture();f.invocation.endpoint_ref='https://169.254.169.254/latest/meta-data';redigest(f.invocation,'invocation_digest');const d=evaluateInvocationSecurity({...f,now:'2026-08-17T10:05:00Z'});if(d.reason_codes.includes('ENDPOINT_NOT_ALLOWED'))killed.push('ARBITRARY_ENDPOINT_SELECTION');
}
{
  const f=securityFixture();f.invocation.expected_audience='wrong-audience';redigest(f.invocation,'invocation_digest');const d=evaluateInvocationSecurity({...f,now:'2026-08-17T10:05:00Z'});if(d.reason_codes.includes('AUDIENCE_MISMATCH'))killed.push('AUDIENCE_MISMATCH');
}
{
  const f=securityFixture();const chain=[];appendSecurityAuditEvent(chain,{event_id:'audit-one',tenant_ref:'tenant-demo',event_type:'INVOCATION_REQUESTED',subject_digest:f.invocation.invocation_digest,actor_ref:f.invocation.principal_ref,occurred_at:f.invocation.requested_at,outcome:'PASS',reason_codes:[]});chain[0].actor_ref='tampered';try{assertSecurityAuditChain(chain)}catch(e){if(e.code==='AUDIT_EVENT_DIGEST_MISMATCH')killed.push('AUDIT_TAMPERING')}
}
if(killed.length!==4){console.error('FAIL security controls',killed);process.exit(1)}
console.log('PASS security controls');console.log(`mutations_killed = ${killed.join(', ')}`);console.log('execution_admission = ELIGIBLE_CANDIDATE_ONLY');
