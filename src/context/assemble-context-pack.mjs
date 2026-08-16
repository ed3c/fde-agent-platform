import { canonicalize, sha256, ContractValidationError } from '../../scripts/lib/contract-validation.mjs';
import {
  assertContextPackIntegrity,
  contextQueryDigest,
  validateContextPack,
  validateContextQuery
} from './contract-validation.mjs';

const CLASS = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'];
const dependencyRelations = new Set(['PRECEDES', 'DEPENDS_ON', 'WAITS_FOR']);
const fail = (code, path, message) => {
  throw new ContractValidationError(code, path, message);
};

const createPack = ({
  query,
  state,
  selectedNodes = [],
  selectedClaims = [],
  contradictions = [],
  omitted = [],
  usedTokens = 0,
  reasons = []
}) => {
  const pack = {
    schema: 'fde-agent/context-pack/v1',
    context_pack_id: `context-${query.query_id}`,
    tenant_ref: query.tenant_ref,
    task_subject: query.task_subject,
    process_twin_digest: query.process_twin_digest,
    query_digest: contextQueryDigest(query),
    state,
    selected_nodes: selectedNodes,
    selected_claims: selectedClaims,
    unresolved_contradictions: contradictions,
    omitted_optional_nodes: [...omitted].sort(),
    mandatory_policy_subjects: [...query.mandatory_policy_subjects].sort(),
    budget: {
      max_nodes: query.max_nodes,
      used_nodes: selectedNodes.length,
      max_tokens: query.max_tokens,
      used_tokens: usedTokens
    },
    authority_envelope: {
      purpose: 'CONTEXT_ONLY',
      tenant_ref: query.tenant_ref,
      maximum_data_classification: query.max_data_classification
    },
    refusal_reasons: [...reasons].sort(),
    context_digest: '0'.repeat(64),
    execution_authority: 'NONE'
  };
  pack.context_digest = sha256(pack);
  validateContextPack(pack);
  assertContextPackIntegrity(pack);
  return pack;
};

