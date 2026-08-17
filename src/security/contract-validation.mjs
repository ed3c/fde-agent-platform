import {
  assertNoForbiddenSecrets,
  canonicalJson,
  ContractValidationError,
  sha256
} from '../../scripts/lib/contract-validation.mjs';
import { ACTION_CLASSES } from '../policy/contract-validation.mjs';

const ID=/^[a-z][a-z0-9-]{2,95}$/;
const DIGEST=/^[a-f0-9]{64}$/;
const CLASS=['PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED'];
const fail=(code,path,message)=>{throw new ContractValidationError(code,path,message)};
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(v,keys,path)=>{if(!plain(v))fail('INVALID_TYPE',path,'expected object');for(const k of Object.keys(v))if(!keys.includes(k))fail('UNEXPECTED_FIELD',`${path}.${k}`,'not part of contract');for(const k of keys)if(!(k in v))fail('MISSING_FIELD',`${path}.${k}`,'required')};
const str=(v,p,pattern)=>{if(typeof v!=='string'||!v)fail('INVALID_TYPE',p,'expected non-empty string');if(pattern&&!pattern.test(v))fail('INVALID_VALUE',p,'invalid format')};
const bool=(v,p)=>{if(typeof v!=='boolean')fail('INVALID_TYPE',p,'expected boolean')};
const integer=(v,p,min=0)=>{if(!Number.isInteger(v)||v<min)fail('INVALID_VALUE',p,`expected integer >= ${min}`)};
const iso=(v,p)=>{str(v,p);if(Number.isNaN(Date.parse(v)))fail('INVALID_VALUE',p,'expected ISO timestamp')};
const arrStr=(v,p,min=0)=>{if(!Array.isArray(v)||v.length<min)fail('INVALID_VALUE',p,`expected ${min}+ items`);const seen=new Set();v.forEach((x,i)=>{str(x,`${p}[${i}]`);if(seen.has(x))fail('DUPLICATE_IDENTITY',`${p}[${i}]`,'duplicate');seen.add(x)})};
const selfDigest=(value,key,code)=>{str(value[key],`$.${key}`,DIGEST);const copy=structuredClone(value);copy[key]='0'.repeat(64);if(sha256(copy)!==value[key])fail(code,`$.${key}`,'digest mismatch')};

export function validateCapabilityGrant(grant){
  assertNoForbiddenSecrets(grant);
  const keys=['schema','grant_id','tenant_ref','principal_ref','audience','capability_id','operation_id','action_class','scope_ids','issued_at','expires_at','policy_decision_digest','workflow_digest','approval_subject_digest','nonce_digest','revocation_state','grant_digest'];
  exact(grant,keys,'$');
  if(grant.schema!=='fde-agent/capability-grant/v1')fail('SCHEMA_MISMATCH','$.schema','expected capability grant');
  str(grant.grant_id,'$.grant_id',ID);str(grant.tenant_ref,'$.tenant_ref');str(grant.principal_ref,'$.principal_ref');str(grant.audience,'$.audience');
  str(grant.capability_id,'$.capability_id',ID);str(grant.operation_id,'$.operation_id',ID);
  if(!ACTION_CLASSES.includes(grant.action_class))fail('INVALID_VALUE','$.action_class','unknown action class');
  arrStr(grant.scope_ids,'$.scope_ids',3);iso(grant.issued_at,'$.issued_at');iso(grant.expires_at,'$.expires_at');
  if(Date.parse(grant.expires_at)<=Date.parse(grant.issued_at))fail('INVALID_TIME_WINDOW','$.expires_at','must follow issued_at');
  str(grant.policy_decision_digest,'$.policy_decision_digest',DIGEST);str(grant.workflow_digest,'$.workflow_digest',DIGEST);
  if(grant.approval_subject_digest!==null)str(grant.approval_subject_digest,'$.approval_subject_digest',DIGEST);
  str(grant.nonce_digest,'$.nonce_digest',DIGEST);
  if(!['ACTIVE','REVOKED','EXPIRED'].includes(grant.revocation_state))fail('INVALID_VALUE','$.revocation_state','unknown state');
  if(grant.action_class==='APPROVED_COMMIT'&&grant.approval_subject_digest===null)fail('APPROVAL_SUBJECT_REQUIRED','$.approval_subject_digest','approved commit needs Human approval subject');
  selfDigest(grant,'grant_digest','GRANT_DIGEST_MISMATCH');
  return true;
}

export function validateEndpointPolicy(policy){
  assertNoForbiddenSecrets(policy);
  const keys=['schema','endpoint_policy_id','connector_id','allowed_endpoint_refs','allowed_audiences','allowed_regions','maximum_data_classification','deny_private_network_targets','policy_digest'];
  exact(policy,keys,'$');
  if(policy.schema!=='fde-agent/endpoint-policy/v1')fail('SCHEMA_MISMATCH','$.schema','expected endpoint policy');
  str(policy.endpoint_policy_id,'$.endpoint_policy_id',ID);str(policy.connector_id,'$.connector_id',ID);
  arrStr(policy.allowed_endpoint_refs,'$.allowed_endpoint_refs',1);arrStr(policy.allowed_audiences,'$.allowed_audiences',1);arrStr(policy.allowed_regions,'$.allowed_regions',1);
  if(!CLASS.includes(policy.maximum_data_classification))fail('INVALID_VALUE','$.maximum_data_classification','unknown class');bool(policy.deny_private_network_targets,'$.deny_private_network_targets');
  selfDigest(policy,'policy_digest','ENDPOINT_POLICY_DIGEST_MISMATCH');return true;
}

