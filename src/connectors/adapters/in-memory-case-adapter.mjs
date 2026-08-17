import { UnknownCompletionError,RateLimitError,PartialSuccessError,SchemaDriftError } from '../errors.mjs';

export function createInMemoryCaseAdapter({faultMode='NONE'}={}){
  const cases=new Map();
  const operations=new Map();
  const adapter={
    connectorId:'synthetic-erp',
    version:'1.0.0',
    endpointRef:'local:synth-erp',
    supportedOperations:['create-draft-case','read-draft-case','delete-draft-case'],
    async execute({operationId,payload,operationIdentity}){
      if(operations.has(operationIdentity))return{...operations.get(operationIdentity),deduplicated:true};
      if(faultMode==='RATE_LIMIT')throw new RateLimitError(250);
      if(operationId==='create-draft-case'){
        const response={case_id:`case-${operationIdentity}`,status:'DRAFT',summary:payload.summary};
        cases.set(response.case_id,response);
        operations.set(operationIdentity,{response,responseRef:`case:${response.case_id}`,sideEffectState:'APPLIED',postconditionState:'VERIFIED',deduplicated:false});
        if(faultMode==='TIMEOUT_AFTER_COMMIT')throw new UnknownCompletionError({operationIdentity,responseRef:`case:${response.case_id}`});
        if(faultMode==='PARTIAL_SUCCESS')throw new PartialSuccessError({operationIdentity,responseRef:`case:${response.case_id}`});
        if(faultMode==='SCHEMA_DRIFT')throw new SchemaDriftError({field:'case_id'});
        return operations.get(operationIdentity);
      }
      if(operationId==='read-draft-case'){
        const response=cases.get(payload.case_id)??null;
        return{response,responseRef:`case:${payload.case_id}`,sideEffectState:'NONE',postconditionState:response?'VERIFIED':'FAILED',deduplicated:false};
      }
      if(operationId==='delete-draft-case'){
        const applied=cases.delete(payload.case_id);
        const response={case_id:payload.case_id,deleted:applied};
        operations.set(operationIdentity,{response,responseRef:`case:${payload.case_id}`,sideEffectState:applied?'APPLIED':'NOT_APPLIED',postconditionState:'VERIFIED',deduplicated:false});
        return operations.get(operationIdentity);
      }
      throw new Error(`unsupported operation ${operationId}`);
    },
    async observeOperation(operationIdentity){return operations.get(operationIdentity)??null},
    snapshot(){return{cases:new Map(cases),operations:new Map(operations)}}
  };
  return adapter;
}
