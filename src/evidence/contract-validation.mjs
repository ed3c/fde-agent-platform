import { assertNoForbiddenSecrets, sha256 } from '../../scripts/lib/contract-validation.mjs';

export class EvidenceContractError extends Error {
  constructor(code, path, message) {
    super(`${path}: ${message}`);
    Object.assign(this, { name: 'EvidenceContractError', code, path });
  }
}

const fail=(c,p,m)=>{throw new EvidenceContractError(c,p,m)};
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const obj=(v,p)=>{if(!plain(v))fail('INVALID_TYPE',p,'expected object')};
const str=(v,p)=>{if(typeof v!=='string'||!v)fail('INVALID_TYPE',p,'expected non-empty string')};
const arr=(v,p,min=0)=>{if(!Array.isArray(v)||v.length<min)fail('INVALID_TYPE',p,`expected array with >= ${min} items`)};
const exact=(v,keys,required,p)=>{obj(v,p);for(const k of Object.keys(v))if(!keys.includes(k))fail('UNEXPECTED_FIELD',`${p}.${k}`,'not part of contract');for(const k of required)if(!(k in v))fail('MISSING_FIELD',`${p}.${k}`,'required')};
const digest=(v,p)=>{str(v,p);if(!/^[a-f0-9]{64}$/.test(v))fail('INVALID_DIGEST',p,'expected sha256')};
const semver=(v,p)=>{str(v,p);if(!/^\d+\.\d+\.\d+$/.test(v))fail('INVALID_VERSION',p,'expected semver')};
const iso=(v,p)=>{str(v,p);if(Number.isNaN(Date.parse(v)))fail('INVALID_TIMESTAMP',p,'expected ISO timestamp')};
const unique=(items,key,p)=>{const seen=new Set();for(let i=0;i<items.length;i++){const value=typeof key==='function'?key(items[i]):items[i][key];if(seen.has(value))fail('DUPLICATE_IDENTITY',`${p}[${i}]`,`duplicate ${value}`);seen.add(value)}};
const uniqueStrings=(items,p,min=0)=>{arr(items,p,min);items.forEach((v,i)=>str(v,`${p}[${i}]`));unique(items,x=>x,p)};
const VIEWS=['DOCUMENTED','OBSERVED','SYSTEM_ENFORCED','APPROVED_TARGET'];
const CLAIM_STATES=['CANDIDATE','ADMITTED','CONTRADICTED','STALE','SUPERSEDED','REJECTED'];
const NODE_KINDS=['TASK','DECISION','HUMAN_WAIT','SYSTEM_STATE','TERMINAL'];
const EDGE_RELATIONS=['PRECEDES','DEPENDS_ON','ROUTES_TO','COMPENSATES','WAITS_FOR','OBSERVES'];
const CLAIM_KEYS=['schema','claim_id','tenant_ref','subject','predicate','object','source_ref','temporal','readiness_ref','view','approval','confidence','status','supersedes_claim_id','contradictions'];
const TWIN_KEYS=['schema','process_twin_id','version','tenant_ref','process_id','generated_at','input_claim_digests','nodes','edges','controlled_cycles','unresolved_contradictions','view_digests','topological_order','twin_digest','execution_authority'];

