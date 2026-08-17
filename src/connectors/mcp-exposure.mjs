import { sha256 } from '../../scripts/lib/contract-validation.mjs';
import { validateConnectorCapability } from '../policy/contract-validation.mjs';
import { validateMcpToolDescriptor } from './contract-validation.mjs';

export function describeMcpTool({capability,inputSchemaDigest,outputSchemaDigest}){
  validateConnectorCapability(capability);
  const descriptor={
    schema:'fde-agent/mcp-tool-descriptor/v1',
    tool_id:`${capability.connector_id}.${capability.operation_id}`,
    title:`${capability.operation_id} (${capability.connector_id})`,
    description:'Governed descriptor only; invocation requires separate policy and security decisions.',
    capability_digest:capability.capability_digest,
    connector_id:capability.connector_id,
    operation_id:capability.operation_id,
    input_schema_digest:inputSchemaDigest,
    output_schema_digest:outputSchemaDigest,
    exposure_mode:'DISCOVERABLE',
    policy_required:true,
    security_required:true,
    execution_admission:'NONE',
    descriptor_digest:'0'.repeat(64)
  };
  descriptor.descriptor_digest=sha256(descriptor);
  validateMcpToolDescriptor(descriptor);
  return descriptor;
}
