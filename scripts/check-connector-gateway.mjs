import { connectorFixture } from '../test/connector-fixture.mjs';
import { createInMemoryCaseAdapter } from '../src/connectors/adapters/in-memory-case-adapter.mjs';
import { invokeConnector } from '../src/connectors/gateway.mjs';
import { sha256 } from './lib/contract-validation.mjs';
const killed=[];const redigest=(x,key)=>{x[key]='0'.repeat(64);x[key]=sha256(x)};
{
  const f=connectorFixture();f.payload.summary='tampered';try{await invokeConnector({...f,adapter:createInMemoryCaseAdapter(),auditChain:[]})}catch(e){if(e.code==='INPUT_DIGEST_MISMATCH')killed.push('INPUT_SUBJECT_TAMPERING')}
}
{
  const f=connectorFixture();const out=await invokeConnector({...f,adapter:createInMemoryCaseAdapter({faultMode:'TIMEOUT_AFTER_COMMIT'}),auditChain:[]});if(out.result.disposition==='UNKNOWN_COMPLETION'&&out.result.reconciliation_required)killed.push('BLIND_RETRY_AFTER_UNKNOWN_COMPLETION');
}
{
  const f=connectorFixture();f.request.tenant_ref='tenant-other';redigest(f.request,'request_digest');try{await invokeConnector({...f,adapter:createInMemoryCaseAdapter(),auditChain:[]})}catch(e){if(e.code==='SECURITY_BINDING_MISMATCH')killed.push('CROSS_TENANT_CONFUSED_DEPUTY')}
}
{
  const f=connectorFixture();const adapter=createInMemoryCaseAdapter();adapter.endpointRef='local:other';try{await invokeConnector({...f,adapter,auditChain:[]})}catch(e){if(e.code==='ADAPTER_IDENTITY_MISMATCH')killed.push('ADAPTER_ENDPOINT_SUBSTITUTION')}
}
if(killed.length!==4){console.error('FAIL connector gateway controls',killed);process.exit(1)}
console.log('PASS connector gateway controls');console.log(`mutations_killed = ${killed.join(', ')}`);console.log('live_provider = NOT_EXERCISED');
