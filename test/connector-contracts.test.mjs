import test from 'node:test';
import assert from 'node:assert/strict';
import { connectorFixture } from './connector-fixture.mjs';
import { validateConnectorRequest,validateMcpToolDescriptor } from '../src/connectors/contract-validation.mjs';
import { describeMcpTool } from '../src/connectors/mcp-exposure.mjs';

test('connector request accepts exact governed subjects',()=>{const f=connectorFixture();assert.equal(validateConnectorRequest(f.request),true)});
test('connector request rejects arbitrary endpoint field injection',()=>{const f=connectorFixture();f.request.endpoint_url='http://evil';assert.throws(()=>validateConnectorRequest(f.request),e=>e.code==='UNEXPECTED_FIELD')});
test('MCP descriptor is discovery-only with no execution authority',()=>{const f=connectorFixture();const d=describeMcpTool({capability:f.capability,inputSchemaDigest:'1'.repeat(64),outputSchemaDigest:'2'.repeat(64)});assert.equal(validateMcpToolDescriptor(d),true);assert.equal(d.execution_admission,'NONE');assert.equal('endpoint_ref' in d,false)});
test('request digest binds deadline and input',()=>{const f=connectorFixture();f.request.deadline_at='2026-08-17T10:20:00Z';assert.throws(()=>validateConnectorRequest(f.request),e=>e.code==='CONNECTOR_REQUEST_DIGEST_MISMATCH')});