export function assembleContextPack({ query, processTwin, claimIndex }) {
  validateContextQuery(query);
  if (processTwin?.schema !== 'fde-agent/process-twin/v1') {
    fail('PROCESS_TWIN_SCHEMA_MISMATCH', '$.processTwin.schema', 'expected process twin');
  }
  if (processTwin.execution_authority !== 'NONE') {
    fail(
      'UPSTREAM_AUTHORITY_WIDENING',
      '$.processTwin.execution_authority',
      'evidence cannot authorize execution'
    );
  }
  if (processTwin.tenant_ref !== query.tenant_ref) {
    fail('TENANT_MISMATCH', '$.tenant_ref', 'query and twin differ');
  }
  if (processTwin.twin_digest !== query.process_twin_digest) {
    fail('PROCESS_TWIN_SUBJECT_MISMATCH', '$.process_twin_digest', 'query binds another twin');
  }
  if (!Array.isArray(claimIndex)) fail('INVALID_TYPE', '$.claimIndex', 'expected array');

  const nodes = new Map(processTwin.nodes.map((node) => [node.node_id, node]));
  const claims = new Map(claimIndex.map((claim) => [claim.claim_id, claim]));
  const incoming = new Map();
  for (const edge of processTwin.edges) {
    if (!dependencyRelations.has(edge.relation)) continue;
    if (!incoming.has(edge.to)) incoming.set(edge.to, []);
    incoming.get(edge.to).push(edge.from);
  }

  const selected = new Set();
  const queue = [...query.required_node_ids].sort();
  let steps = 0;
  while (queue.length) {
    if (++steps > query.max_nodes * 4) {
      return createPack({ query, state: 'REFUSED', reasons: ['TRAVERSAL_BUDGET_EXCEEDED'] });
    }
    const nodeId = queue.shift();
    if (selected.has(nodeId)) continue;
    if (!nodes.has(nodeId)) {
      return createPack({ query, state: 'REFUSED', reasons: ['MISSING_REQUIRED_NODE'] });
    }
    selected.add(nodeId);
    for (const parent of [...(incoming.get(nodeId) ?? [])].sort()) {
      if (!selected.has(parent)) queue.push(parent);
    }
  }
  if (selected.size > query.max_nodes) {
    return createPack({ query, state: 'REFUSED', reasons: ['NODE_BUDGET_EXCEEDED'] });
  }

  const order = processTwin.topological_order.filter((nodeId) => selected.has(nodeId));
  const selectedNodes = [];
  const selectedClaims = [];
  const seenClaims = new Set();
  let usedTokens = 0;
  let degraded = false;

  for (const nodeId of order) {
    const node = nodes.get(nodeId);
    if (!query.requested_views.includes(node.view)) {
      return createPack({ query, state: 'REFUSED', reasons: ['REQUIRED_VIEW_NOT_ALLOWED'] });
    }
    let nodeTokens = 12;
    for (const claimId of [...node.source_claim_ids].sort()) {
      const claim = claims.get(claimId);
      if (!claim) {
        return createPack({ query, state: 'REFUSED', reasons: ['MISSING_CLAIM_EVIDENCE'] });
      }
      if (claim.tenant_ref !== query.tenant_ref) {
        fail('TENANT_MISMATCH', '$.claimIndex', `claim ${claimId} belongs to another tenant`);
      }
      if (!['READY', 'DEGRADED'].includes(claim.readiness_state)) {
        return createPack({ query, state: 'REFUSED', reasons: ['CLAIM_NOT_READY'] });
      }
      const asOf = Date.parse(query.as_of);
      const validFrom = Date.parse(claim.valid_from);
      const validTo = claim.valid_to === null
        ? Number.POSITIVE_INFINITY
        : Date.parse(claim.valid_to);
      if (asOf < validFrom || asOf > validTo) {
        return createPack({ query, state: 'REFUSED', reasons: ['STALE_REQUIRED_CLAIM'] });
      }
      if (CLASS.indexOf(claim.data_classification) > CLASS.indexOf(query.max_data_classification)) {
        return createPack({ query, state: 'REFUSED', reasons: ['DATA_CLASSIFICATION_EXCEEDED'] });
      }
      nodeTokens += claim.estimated_tokens;
      if (claim.readiness_state === 'DEGRADED') degraded = true;
      if (!seenClaims.has(claimId)) {
        seenClaims.add(claimId);
        selectedClaims.push({
          claim_id: claim.claim_id,
          claim_digest: claim.claim_digest,
          source_id: claim.source_id,
          recorded_at: claim.recorded_at,
          valid_from: claim.valid_from,
          valid_to: claim.valid_to,
          data_classification: claim.data_classification,
          readiness_state: claim.readiness_state
        });
      }
    }
    usedTokens += nodeTokens;
    selectedNodes.push({
      node_id: node.node_id,
      view: node.view,
      owner_role: node.owner_role,
      source_claim_ids: [...node.source_claim_ids].sort(),
      estimated_tokens: nodeTokens,
      reason: query.required_node_ids.includes(node.node_id) ? 'REQUIRED' : 'DEPENDENCY'
    });
  }

  if (usedTokens > query.max_tokens) {
    return createPack({ query, state: 'REFUSED', reasons: ['CONTEXT_BUDGET_EXCEEDED'] });
  }

  const contradictions = (processTwin.unresolved_contradictions ?? [])
    .filter((item) => item.claim_ids.some((claimId) => seenClaims.has(claimId)))
    .map((item) => canonicalize(item));
  if (contradictions.length && query.contradiction_policy === 'REFUSE') {
    return createPack({ query, state: 'REFUSED', reasons: ['UNRESOLVED_CONTRADICTION'] });
  }
  if (contradictions.length) degraded = true;

  return createPack({
    query,
    state: degraded ? 'DEGRADED' : 'READY',
    selectedNodes,
    selectedClaims: selectedClaims.sort((left, right) => left.claim_id.localeCompare(right.claim_id)),
    contradictions: contradictions.sort((left, right) => left.contradiction_id.localeCompare(right.contradiction_id)),
    omitted: [...query.optional_node_ids],
    usedTokens
  });
}