export function validateToolInvocation(invocation){
  assertNoForbiddenSecrets(invocation);
  const keys=['schema','invocation_id','tenant_ref','principal_ref','workflow_digest','transition_id','policy_decision_digest','grant_digest','capability_digest','connector_id','operation_id','action_class','endpoint_ref','request_digest','operation_identity','idempotency_key_digest','requested_at','expected_audience','data_classification','region','invocation_digest'];
  exact(invocation,keys,'$');
  if(invocation.schema!=='fde-agent/tool-invocation/v1')fail('SCHEMA_MISMATCH','$.schema','expected tool invocation');
  str(invocation.invocation_id,'$.invocation_id',ID);str(invocation.tenant_ref,'$.tenant_ref');str(invocation.principal_ref,'$.principal_ref');
  for(const key of ['workflow_digest','policy_decision_digest','grant_digest','capability_digest','request_digest'])str(invocation[key],`$.${key}`,DIGEST);
  str(invocation.transition_id,'$.transition_id',ID);str(invocation.connector_id,'$.connector_id',ID);str(invocation.operation_id,'$.operation_id',ID);
  if(!ACTION_CLASSES.includes(invocation.action_class))fail('INVALID_VALUE','$.action_class','unknown class');
  str(invocation.endpoint_ref,'$.endpoint_ref');str(invocation.operation_identity,'$.operation_identity');
  if(invocation.idempotency_key_digest!==null)str(invocation.idempotency_key_digest,'$.idempotency_key_digest',DIGEST);
  iso(invocation.requested_at,'$.requested_at');str(invocation.expected_audience,'$.expected_audience');
  if(!CLASS.includes(invocation.data_classification))fail('INVALID_VALUE','$.data_classification','unknown class');str(invocation.region,'$.region');
  selfDigest(invocation,'invocation_digest','INVOCATION_DIGEST_MISMATCH');return true;
}

export function validateToolSecurityDecision(decision){
  assertNoForbiddenSecrets(decision);
  const keys=['schema','decision_id','invocation_digest','grant_digest','capability_digest','outcome','reason_codes','effective_action_class','expires_at','decision_digest','execution_admission'];
  exact(decision,keys,'$');
  if(decision.schema!=='fde-agent/tool-security-decision/v1')fail('SCHEMA_MISMATCH','$.schema','expected security decision');
  str(decision.decision_id,'$.decision_id',ID);str(decision.invocation_digest,'$.invocation_digest',DIGEST);str(decision.grant_digest,'$.grant_digest',DIGEST);str(decision.capability_digest,'$.capability_digest',DIGEST);
  if(!['ALLOW','DENY'].includes(decision.outcome))fail('INVALID_VALUE','$.outcome','unknown outcome');arrStr(decision.reason_codes,'$.reason_codes');
  if(!ACTION_CLASSES.includes(decision.effective_action_class))fail('INVALID_VALUE','$.effective_action_class','unknown class');iso(decision.expires_at,'$.expires_at');
  if(!['ELIGIBLE_CANDIDATE','DENIED'].includes(decision.execution_admission))fail('INVALID_VALUE','$.execution_admission','unknown admission');
  if(decision.outcome==='ALLOW'&&decision.execution_admission!=='ELIGIBLE_CANDIDATE')fail('DECISION_STATE_MISMATCH','$.execution_admission','allow must be candidate');
  if(decision.outcome==='DENY'&&decision.execution_admission!=='DENIED')fail('DECISION_STATE_MISMATCH','$.execution_admission','deny must be denied');
  selfDigest(decision,'decision_digest','SECURITY_DECISION_DIGEST_MISMATCH');return true;
}

export function validateSecurityAuditEvent(event){
  assertNoForbiddenSecrets(event);
  const keys=['schema','event_id','tenant_ref','sequence','previous_event_digest','event_type','subject_digest','actor_ref','occurred_at','outcome','reason_codes','event_digest'];
  exact(event,keys,'$');
  if(event.schema!=='fde-agent/security-audit-event/v1')fail('SCHEMA_MISMATCH','$.schema','expected audit event');
  str(event.event_id,'$.event_id',ID);str(event.tenant_ref,'$.tenant_ref');integer(event.sequence,'$.sequence');
  if(event.previous_event_digest!==null)str(event.previous_event_digest,'$.previous_event_digest',DIGEST);
  if(!['INVOCATION_REQUESTED','SECURITY_ALLOWED','SECURITY_DENIED','CONNECTOR_COMPLETED','CONNECTOR_UNKNOWN','RECONCILIATION_REQUIRED'].includes(event.event_type))fail('INVALID_VALUE','$.event_type','unknown event type');
  str(event.subject_digest,'$.subject_digest',DIGEST);str(event.actor_ref,'$.actor_ref');iso(event.occurred_at,'$.occurred_at');
  if(!['PASS','FAIL','UNKNOWN'].includes(event.outcome))fail('INVALID_VALUE','$.outcome','unknown outcome');arrStr(event.reason_codes,'$.reason_codes');
  selfDigest(event,'event_digest','AUDIT_EVENT_DIGEST_MISMATCH');return true;
}

export const securityCanonical=value=>canonicalJson(value);
