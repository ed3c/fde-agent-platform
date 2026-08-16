import { canonicalJson, sha256 } from '../../scripts/lib/contract-validation.mjs';
import { EvidenceContractError, evidenceClaimDigest, validateEvidenceClaim, validateProcessTwin } from './contract-validation.mjs';

const fail=(c,p,m)=>{throw new EvidenceContractError(c,p,m)};
const VIEWS=['DOCUMENTED','OBSERVED','SYSTEM_ENFORCED','APPROVED_TARGET'];
const ORDERING_RELATIONS=new Set(['PRECEDES','DEPENDS_ON','ROUTES_TO','WAITS_FOR']);
const sortBy=(items,key)=>[...items].sort((a,b)=>String(a[key]).localeCompare(String(b[key])));
const overlaps=(a,b)=>{
  const aStart=Date.parse(a.valid_from), bStart=Date.parse(b.valid_from);
  const aEnd=a.valid_to===null?Infinity:Date.parse(a.valid_to);
  const bEnd=b.valid_to===null?Infinity:Date.parse(b.valid_to);
  return aStart<=bEnd&&bStart<=aEnd;
};

export function detectContradictions(claims){
  claims.forEach(validateEvidenceClaim);
  const active=claims.filter(c=>!['REJECTED','STALE','SUPERSEDED'].includes(c.status));
  const groups=new Map();
  for(const claim of active){
    const key=`${claim.subject.type}:${claim.subject.id}|${claim.predicate}`;
    const list=groups.get(key)??[];list.push(claim);groups.set(key,list);
  }
  const contradictions=[];
  for(const [key,list] of [...groups.entries()].sort(([a],[b])=>a.localeCompare(b))){
    const sorted=sortBy(list,'claim_id');
    for(let i=0;i<sorted.length;i++)for(let j=i+1;j<sorted.length;j++){
      const left=sorted[i],right=sorted[j];
      if(canonicalJson(left.object.value)===canonicalJson(right.object.value))continue;
      if(!overlaps(left.temporal,right.temporal))continue;
      const claimIds=[left.claim_id,right.claim_id].sort();
      contradictions.push({
        contradiction_id:`contradiction-${sha256(`${key}|${claimIds.join('|')}`).slice(0,20)}`,
        claim_ids:claimIds,
        subject_id:left.subject.id,
        predicate:left.predicate
      });
    }
  }
  return contradictions.sort((a,b)=>a.contradiction_id.localeCompare(b.contradiction_id));
}

function validateInputGraph(nodes,edges,controlledCycles,claimsById){
  if(!Array.isArray(nodes)||!nodes.length)fail('MISSING_NODES','$.nodes','at least one node required');
  if(!Array.isArray(edges)||!Array.isArray(controlledCycles))fail('INVALID_GRAPH_INPUT','$','edges and controlledCycles must be arrays');
  const nodeIds=new Set(),edgeIds=new Set(),cycleIds=new Set(controlledCycles.map(c=>c.cycle_id));
  for(const [i,node] of nodes.entries()){
    if(nodeIds.has(node.node_id))fail('DUPLICATE_NODE_ID',`$.nodes[${i}].node_id`,node.node_id);nodeIds.add(node.node_id);
    if(!Array.isArray(node.source_claim_ids)||!node.source_claim_ids.length)fail('MISSING_SOURCE_CLAIM',`$.nodes[${i}].source_claim_ids`,'required');
    for(const claimId of node.source_claim_ids){
      const claim=claimsById.get(claimId);if(!claim)fail('UNKNOWN_CLAIM_REFERENCE',`$.nodes[${i}].source_claim_ids`,claimId);
      if(claim.view!==node.view)fail('VIEW_COLLAPSE',`$.nodes[${i}].view`,`${node.view} cannot consume ${claim.view}`);
      if(claim.readiness_ref.state==='BLOCKED')fail('BLOCKED_READINESS_INPUT',`$.nodes[${i}].source_claim_ids`,claimId);
    }
  }
  for(const [i,edge] of edges.entries()){
    if(edgeIds.has(edge.edge_id))fail('DUPLICATE_EDGE_ID',`$.edges[${i}].edge_id`,edge.edge_id);edgeIds.add(edge.edge_id);
    if(!nodeIds.has(edge.from)||!nodeIds.has(edge.to))fail('UNKNOWN_NODE_REFERENCE',`$.edges[${i}]`,'edge references unknown node');
    if(edge.controlled_cycle_id!==null&&!cycleIds.has(edge.controlled_cycle_id))fail('UNKNOWN_CYCLE_REFERENCE',`$.edges[${i}].controlled_cycle_id`,edge.controlled_cycle_id);
  }
  for(const [i,cycle] of controlledCycles.entries()){
    if(!cycle.cycle_id||!Array.isArray(cycle.edge_ids)||cycle.edge_ids.length<2||!Number.isInteger(cycle.max_iterations)||cycle.max_iterations<1||!Number.isInteger(cycle.timeout_seconds)||cycle.timeout_seconds<1||!cycle.exit_condition)fail('INVALID_CONTROLLED_CYCLE',`$.controlled_cycles[${i}]`,'bounded cycle contract incomplete');
    for(const edgeId of cycle.edge_ids){const edge=edges.find(e=>e.edge_id===edgeId);if(!edge)fail('UNKNOWN_EDGE_REFERENCE',`$.controlled_cycles[${i}].edge_ids`,edgeId);if(edge.controlled_cycle_id!==cycle.cycle_id)fail('CYCLE_EDGE_BINDING_MISMATCH',`$.controlled_cycles[${i}].edge_ids`,edgeId)}
  }
  return nodeIds;
}