export function validateEvidenceClaim(claim){
  assertNoForbiddenSecrets(claim); exact(claim,CLAIM_KEYS,CLAIM_KEYS,'$');
  if(claim.schema!=='fde-agent/evidence-claim/v1')fail('SCHEMA_MISMATCH','$.schema','unexpected schema');
  str(claim.claim_id,'$.claim_id');str(claim.tenant_ref,'$.tenant_ref');
  exact(claim.subject,['type','id'],['type','id'],'$.subject');str(claim.subject.type,'$.subject.type');str(claim.subject.id,'$.subject.id');
  str(claim.predicate,'$.predicate');
  exact(claim.object,['type','value'],['type','value'],'$.object');str(claim.object.type,'$.object.type');
  exact(claim.source_ref,['source_id','source_digest','claim_candidate_id','source_span_digest'],['source_id','source_digest','claim_candidate_id','source_span_digest'],'$.source_ref');
  str(claim.source_ref.source_id,'$.source_ref.source_id');str(claim.source_ref.claim_candidate_id,'$.source_ref.claim_candidate_id');digest(claim.source_ref.source_digest,'$.source_ref.source_digest');digest(claim.source_ref.source_span_digest,'$.source_ref.source_span_digest');
  exact(claim.temporal,['valid_from','valid_to','observed_at','recorded_at'],['valid_from','valid_to','observed_at','recorded_at'],'$.temporal');
  iso(claim.temporal.valid_from,'$.temporal.valid_from');if(claim.temporal.valid_to!==null)iso(claim.temporal.valid_to,'$.temporal.valid_to');iso(claim.temporal.observed_at,'$.temporal.observed_at');iso(claim.temporal.recorded_at,'$.temporal.recorded_at');
  if(Date.parse(claim.temporal.recorded_at)<Date.parse(claim.temporal.observed_at))fail('RECORDED_BEFORE_OBSERVED','$.temporal.recorded_at','cannot precede observed_at');
  if(claim.temporal.valid_to!==null&&Date.parse(claim.temporal.valid_to)<Date.parse(claim.temporal.valid_from))fail('INVALID_VALID_TIME','$.temporal.valid_to','cannot precede valid_from');
  exact(claim.readiness_ref,['readiness_id','digest','state'],['readiness_id','digest','state'],'$.readiness_ref');str(claim.readiness_ref.readiness_id,'$.readiness_ref.readiness_id');digest(claim.readiness_ref.digest,'$.readiness_ref.digest');if(!['READY','DEGRADED','BLOCKED'].includes(claim.readiness_ref.state))fail('INVALID_READINESS_STATE','$.readiness_ref.state','unsupported');
  if(!VIEWS.includes(claim.view))fail('INVALID_VIEW','$.view','unsupported');
  exact(claim.approval,['status','owner_role','approved_at'],['status','owner_role','approved_at'],'$.approval');if(!['UNCHECKED','CONFIRMED','REJECTED'].includes(claim.approval.status))fail('INVALID_APPROVAL_STATUS','$.approval.status','unsupported');
  if(claim.approval.owner_role!==null)str(claim.approval.owner_role,'$.approval.owner_role');if(claim.approval.approved_at!==null)iso(claim.approval.approved_at,'$.approval.approved_at');
  if(claim.approval.status==='CONFIRMED'&&(claim.approval.owner_role===null||claim.approval.approved_at===null))fail('INCOMPLETE_APPROVAL','$.approval','confirmed approval needs owner and time');
  if(claim.view==='APPROVED_TARGET'&&claim.approval.status!=='CONFIRMED')fail('TARGET_NOT_APPROVED','$.approval.status','approved target must be confirmed');
  if(typeof claim.confidence!=='number'||!Number.isFinite(claim.confidence)||claim.confidence<0||claim.confidence>1)fail('INVALID_CONFIDENCE','$.confidence','expected [0,1]');
  if(!CLAIM_STATES.includes(claim.status))fail('INVALID_CLAIM_STATUS','$.status','unsupported');
  if(claim.supersedes_claim_id!==null)str(claim.supersedes_claim_id,'$.supersedes_claim_id');
  uniqueStrings(claim.contradictions,'$.contradictions');
  if(claim.status==='ADMITTED'&&claim.readiness_ref.state==='BLOCKED')fail('BLOCKED_READINESS_ADMISSION','$.readiness_ref.state','blocked evidence cannot be admitted');
  if(claim.status==='CONTRADICTED'&&!claim.contradictions.length)fail('CONTRADICTION_LINK_REQUIRED','$.contradictions','contradicted claim needs links');
  if(claim.status==='SUPERSEDED'&&claim.supersedes_claim_id===null)fail('SUPERSESSION_LINK_REQUIRED','$.supersedes_claim_id','superseded claim needs predecessor');
  return true;
}

