import { sha256 } from '../scripts/lib/contract-validation.mjs';
import { securityFixture } from './security-fixture.mjs';
import { evaluateInvocationSecurity } from '../src/security/evaluate-invocation.mjs';

export function connectorFixture(){
  const security=securityFixture();
  const securityDecision=evaluateInvocationSecurity({...security,now:'2026-08-17T10:05:00Z'});
  const payload={summary:'Invoice and PO mismatch requires review',source_ref:'synthetic:invoice-001'};
  const request={
    schema:'fde-agent/connector-request/v1',request_id:'connector-ap-draft',tenant_ref:'tenant-demo',workflow_digest:security.invocation.workflow_digest,transition_id:security.invocation.transition_id,
    security_invocation_digest:security.invocation.invocation_digest,security_decision_digest:securityDecision.decision_digest,capability_digest:security.capability.capability_digest,
    connector_id:'synthetic-erp',connector_version:'1.0.0',operation_id:'create-draft-case',operation_identity:security.invocation.operation_identity,
    idempotency_key_digest:security.invocation.idempotency_key_digest,endpoint_ref:security.invocation.endpoint_ref,input_ref:'synthetic:payload-ap-001',input_digest:sha256(payload),
    requested_at:'2026-08-17T10:05:00Z',deadline_at:'2026-08-17T10:10:00Z',request_digest:'0'.repeat(64)
  };
  request.request_digest=sha256(request);
  return{...security,securityInvocation:security.invocation,securityDecision,payload,request};
}