function topologicalOrder(nodes,edges){
  const orderingEdges=edges.filter(e=>ORDERING_RELATIONS.has(e.relation)&&e.controlled_cycle_id===null);
  const indegree=new Map(nodes.map(n=>[n.node_id,0]));
  const outgoing=new Map(nodes.map(n=>[n.node_id,[]]));
  for(const edge of orderingEdges){indegree.set(edge.to,indegree.get(edge.to)+1);outgoing.get(edge.from).push(edge.to)}
  for(const list of outgoing.values())list.sort();
  const ready=[...indegree.entries()].filter(([,d])=>d===0).map(([id])=>id).sort();
  const order=[];
  while(ready.length){const id=ready.shift();order.push(id);for(const next of outgoing.get(id)){indegree.set(next,indegree.get(next)-1);if(indegree.get(next)===0){ready.push(next);ready.sort()}}}
  if(order.length!==nodes.length)fail('UNCONTROLLED_CYCLE','$.edges','ordering graph contains undeclared cycle');
  return order;
}

export function buildProcessTwin({tenant_ref,process_id,version,generated_at,claims,nodes,edges,controlled_cycles}){
  if(!Array.isArray(claims)||!claims.length)fail('MISSING_CLAIMS','$.claims','at least one claim required');
  claims.forEach(validateEvidenceClaim);
  const sortedClaims=sortBy(claims,'claim_id');
  const claimsById=new Map();
  for(const claim of sortedClaims){if(claimsById.has(claim.claim_id))fail('DUPLICATE_CLAIM_ID','$.claims',claim.claim_id);if(claim.tenant_ref!==tenant_ref)fail('TENANT_MISMATCH','$.claims',claim.claim_id);if(claim.readiness_ref.state==='BLOCKED')fail('BLOCKED_READINESS_INPUT','$.claims',claim.claim_id);claimsById.set(claim.claim_id,claim)}
  const sortedNodes=sortBy(nodes,'node_id').map(n=>({...n,source_claim_ids:[...n.source_claim_ids].sort(),preconditions:[...n.preconditions].sort(),postconditions:[...n.postconditions].sort()}));
  const sortedEdges=sortBy(edges,'edge_id');
  const sortedCycles=sortBy(controlled_cycles,'cycle_id').map(c=>({...c,edge_ids:[...c.edge_ids].sort()}));
  validateInputGraph(sortedNodes,sortedEdges,sortedCycles,claimsById);
  const contradictions=detectContradictions(sortedClaims);
  const viewDigests=Object.fromEntries(VIEWS.map(view=>[view,sha256(sortedClaims.filter(c=>c.view===view).map(evidenceClaimDigest).sort())]));
  const withoutDigest={
    schema:'fde-agent/process-twin/v1',
    process_twin_id:`process-twin-${process_id}`,
    version,tenant_ref,process_id,generated_at,
    input_claim_digests:sortedClaims.map(evidenceClaimDigest).sort(),
    nodes:sortedNodes,edges:sortedEdges,controlled_cycles:sortedCycles,
    unresolved_contradictions:contradictions,
    view_digests:viewDigests,
    topological_order:topologicalOrder(sortedNodes,sortedEdges),
    execution_authority:'NONE'
  };
  const twin={...withoutDigest,twin_digest:sha256(withoutDigest)};
  // Preserve the public contract key order only through canonical serialization; validation is semantic.
  const ordered={...withoutDigest,twin_digest:twin.twin_digest,execution_authority:withoutDigest.execution_authority};
  // Reorder because spread above duplicates execution_authority but leaves one value; reconstruct exact schema order.
  const result={schema:ordered.schema,process_twin_id:ordered.process_twin_id,version:ordered.version,tenant_ref:ordered.tenant_ref,process_id:ordered.process_id,generated_at:ordered.generated_at,input_claim_digests:ordered.input_claim_digests,nodes:ordered.nodes,edges:ordered.edges,controlled_cycles:ordered.controlled_cycles,unresolved_contradictions:ordered.unresolved_contradictions,view_digests:ordered.view_digests,topological_order:ordered.topological_order,twin_digest:ordered.twin_digest,execution_authority:ordered.execution_authority};
  // Digest binds the subject without twin_digest, independent of property insertion order.
  const {twin_digest:ignored,...subject}=result;result.twin_digest=sha256(subject);
  validateProcessTwin(result);
  return result;
}
