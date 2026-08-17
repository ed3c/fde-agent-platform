import test from 'node:test';
import assert from 'node:assert/strict';
import { connectorFixture } from './connector-fixture.mjs';
import { createInMemoryCaseAdapter } from '../src/connectors/adapters/in-memory-case-adapter.mjs';
import { invokeConnector } from '../src/connectors/gateway.mjs';
import { sha256 } from '../scripts/lib/contract-validation.mjs';
const redigest=(x,key)=>{x[key]='0'.repeat(64);x[key]=sha256(x)};

test('security decision tampering is killed',async()=>{const f=connectorFixture();f.securityDecision.reason_codes.push('tampered');await assert.rejects(()=>invokeConnector({...f,adapter:createInMemoryCaseAdapter(),auditChain:[]}),e=>e.code==='SECURITY_DECISION_DIGEST_MISMATCH')});
test('cross-tenant connector request is killed',async()=>{const f=connectorFixture();f.request.tenant_ref='tenant-other';redigest(f.request,'request_digest');await assert.rejects(()=>invokeConnector({...f,adapter:createInMemoryCaseAdapter(),auditChain:[]}),e=>e.code==='SECURITY_BINDING_MISMATCH')});
test('input subject tampering is killed',async()=>{const f=connectorFixture();f.payload.summary='changed after approval';await assert.rejects(()=>invokeConnector({...f,adapter:createInMemoryCaseAdapter(),auditChain:[]}),e=>e.code==='INPUT_DIGEST_MISMATCH')});
test('adapter endpoint substitution is killed',async()=>{const f=connectorFixture();const adapter=createInMemoryCaseAdapter();adapter.endpointRef='local:other';await assert.rejects(()=>invokeConnector({...f,adapter,auditChain:[]}),e=>e.code==='ADAPTER_IDENTITY_MISMATCH')});
test('schema drift is explicit failure requiring reconciliation',async()=>{const f=connectorFixture();const out=await invokeConnector({...f,adapter:createInMemoryCaseAdapter({faultMode:'SCHEMA_DRIFT'}),auditChain:[]});assert.equal(out.result.disposition,'FAILED');assert.equal(out.result.error_code,'SCHEMA_DRIFT');assert.equal(out.result.reconciliation_required,true)});
test('partial success is never promoted to success',async()=>{const f=connectorFixture();const out=await invokeConnector({...f,adapter:createInMemoryCaseAdapter({faultMode:'PARTIAL_SUCCESS'}),auditChain:[]});assert.equal(out.result.disposition,'PARTIAL');assert.equal(out.result.side_effect_state,'PARTIAL');assert.equal(out.result.reconciliation_required,true)});
