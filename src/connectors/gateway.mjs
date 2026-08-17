import { sha256 } from '../../scripts/lib/contract-validation.mjs';
import { validateConnectorCapability } from '../policy/contract-validation.mjs';
import { validateToolSecurityDecision,validateToolInvocation } from '../security/contract-validation.mjs';
import { appendSecurityAuditEvent,assertSecurityAuditChain } from '../security/audit-chain.mjs';
import {
  assertConnectorSecurityBinding,
  validateConnectorReceipt,
  validateConnectorRequest,
  validateConnectorResult
} from './contract-validation.mjs';
import { UnknownCompletionError,RateLimitError,PartialSuccessError,SchemaDriftError } from './errors.mjs';

const connectorSubject=adapter=>`${adapter.connectorId}@${adapter.version}`;
const makeResult=({request,adapter,disposition,attempt,observedAt,responseRef=null,responseDigest=null,postconditionState='UNKNOWN',sideEffectState='UNKNOWN',retryAfterMs=null,errorCode=null,deduplicated=false,reconciliationRequired=false})=>{
  const result={schema:'fde-agent/connector-result/v1',result_id:`result-${request.request_id}-${attempt}`,request_digest:request.request_digest,connector_subject:connectorSubject(adapter),disposition,attempt,observed_at:observedAt,response_ref:responseRef,response_digest:responseDigest,postcondition_state:postconditionState,side_effect_state:sideEffectState,retry_after_ms:retryAfterMs,error_code:errorCode,deduplicated,reconciliation_required:reconciliationRequired,result_digest:'0'.repeat(64)};
  result.result_digest=sha256(result);validateConnectorResult(result);return result;
};
const makeReceipt=({request,securityDecision,capability,adapter,startedAt,finishedAt,result,auditChain})=>{
  assertSecurityAuditChain(auditChain);
  const receipt={schema:'fde-agent/connector-receipt/v1',receipt_id:`receipt-${request.request_id}`,request_digest:request.request_digest,security_decision_digest:securityDecision.decision_digest,capability_digest:capability.capability_digest,connector_subject:connectorSubject(adapter),started_at:startedAt,finished_at:finishedAt,result_digest:result.result_digest,audit_head_digest:auditChain[auditChain.length-1].event_digest,outcome:result.disposition,evidence_level:'SYNTHETIC',receipt_digest:'0'.repeat(64)};
  receipt.receipt_digest=sha256(receipt);validateConnectorReceipt(receipt);return receipt;
};

