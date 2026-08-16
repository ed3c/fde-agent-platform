#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { buildProcessTwin } from '../src/evidence/build-process-twin.mjs';
const load=async p=>JSON.parse(await readFile(new URL(`../${p}`,import.meta.url),'utf8'));
const claims=await load('fixtures/evidence/claims.ap-exception.json');
const spec=await load('fixtures/evidence/process-input.ap-exception.json');
const killed=[];
const viewCollapse=structuredClone(spec);viewCollapse.nodes[1]=await load('fixtures/evidence/invalid/claim.view-collapse.json');
try{buildProcessTwin({...viewCollapse,claims});}catch(error){if(error.code==='VIEW_COLLAPSE')killed.push('VIEW_COLLAPSE');else throw error;}
const cycle=structuredClone(spec);cycle.edges.push(await load('fixtures/evidence/invalid/graph.uncontrolled-cycle.json'));
try{buildProcessTwin({...cycle,claims});}catch(error){if(error.code==='UNCONTROLLED_CYCLE')killed.push('UNCONTROLLED_CYCLE');else throw error;}
if(killed.length!==2)throw new Error(`mutation sensitivity incomplete: ${killed.join(',')}`);
const twin=buildProcessTwin({...spec,claims});
console.log(JSON.stringify({state:'PASS',mutations_killed:killed,twin_digest:twin.twin_digest,contradictions:twin.unresolved_contradictions.length,execution_authority:twin.execution_authority},null,2));
