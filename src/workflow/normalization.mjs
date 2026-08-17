import { canonicalize, sha256 } from '../../scripts/lib/contract-validation.mjs';

const normalizeTransition = (transition) => ({
  ...canonicalize(transition),
  preconditions: [...transition.preconditions].sort(),
  postconditions: [...transition.postconditions].sort(),
  allowed_tool_ids: [...transition.allowed_tool_ids].sort(),
  prohibited_tool_ids: [...transition.prohibited_tool_ids].sort(),
  policy_subjects: [...transition.policy_subjects].sort(),
  required_evidence_subjects: [...transition.required_evidence_subjects].sort(),
  model_responsibilities: [...transition.model_responsibilities].sort(),
  approval: {
    ...canonicalize(transition.approval),
    required_roles: [...transition.approval.required_roles].sort()
  }
});

export function normalizeWorkflowSpec(workflow) {
  return {
    ...canonicalize(workflow),
    source_subjects: {
      ...canonicalize(workflow.source_subjects),
      policy_subjects: [...workflow.source_subjects.policy_subjects].sort(),
      policy_request_digests: [...workflow.source_subjects.policy_request_digests].sort(),
      policy_decision_digests: [...workflow.source_subjects.policy_decision_digests].sort(),
      connector_capability_digests: [...workflow.source_subjects.connector_capability_digests].sort(),
      eval_pack_subjects: [...workflow.source_subjects.eval_pack_subjects].sort()
    },
    states: [...workflow.states].map(canonicalize).sort((a, b) => a.state_id.localeCompare(b.state_id)),
    transitions: [...workflow.transitions].map(normalizeTransition).sort((a, b) => a.transition_id.localeCompare(b.transition_id)),
    controlled_cycles: [...workflow.controlled_cycles].map((cycle) => ({
      ...canonicalize(cycle),
      transition_ids: [...cycle.transition_ids].sort()
    })).sort((a, b) => a.cycle_id.localeCompare(b.cycle_id)),
    rollback: {
      ...canonicalize(workflow.rollback),
      trigger_conditions: [...workflow.rollback.trigger_conditions].sort()
    },
    reconciliation: {
      ...canonicalize(workflow.reconciliation),
      observer_operation_ids: [...workflow.reconciliation.observer_operation_ids].sort()
    },
    release_gates: {
      ...canonicalize(workflow.release_gates),
      eval_pack_subjects: [...workflow.release_gates.eval_pack_subjects].sort(),
      required_policy_subjects: [...workflow.release_gates.required_policy_subjects].sort(),
      policy_decision_digests: [...workflow.release_gates.policy_decision_digests].sort()
    }
  };
}

export function workflowDigest(workflow) {
  const candidate = structuredClone(workflow);
  candidate.workflow_digest = '0'.repeat(64);
  return sha256(normalizeWorkflowSpec(candidate));
}

export function normalizeChangeSpec(change) {
  return {
    ...canonicalize(change),
    source_request: {
      ...canonicalize(change.source_request),
      requester_roles: [...change.source_request.requester_roles].sort()
    },
    requested_delta: [...change.requested_delta].map(canonicalize).sort((a, b) =>
      `${a.target_path}:${a.operation}`.localeCompare(`${b.target_path}:${b.operation}`)
    ),
    affected_node_ids: [...change.affected_node_ids].sort(),
    unresolved_questions: [...change.unresolved_questions].sort(),
    unresolved_contradiction_ids: [...change.unresolved_contradiction_ids].sort(),
    blast_radius: {
      ...canonicalize(change.blast_radius),
      action_classes: [...change.blast_radius.action_classes].sort()
    },
    policy_impact_subjects: [...change.policy_impact_subjects].sort(),
    required_tests: [...change.required_tests].sort(),
    required_approvals: [...change.required_approvals].sort(),
    shadow_plan: {
      ...canonicalize(change.shadow_plan),
      fixture_subjects: [...change.shadow_plan.fixture_subjects].sort()
    },
    rollback_plan: {
      ...canonicalize(change.rollback_plan),
      trigger_conditions: [...change.rollback_plan.trigger_conditions].sort()
    },
    exact_source_digests: [...change.exact_source_digests].sort()
  };
}

export function changeSpecDigest(change) {
  const candidate = structuredClone(change);
  candidate.candidate_digest = '0'.repeat(64);
  return sha256(normalizeChangeSpec(candidate));
}