export function validateProcessTwin(twin){
  assertNoForbiddenSecrets(twin);exact(twin,TWIN_KEYS,TWIN_KEYS,'$');
  if(twin.schema!=='fde-agent/process-twin/v1')fail('SCHEMA_MISMATCH','$.schema','unexpected schema');
  str(twin.process_twin_id,'$.process_twin_id');semver(twin.version,'$.version');str(twin.tenant_ref,'$.tenant_ref');str(twin.process_id,'$.process_id');iso(twin.generated_at,'$.generated_at');
  twin.input_claim_digests.forEach((d,i)=>digest(d,`$.input_claim_digests[${i}]`));uniqueStrings(twin.input_claim_digests,'$.input_claim_digests',1);
  arr(twin.nodes,'$.nodes',1);twin.nodes.forEach((node,i)=>{const p=`$.nodes[${i}]`;exact(node,['node_id','kind','owner_role','view','source_claim_ids','preconditions','postconditions','state'],['node_id','kind','owner_role','view','source_claim_ids','preconditions','postconditions','state'],p);str(node.node_id,`${p}.node_id`);if(!NODE_KINDS.includes(node.kind))fail('INVALID_NODE_KIND',`${p}.kind`,'unsupported');str(node.owner_role,`${p}.owner_role`);if(!VIEWS.includes(node.view))fail('INVALID_VIEW',`${p}.view`,'unsupported');uniqueStrings(node.source_claim_ids,`${p}.source_claim_ids`,1);uniqueStrings(node.preconditions,`${p}.preconditions`);uniqueStrings(node.postconditions,`${p}.postconditions`);if(!['ACTIVE','DEPRECATED','PROPOSED'].includes(node.state))fail('INVALID_NODE_STATE',`${p}.state`,'unsupported')});unique(twin.nodes,'node_id','$.nodes');
  arr(twin.edges,'$.edges');twin.edges.forEach((edge,i)=>{const p=`$.edges[${i}]`;exact(edge,['edge_id','from','to','relation','condition','controlled_cycle_id'],['edge_id','from','to','relation','condition','controlled_cycle_id'],p);str(edge.edge_id,`${p}.edge_id`);str(edge.from,`${p}.from`);str(edge.to,`${p}.to`);if(!EDGE_RELATIONS.includes(edge.relation))fail('INVALID_EDGE_RELATION',`${p}.relation`,'unsupported');if(edge.condition!==null)str(edge.condition,`${p}.condition`);if(edge.controlled_cycle_id!==null)str(edge.controlled_cycle_id,`${p}.controlled_cycle_id`)});unique(twin.edges,'edge_id','$.edges');
  const nodeIds=new Set(twin.nodes.map(x=>x.node_id));for(const [i,edge] of twin.edges.entries()){if(!nodeIds.has(edge.from)||!nodeIds.has(edge.to))fail('UNKNOWN_NODE_REFERENCE',`$.edges[${i}]`,'edge references unknown node')}
  arr(twin.controlled_cycles,'$.controlled_cycles');twin.controlled_cycles.forEach((cycle,i)=>{const p=`$.controlled_cycles[${i}]`;exact(cycle,['cycle_id','edge_ids','max_iterations','timeout_seconds','exit_condition'],['cycle_id','edge_ids','max_iterations','timeout_seconds','exit_condition'],p);str(cycle.cycle_id,`${p}.cycle_id`);uniqueStrings(cycle.edge_ids,`${p}.edge_ids`,2);if(!Number.isInteger(cycle.max_iterations)||cycle.max_iterations<1)fail('INVALID_BOUND',`${p}.max_iterations`,'positive integer required');if(!Number.isInteger(cycle.timeout_seconds)||cycle.timeout_seconds<1)fail('INVALID_BOUND',`${p}.timeout_seconds`,'positive integer required');str(cycle.exit_condition,`${p}.exit_condition`)});unique(twin.controlled_cycles,'cycle_id','$.controlled_cycles');
  const edgeMap=new Map(twin.edges.map(x=>[x.edge_id,x]));const cycleIds=new Set(twin.controlled_cycles.map(x=>x.cycle_id));for(const [i,cycle] of twin.controlled_cycles.entries())for(const edgeId of cycle.edge_ids){const edge=edgeMap.get(edgeId);if(!edge)fail('UNKNOWN_EDGE_REFERENCE',`$.controlled_cycles[${i}].edge_ids`,'cycle references unknown edge');if(edge.controlled_cycle_id!==cycle.cycle_id)fail('CYCLE_EDGE_BINDING_MISMATCH',`$.controlled_cycles[${i}].edge_ids`,'edge not bound to cycle')};for(const [i,edge] of twin.edges.entries())if(edge.controlled_cycle_id!==null&&!cycleIds.has(edge.controlled_cycle_id))fail('UNKNOWN_CYCLE_REFERENCE',`$.edges[${i}].controlled_cycle_id`,'unknown cycle');
  arr(twin.unresolved_contradictions,'$.unresolved_contradictions');twin.unresolved_contradictions.forEach((x,i)=>{const p=`$.unresolved_contradictions[${i}]`;exact(x,['contradiction_id','claim_ids','subject_id','predicate'],['contradiction_id','claim_ids','subject_id','predicate'],p);str(x.contradiction_id,`${p}.contradiction_id`);uniqueStrings(x.claim_ids,`${p}.claim_ids`,2);str(x.subject_id,`${p}.subject_id`);str(x.predicate,`${p}.predicate`)});unique(twin.unresolved_contradictions,'contradiction_id','$.unresolved_contradictions');
  exact(twin.view_digests,VIEWS,VIEWS,'$.view_digests');VIEWS.forEach(v=>digest(twin.view_digests[v],`$.view_digests.${v}`));
  uniqueStrings(twin.topological_order,'$.topological_order',1);if(twin.topological_order.length!==twin.nodes.length||twin.topological_order.some(x=>!nodeIds.has(x)))fail('INVALID_TOPOLOGICAL_ORDER','$.topological_order','must contain every node once');
  digest(twin.twin_digest,'$.twin_digest');
  const { twin_digest: declaredDigest, ...digestSubject } = twin;
  if (sha256(digestSubject) !== declaredDigest) fail('TWIN_DIGEST_MISMATCH','$.twin_digest','does not bind exact twin subject');
  if(twin.execution_authority!=='NONE')fail('EXECUTION_AUTHORITY_FORBIDDEN','$.execution_authority','Process Twin is evidence only');
  return true;
}

export const evidenceClaimDigest=claim=>{validateEvidenceClaim(claim);return sha256(claim)};
