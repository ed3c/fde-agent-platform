import { sha256 } from '../scripts/lib/contract-validation.mjs';

export const makeCapability=()=>{
  const value={
    schema:'fde-agent/connector-capability/v1',capability_id:'cap-ap-draft-case',tenant_ref:'tenant-demo',connector_id:'synthetic-erp',system_id:'erp',connector_version:'1.0.0',operation_id:'create-draft-case',action_class:'DRAFT',side_effect_class:'REVERSIBLE',reversible:true,idempotency_mode:'CALLER_KEY_REQUIRED',compensation_operation_id:'delete-draft-case',audit_required:true,sandbox_supported:true,maximum_data_classification:'CONFIDENTIAL',allowed_regions:['ap-east'],retention_mode:'ZERO',approval_mode:'NEVER',required_approver_roles:[],postcondition_observer:'read-draft-case',state:'ACTIVE',capability_digest:'0'.repeat(64)
  };value.capability_digest=sha256(value);return value;
};
export const makePolicyDecision=(capability=makeCapability())=>{
  const value={schema:'fde-agent/policy-decision/v1',decision_id:'decision-ap-draft-case',request_digest:'a'.repeat(64),capability_digest:capability.capability_digest,outcome:'ALLOW',reason_codes:[],effective_action_class:'DRAFT',approval_required:false,expires_at:'2026-08-17T12:00:00Z',decision_digest:'0'.repeat(64),execution_admission:'ELIGIBLE_CANDIDATE'};value.decision_digest=sha256(value);return value;
};
export const makeEndpointPolicy=()=>{
  const value={schema:'fde-agent/endpoint-policy/v1',endpoint_policy_id:'endpoint-synthetic-erp',connector_id:'synthetic-erp',allowed_endpoint_refs:['local:synth-erp'],allowed_audiences:['connector-gateway'],allowed_regions:['ap-east'],maximum_data_classification:'CONFIDENTIAL',deny_private_network_targets:true,policy_digest:'0'.repeat(64)};value.policy_digest=sha256(value);return value;
};
export const makeGrant=(capability=makeCapability(),policyDecision=makePolicyDecision(capability))=>{
  const workflowDigest='b'.repeat(64);
  const value={schema:'fde-agent/capability-grant/v1',grant_id:'grant-ap-draft-case',tenant_ref:'tenant-demo',principal_ref:'service:workflow-runtime',audience:'connector-gateway',capability_id:capability.capability_id,operation_id:capability.operation_id,action_class:'DRAFT',scope_ids:[`workflow:${workflowDigest}`,'transition:create-draft','operation:create-draft-case'],issued_at:'2026-08-17T10:00:00Z',expires_at:'2026-08-17T11:00:00Z',policy_decision_digest:policyDecision.decision_digest,workflow_digest:workflowDigest,approval_subject_digest:null,nonce_digest:'c'.repeat(64),revocation_state:'ACTIVE',grant_digest:'0'.repeat(64)};value.grant_digest=sha256(value);return value;
};
export const makeInvocation=(capability=makeCapability(),policyDecision=makePolicyDecision(capability),grant=makeGrant(capability,policyDecision))=>{
  const value={schema:'fde-agent/tool-invocation/v1',invocation_id:'invoke-ap-draft-case',tenant_ref:'tenant-demo',principal_ref:'service:workflow-runtime',workflow_digest:grant.workflow_digest,transition_id:'create-draft',policy_decision_digest:policyDecision.decision_digest,grant_digest:grant.grant_digest,capability_digest:capability.capability_digest,connector_id:'synthetic-erp',operation_id:'create-draft-case',action_class:'DRAFT',endpoint_ref:'local:synth-erp',request_digest:'d'.repeat(64),operation_identity:'operation-ap-001',idempotency_key_digest:'e'.repeat(64),requested_at:'2026-08-17T10:05:00Z',expected_audience:'connector-gateway',data_classification:'CONFIDENTIAL',region:'ap-east',invocation_digest:'0'.repeat(64)};value.invocation_digest=sha256(value);return value;
};
export const securityFixture=()=>{const capability=makeCapability();const policyDecision=makePolicyDecision(capability);const endpointPolicy=makeEndpointPolicy();const grant=makeGrant(capability,policyDecision);const invocation=makeInvocation(capability,policyDecision,grant);return{capability,policyDecision,endpointPolicy,grant,invocation};};
