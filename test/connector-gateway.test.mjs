import test from 'node:test';
import assert from 'node:assert/strict';
import { connectorFixture } from './connector-fixture.mjs';
import { ConnectorRegistry } from '../src/connectors/registry.mjs';
import { invokeConnector } from '../src/connectors/gateway.mjs';

const createStubAdapter=()=>({
  connectorId:'synthetic-erp',version:'1.0.0',endpointRef:'local:synth-erp',supportedOperations:['create-draft-case'],
  async execute({payload}){return{response:{case_id:'case-stub',status:'DRAFT',summary:payload.summary},responseRef:'case:case-stub',sideEffectState:'APPLIED',postconditionState:'VERIFIED',deduplicated:false}},
  async observeOperation(){return null}
});

test('registry resolves only the exact connector version',()=>{
  const registry=new ConnectorRegistry();const adapter=createStubAdapter();
  assert.equal(registry.register(adapter),'synthetic-erp@1.0.0');
  assert.equal(registry.resolve('synthetic-erp','1.0.0'),adapter);
  assert.throws(()=>registry.resolve('synthetic-erp','2.0.0'),error=>error.code==='CONNECTOR_NOT_REGISTERED');
});

test('gateway binds exact security and adapter identities before synthetic dispatch',async()=>{
  const fixture=connectorFixture();
  const output=await invokeConnector({...fixture,adapter:createStubAdapter(),auditChain:[]});
  assert.equal(output.result.disposition,'SUCCEEDED');
  assert.equal(output.receipt.evidence_level,'SYNTHETIC');
  assert.equal(output.auditChain.length,2);
});
