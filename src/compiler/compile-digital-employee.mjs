import {
  canonicalize,
  sha256,
  validateComposition
} from '../../scripts/lib/contract-validation.mjs';

function sortById(values, key) {
  return [...values].sort((left, right) => left[key].localeCompare(right[key]));
}

export function normalizeRolePack(rolePack) {
  return canonicalize({
    ...rolePack,
    outcomes: sortById(rolePack.outcomes, 'outcome_id').map((outcome) => ({
      ...outcome,
      metric_ids: [...outcome.metric_ids].sort()
    })),
    systems: sortById(rolePack.systems, 'system_id').map((system) => ({
      ...system,
      required_capabilities: [...system.required_capabilities].sort()
    })),
    actions: sortById(rolePack.actions, 'action_id'),
    prohibited_actions: [...rolePack.prohibited_actions].sort(),
    model_profiles: sortById(rolePack.model_profiles, 'profile_id').map((profile) => ({
      ...profile,
      allowed_regions: [...profile.allowed_regions].sort()
    })),
    evals: sortById(rolePack.evals, 'eval_id'),
    required_escalation_roles: [...rolePack.required_escalation_roles].sort()
  });
}

export function normalizeTenantOverlay(overlay) {
  return canonicalize({
    ...overlay,
    systems: sortById(overlay.systems, 'system_id').map((system) => ({
      ...system,
      granted_capabilities: [...system.granted_capabilities].sort()
    })),
    enabled_actions: sortById(overlay.enabled_actions, 'action_id'),
    escalation_roles: [...overlay.escalation_roles].sort(),
    privacy: {
      ...overlay.privacy,
      allowed_regions: [...overlay.privacy.allowed_regions].sort()
    }
  });
}

export function compileDigitalEmployee(rolePack, overlay) {
  validateComposition(rolePack, overlay);

  const normalizedRolePack = normalizeRolePack(rolePack);
  const normalizedOverlay = normalizeTenantOverlay(overlay);
  const actionsById = new Map(normalizedRolePack.actions.map((action) => [action.action_id, action]));
  const modelProfile = normalizedRolePack.model_profiles.find(
    (profile) => profile.profile_id === normalizedOverlay.model_profile_id
  );

  const enabledActions = normalizedOverlay.enabled_actions.map((enabled) => {
    const declared = actionsById.get(enabled.action_id);
    const result = {
      action_id: declared.action_id,
      system_id: declared.system_id,
      capability: declared.capability,
      authority_level: declared.authority_level,
      approval: declared.approval,
      reversible: declared.reversible
    };
    if (declared.approval === 'ALWAYS') result.approval_role = enabled.approval_role;
    return result;
  });

  return canonicalize({
    schema: 'fde-agent/digital-employee-spec/v1',
    spec_id: `${normalizedOverlay.tenant_id}:${normalizedRolePack.role_pack_id}@${normalizedRolePack.version}`,
    state: 'COMPILED',
    role_pack_ref: {
      role_pack_id: normalizedRolePack.role_pack_id,
      version: normalizedRolePack.version
    },
    tenant_id: normalizedOverlay.tenant_id,
    source_digests: {
      role_pack_sha256: sha256(normalizedRolePack),
      tenant_overlay_sha256: sha256(normalizedOverlay)
    },
    outcome_contract_id: normalizedOverlay.outcome_contract_id,
    outcomes: normalizedRolePack.outcomes,
    systems: normalizedOverlay.systems,
    authority: {
      enabled_actions: enabledActions,
      prohibited_actions: normalizedRolePack.prohibited_actions
    },
    human_manager_role: normalizedOverlay.human_manager_role,
    escalation_roles: normalizedOverlay.escalation_roles,
    model_policy: {
      profile_id: modelProfile.profile_id,
      purpose: modelProfile.purpose,
      data_classification: normalizedOverlay.privacy.data_classification,
      zero_data_retention_required: normalizedOverlay.privacy.zero_data_retention_required,
      allowed_regions: normalizedOverlay.privacy.allowed_regions,
      max_cost_per_call: modelProfile.max_cost_per_call,
      max_latency_ms: modelProfile.max_latency_ms
    },
    evals: normalizedRolePack.evals,
    production_admission: 'HUMAN_ADMIT_REQUIRED'
  });
}
