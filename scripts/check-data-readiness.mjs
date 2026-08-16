#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { evaluateDataReadiness } from '../src/data/evaluate-readiness.mjs';
import { assertSemanticEvidenceFresh } from '../src/data/contract-validation.mjs';
const load=async p=>JSON.parse(await readFile(new URL(`../${p}`,import.meta.url),'utf8'));
const metric=await load('fixtures/data/metric.case-cycle-time.json');
const profile=await load('fixtures/data/invalid/profile.critical-hidden.json');
const drifted=await load('fixtures/data/invalid/metric.unit-drift.json');
const decision=evaluateDataReadiness({metric,profile,requiredCriticalFields:['invoice_id','purchase_order_id','resolved_at'],maxAgeSeconds:300,accessDisposition:'AUTHORIZED',semanticState:'CONSISTENT',evaluatorVersion:'1.0.0',evaluatedAt:'2026-08-16T16:01:00Z'});
if(decision.state!=='BLOCKED'||!decision.blocking_reasons.includes('MISSING_CRITICAL_FIELD:purchase_order_id')) throw new Error('critical-field mutation survived');
let driftKilled=false; try{assertSemanticEvidenceFresh(metric,drifted,['baseline:v1','evalpack:v1']);}catch(error){driftKilled=error.code==='SEMANTIC_DRIFT_INVALIDATES_EVIDENCE';}
if(!driftKilled) throw new Error('semantic-drift mutation survived');
console.log(JSON.stringify({state:'PASS',mutations_killed:['MISSING_CRITICAL_FIELD','SEMANTIC_DRIFT_INVALIDATES_EVIDENCE'],decision_digest:decision.input_digest},null,2));