export async function invokeConnector({request,payload,securityInvocation,securityDecision,capability,adapter,auditChain=[],now=request.requested_at,attempt=1}){
  validateConnectorRequest(request);validateToolInvocation(securityInvocation);validateToolSecurityDecision(securityDecision);validateConnectorCapability(capability);assertConnectorSecurityBinding({request,securityInvocation,securityDecision,capability});
  if(Date.parse(securityDecision.expires_at)<=Date.parse(now))throw Object.assign(new Error('security decision expired'),{code:'SECURITY_DECISION_EXPIRED'});
  if(adapter.connectorId!==request.connector_id||adapter.version!==request.connector_version||adapter.endpointRef!==request.endpoint_ref||!adapter.supportedOperations.includes(request.operation_id))throw Object.assign(new Error('adapter identity mismatch'),{code:'ADAPTER_IDENTITY_MISMATCH'});
  if(sha256(payload)!==request.input_digest)throw Object.assign(new Error('input digest mismatch'),{code:'INPUT_DIGEST_MISMATCH'});
  if(Date.parse(now)>Date.parse(request.deadline_at))throw Object.assign(new Error('request deadline exceeded'),{code:'REQUEST_DEADLINE_EXCEEDED'});
  appendSecurityAuditEvent(auditChain,{event_id:`audit-${request.request_id}-requested-${attempt}`,tenant_ref:request.tenant_ref,event_type:'INVOCATION_REQUESTED',subject_digest:request.request_digest,actor_ref:securityInvocation.principal_ref,occurred_at:now,outcome:'PASS',reason_codes:[]});
  let result;
  try{
    const output=await adapter.execute({operationId:request.operation_id,payload,operationIdentity:request.operation_identity,idempotencyKeyDigest:request.idempotency_key_digest});
    result=makeResult({request,adapter,disposition:'SUCCEEDED',attempt,observedAt:now,responseRef:output.responseRef,responseDigest:sha256(output.response),postconditionState:output.postconditionState,sideEffectState:output.sideEffectState,deduplicated:output.deduplicated});
    appendSecurityAuditEvent(auditChain,{event_id:`audit-${request.request_id}-completed-${attempt}`,tenant_ref:request.tenant_ref,event_type:'CONNECTOR_COMPLETED',subject_digest:result.result_digest,actor_ref:`connector:${adapter.connectorId}`,occurred_at:now,outcome:'PASS',reason_codes:[]});
  }catch(error){
    if(error instanceof UnknownCompletionError){
      result=makeResult({request,adapter,disposition:'UNKNOWN_COMPLETION',attempt,observedAt:now,responseRef:error.details.responseRef??null,postconditionState:'UNKNOWN',sideEffectState:'UNKNOWN',errorCode:error.code,reconciliationRequired:true});
      appendSecurityAuditEvent(auditChain,{event_id:`audit-${request.request_id}-unknown-${attempt}`,tenant_ref:request.tenant_ref,event_type:'CONNECTOR_UNKNOWN',subject_digest:result.result_digest,actor_ref:`connector:${adapter.connectorId}`,occurred_at:now,outcome:'UNKNOWN',reason_codes:['RECONCILIATION_REQUIRED']});
    }else if(error instanceof RateLimitError){
      result=makeResult({request,adapter,disposition:'RATE_LIMITED',attempt,observedAt:now,postconditionState:'NOT_APPLICABLE',sideEffectState:'NOT_APPLIED',retryAfterMs:error.details.retryAfterMs,errorCode:error.code});
      appendSecurityAuditEvent(auditChain,{event_id:`audit-${request.request_id}-rate-${attempt}`,tenant_ref:request.tenant_ref,event_type:'CONNECTOR_COMPLETED',subject_digest:result.result_digest,actor_ref:`connector:${adapter.connectorId}`,occurred_at:now,outcome:'FAIL',reason_codes:['RATE_LIMITED']});
    }else if(error instanceof PartialSuccessError){
      result=makeResult({request,adapter,disposition:'PARTIAL',attempt,observedAt:now,responseRef:error.details.responseRef??null,postconditionState:'UNKNOWN',sideEffectState:'PARTIAL',errorCode:error.code,reconciliationRequired:true});
      appendSecurityAuditEvent(auditChain,{event_id:`audit-${request.request_id}-partial-${attempt}`,tenant_ref:request.tenant_ref,event_type:'RECONCILIATION_REQUIRED',subject_digest:result.result_digest,actor_ref:`connector:${adapter.connectorId}`,occurred_at:now,outcome:'UNKNOWN',reason_codes:['PARTIAL_SUCCESS']});
    }else if(error instanceof SchemaDriftError){
      result=makeResult({request,adapter,disposition:'FAILED',attempt,observedAt:now,postconditionState:'FAILED',sideEffectState:'UNKNOWN',errorCode:error.code,reconciliationRequired:true});
      appendSecurityAuditEvent(auditChain,{event_id:`audit-${request.request_id}-schema-${attempt}`,tenant_ref:request.tenant_ref,event_type:'RECONCILIATION_REQUIRED',subject_digest:result.result_digest,actor_ref:`connector:${adapter.connectorId}`,occurred_at:now,outcome:'FAIL',reason_codes:['SCHEMA_DRIFT']});
    }else throw error;
  }
  return{result,receipt:makeReceipt({request,securityDecision,capability,adapter,startedAt:now,finishedAt:now,result,auditChain}),auditChain};
}

export async function reconcileConnectorResult({request,priorResult,adapter,auditChain=[],now}){
  validateConnectorRequest(request);validateConnectorResult(priorResult);
  if(!priorResult.reconciliation_required)throw Object.assign(new Error('reconciliation not required'),{code:'RECONCILIATION_NOT_REQUIRED'});
  const observed=await adapter.observeOperation(request.operation_identity);
  let result;
  if(observed){
    result=makeResult({request,adapter,disposition:'SUCCEEDED',attempt:priorResult.attempt,observedAt:now,responseRef:observed.responseRef,responseDigest:sha256(observed.response),postconditionState:observed.postconditionState,sideEffectState:observed.sideEffectState,deduplicated:true});
  }else{
    result=makeResult({request,adapter,disposition:'FAILED',attempt:priorResult.attempt,observedAt:now,postconditionState:'FAILED',sideEffectState:'NOT_APPLIED',errorCode:'NOT_OBSERVED'});
  }
  appendSecurityAuditEvent(auditChain,{event_id:`audit-${request.request_id}-reconciled-${priorResult.attempt}`,tenant_ref:request.tenant_ref,event_type:'CONNECTOR_COMPLETED',subject_digest:result.result_digest,actor_ref:`connector:${adapter.connectorId}`,occurred_at:now,outcome:result.disposition==='SUCCEEDED'?'PASS':'FAIL',reason_codes:[]});
  return result;
}
