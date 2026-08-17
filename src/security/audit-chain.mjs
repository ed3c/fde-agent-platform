import { sha256, ContractValidationError } from '../../scripts/lib/contract-validation.mjs';
import { validateSecurityAuditEvent } from './contract-validation.mjs';
const fail=(c,p,m)=>{throw new ContractValidationError(c,p,m)};
export function appendSecurityAuditEvent(chain,input){
  const previous=chain.length?chain[chain.length-1]:null;
  const event={
    schema:'fde-agent/security-audit-event/v1',
    event_id:input.event_id,
    tenant_ref:input.tenant_ref,
    sequence:previous?previous.sequence+1:0,
    previous_event_digest:previous?previous.event_digest:null,
    event_type:input.event_type,
    subject_digest:input.subject_digest,
    actor_ref:input.actor_ref,
    occurred_at:input.occurred_at,
    outcome:input.outcome,
    reason_codes:[...(input.reason_codes??[])].sort(),
    event_digest:'0'.repeat(64)
  };
  event.event_digest=sha256(event);validateSecurityAuditEvent(event);chain.push(event);return event;
}
export function assertSecurityAuditChain(chain){
  chain.forEach((event,index)=>{
    validateSecurityAuditEvent(event);
    if(event.sequence!==index)fail('AUDIT_SEQUENCE_MISMATCH',`$[${index}].sequence`,'unexpected sequence');
    const expected=index===0?null:chain[index-1].event_digest;
    if(event.previous_event_digest!==expected)fail('AUDIT_CHAIN_BROKEN',`$[${index}].previous_event_digest`,'chain mismatch');
  });
  return true;
}
