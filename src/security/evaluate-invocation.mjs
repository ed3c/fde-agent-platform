import { sha256 } from '../../scripts/lib/contract-validation.mjs';
import { ACTION_CLASSES, validateConnectorCapability, validatePolicyDecision } from '../policy/contract-validation.mjs';
import {
  validateCapabilityGrant,
  validateEndpointPolicy,
  validateToolInvocation,
  validateToolSecurityDecision
} from './contract-validation.mjs';

const CLASS=['PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED'];
const rank=x=>ACTION_CLASSES.indexOf(x);
const makeDecision=(invocation,grant,capability,outcome,reasons,now)=>{
  const decision={
    schema:'fde-agent/tool-security-decision/v1',
    decision_id:`security-${invocation.invocation_id}`,
    invocation_digest:invocation.invocation_digest,
    grant_digest:grant.grant_digest,
    capability_digest:capability.capability_digest,
    outcome,
    reason_codes:[...new Set(reasons)].sort(),
    effective_action_class:capability.action_class,
    expires_at:new Date(Date.parse(now)+60000).toISOString(),
    decision_digest:'0'.repeat(64),
    execution_admission:outcome==='ALLOW'?'ELIGIBLE_CANDIDATE':'DENIED'
  };
  decision.decision_digest=sha256(decision);validateToolSecurityDecision(decision);return decision;
};

export function evaluateInvocationSecurity({grant,invocation,capability,policyDecision,endpointPolicy,now=invocation.requested_at}){
  validateCapabilityGrant(grant);validateToolInvocation(invocation);validateConnectorCapability(capability);validatePolicyDecision(policyDecision);validateEndpointPolicy(endpointPolicy);
  const reasons=[];
  if(grant.revocation_state!=='ACTIVE')reasons.push('GRANT_NOT_ACTIVE');
  if(Date.parse(grant.expires_at)<=Date.parse(now))reasons.push('GRANT_EXPIRED');
  if(grant.tenant_ref!==invocation.tenant_ref||capability.tenant_ref!==invocation.tenant_ref)reasons.push('TENANT_MISMATCH');
  if(grant.principal_ref!==invocation.principal_ref)reasons.push('PRINCIPAL_MISMATCH');
  if(grant.audience!==invocation.expected_audience)reasons.push('AUDIENCE_MISMATCH');
  if(grant.workflow_digest!==invocation.workflow_digest)reasons.push('WORKFLOW_SUBJECT_MISMATCH');
  if(grant.policy_decision_digest!==invocation.policy_decision_digest||policyDecision.decision_digest!==invocation.policy_decision_digest)reasons.push('POLICY_SUBJECT_MISMATCH');
  if(grant.capability_id!==capability.capability_id||grant.operation_id!==capability.operation_id||invocation.capability_digest!==capability.capability_digest)reasons.push('CAPABILITY_SUBJECT_MISMATCH');
  if(invocation.connector_id!==capability.connector_id||invocation.operation_id!==capability.operation_id)reasons.push('OPERATION_MISMATCH');
  if(invocation.action_class!==capability.action_class||grant.action_class!==capability.action_class)reasons.push('ACTION_CLASS_MISMATCH');
  if(rank(invocation.action_class)>rank(grant.action_class))reasons.push('AUTHORITY_WIDENING');
  if(policyDecision.outcome!=='ALLOW'||policyDecision.execution_admission!=='ELIGIBLE_CANDIDATE')reasons.push('POLICY_NOT_ALLOWED');
  if(Date.parse(policyDecision.expires_at)<=Date.parse(now))reasons.push('POLICY_DECISION_EXPIRED');
  if(capability.state!=='ACTIVE')reasons.push('CAPABILITY_NOT_ACTIVE');
  const requiredScopes=[`workflow:${invocation.workflow_digest}`,`transition:${invocation.transition_id}`,`operation:${invocation.operation_id}`];
  if(requiredScopes.some(scope=>!grant.scope_ids.includes(scope)))reasons.push('GRANT_SCOPE_MISMATCH');
  if(endpointPolicy.connector_id!==invocation.connector_id)reasons.push('ENDPOINT_POLICY_CONNECTOR_MISMATCH');
  if(!endpointPolicy.allowed_endpoint_refs.includes(invocation.endpoint_ref))reasons.push('ENDPOINT_NOT_ALLOWED');
  if(!endpointPolicy.allowed_audiences.includes(invocation.expected_audience))reasons.push('AUDIENCE_NOT_ALLOWED');
  if(!endpointPolicy.allowed_regions.includes(invocation.region)||!capability.allowed_regions.includes(invocation.region))reasons.push('REGION_NOT_ALLOWED');
  if(CLASS.indexOf(invocation.data_classification)>CLASS.indexOf(endpointPolicy.maximum_data_classification)||CLASS.indexOf(invocation.data_classification)>CLASS.indexOf(capability.maximum_data_classification))reasons.push('DATA_CLASSIFICATION_EXCEEDED');
  if(capability.side_effect_class!=='NONE'){
    if(!invocation.operation_identity)reasons.push('OPERATION_IDENTITY_REQUIRED');
    if(capability.idempotency_mode==='CALLER_KEY_REQUIRED'&&invocation.idempotency_key_digest===null)reasons.push('IDEMPOTENCY_KEY_REQUIRED');
  }
  if(capability.action_class==='APPROVED_COMMIT'&&grant.approval_subject_digest===null)reasons.push('APPROVAL_SUBJECT_REQUIRED');
  return makeDecision(invocation,grant,capability,reasons.length?'DENY':'ALLOW',reasons,now);
}
