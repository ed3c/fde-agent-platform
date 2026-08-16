import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const ROLE_KEYS = ['schema','role_pack_id','version','title','description','human_manager_role','outcomes','systems','actions','prohibited_actions','model_profiles','evals','required_escalation_roles'];
const OVERLAY_KEYS = ['schema','tenant_id','role_pack_ref','systems','enabled_actions','human_manager_role','escalation_roles','model_profile_id','privacy','outcome_contract_id'];
const OUTCOME_KEYS = ['schema','outcome_contract_id','tenant_id','role_pack_id','baseline_period','measurement_window','metrics','attribution','kill_criteria'];
const CLASS = ['PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED'];
const SECRET_KEY = /(?:^|[_-])(?:api[_-]?key|access[_-]?key|secret|password|passwd|private[_-]?key|credential|bearer|authorization|cookie|session[_-]?token|refresh[_-]?token|client[_-]?secret)(?:$|[_-])/i;
const SECRET_VALUE = /(?:-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{20,}\b|\bsk-[A-Za-z0-9_-]{20,}\b)/;

export class ContractValidationError extends Error {
  constructor(code, path, message) {
    super(`${path}: ${message}`);
    Object.assign(this, { name: 'ContractValidationError', code, path });
  }
}

const fail = (code, path, message) => { throw new ContractValidationError(code, path, message); };
const plain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const object = (v, p) => { if (!plain(v)) fail('INVALID_TYPE', p, 'expected object'); };
const string = (v, p, pattern) => {
  if (typeof v !== 'string' || !v) fail('INVALID_TYPE', p, 'expected non-empty string');
  if (pattern && !pattern.test(v)) fail('INVALID_VALUE', p, `does not match ${pattern}`);
};
const boolean = (v, p) => { if (typeof v !== 'boolean') fail('INVALID_TYPE', p, 'expected boolean'); };
const number = (v, p, min, integer = false) => {
  if (typeof v !== 'number' || !Number.isFinite(v) || (integer && !Number.isInteger(v))) fail('INVALID_TYPE', p, 'expected finite number');
  if (min !== undefined && v < min) fail('INVALID_VALUE', p, `must be >= ${min}`);
};
const array = (v, p, min = 0) => {
  if (!Array.isArray(v)) fail('INVALID_TYPE', p, 'expected array');
  if (v.length < min) fail('INVALID_VALUE', p, `expected at least ${min} item(s)`);
};
const enumValue = (v, values, p) => { if (!values.includes(v)) fail('INVALID_VALUE', p, `expected one of ${values.join(', ')}`); };
const exact = (v, allowed, required, p) => {
  object(v, p);
  for (const key of Object.keys(v)) if (!allowed.includes(key)) fail('UNEXPECTED_FIELD', `${p}.${key}`, 'not part of public contract');
  for (const key of required) if (!(key in v)) fail('MISSING_FIELD', `${p}.${key}`, 'required field absent');
};
const uniqueStrings = (v, p, min = 0) => {
  array(v, p, min);
  const seen = new Set();
  v.forEach((item, i) => {
    string(item, `${p}[${i}]`);
    if (seen.has(item)) fail('DUPLICATE_IDENTITY', `${p}[${i}]`, `duplicate ${item}`);
    seen.add(item);
  });
};
const uniqueIds = (v, key, p) => {
  const seen = new Set();
  v.forEach((item, i) => {
    if (seen.has(item[key])) fail('DUPLICATE_IDENTITY', `${p}[${i}].${key}`, `duplicate ${item[key]}`);
    seen.add(item[key]);
  });
};

export function assertNoForbiddenSecrets(value, path = '$') {
  if (Array.isArray(value)) return value.forEach((item, i) => assertNoForbiddenSecrets(item, `${path}[${i}]`));
  if (!plain(value)) {
    if (typeof value === 'string' && SECRET_VALUE.test(value)) fail('FORBIDDEN_SECRET_VALUE', path, 'secret-like material forbidden');
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (SECRET_KEY.test(key)) fail('FORBIDDEN_SECRET_FIELD', `${path}.${key}`, 'secret-bearing field forbidden');
    assertNoForbiddenSecrets(child, `${path}.${key}`);
  }
}

export function validateRolePackShape(role) {
  assertNoForbiddenSecrets(role);
  exact(role, ROLE_KEYS, ROLE_KEYS, '$');
  if (role.schema !== 'fde-agent/role-pack/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected fde-agent/role-pack/v1');
  string(role.role_pack_id, '$.role_pack_id', /^[a-z][a-z0-9-]{2,63}$/);
  string(role.version, '$.version', /^\d+\.\d+\.\d+$/);
  ['title','description','human_manager_role'].forEach((key) => string(role[key], `$.${key}`));

  array(role.outcomes, '$.outcomes', 1);
  role.outcomes.forEach((x, i) => {
    const p = `$.outcomes[${i}]`;
    exact(x, ['outcome_id','description','metric_ids'], ['outcome_id','description','metric_ids'], p);
    string(x.outcome_id, `${p}.outcome_id`); string(x.description, `${p}.description`); uniqueStrings(x.metric_ids, `${p}.metric_ids`, 1);
  });
  uniqueIds(role.outcomes, 'outcome_id', '$.outcomes');

  array(role.systems, '$.systems', 1);
  role.systems.forEach((x, i) => {
    const p = `$.systems[${i}]`;
    exact(x, ['system_id','required_capabilities'], ['system_id','required_capabilities'], p);
    string(x.system_id, `${p}.system_id`); uniqueStrings(x.required_capabilities, `${p}.required_capabilities`, 1);
  });
  uniqueIds(role.systems, 'system_id', '$.systems');
  const systems = new Map(role.systems.map((x) => [x.system_id, x]));

  array(role.actions, '$.actions', 1);
  role.actions.forEach((x, i) => {
    const p = `$.actions[${i}]`;
    exact(x, ['action_id','system_id','capability','authority_level','approval','required_approver_role','reversible'], ['action_id','system_id','capability','authority_level','approval','reversible'], p);
    ['action_id','system_id','capability'].forEach((key) => string(x[key], `${p}.${key}`));
    enumValue(x.authority_level, ['A0','A1','A2','A3','A4','A5'], `${p}.authority_level`);
    enumValue(x.approval, ['NEVER','CONDITIONAL','ALWAYS'], `${p}.approval`); boolean(x.reversible, `${p}.reversible`);
    if (!systems.has(x.system_id)) fail('UNKNOWN_SYSTEM_REFERENCE', `${p}.system_id`, `unknown ${x.system_id}`);
    if (!systems.get(x.system_id).required_capabilities.includes(x.capability)) fail('UNKNOWN_CAPABILITY_REFERENCE', `${p}.capability`, 'capability not declared by system');
    if (x.approval === 'ALWAYS') string(x.required_approver_role, `${p}.required_approver_role`);
    else if ('required_approver_role' in x) fail('UNEXPECTED_APPROVER_ROLE', `${p}.required_approver_role`, 'only ALWAYS actions declare approver');
  });
  uniqueIds(role.actions, 'action_id', '$.actions');
  uniqueStrings(role.prohibited_actions, '$.prohibited_actions');

  array(role.model_profiles, '$.model_profiles', 1);
  role.model_profiles.forEach((x, i) => {
    const p = `$.model_profiles[${i}]`;
    const keys = ['profile_id','purpose','maximum_data_classification','zero_data_retention_required','allowed_regions','max_cost_per_call','max_latency_ms'];
    exact(x, keys, keys, p); string(x.profile_id, `${p}.profile_id`); string(x.purpose, `${p}.purpose`);
    enumValue(x.maximum_data_classification, CLASS, `${p}.maximum_data_classification`); boolean(x.zero_data_retention_required, `${p}.zero_data_retention_required`);
    uniqueStrings(x.allowed_regions, `${p}.allowed_regions`, 1); number(x.max_cost_per_call, `${p}.max_cost_per_call`, 0); number(x.max_latency_ms, `${p}.max_latency_ms`, 1, true);
  });
  uniqueIds(role.model_profiles, 'profile_id', '$.model_profiles');

  array(role.evals, '$.evals', 1);
  role.evals.forEach((x, i) => {
    const p = `$.evals[${i}]`;
    exact(x, ['eval_id','description','blocking'], ['eval_id','description','blocking'], p);
    string(x.eval_id, `${p}.eval_id`); string(x.description, `${p}.description`); boolean(x.blocking, `${p}.blocking`);
  });
  uniqueIds(role.evals, 'eval_id', '$.evals');
  uniqueStrings(role.required_escalation_roles, '$.required_escalation_roles', 1);
  return true;
}

export function validateTenantOverlayShape(overlay) {
  assertNoForbiddenSecrets(overlay);
  exact(overlay, OVERLAY_KEYS, OVERLAY_KEYS, '$');
  if (overlay.schema !== 'fde-agent/tenant-overlay/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected fde-agent/tenant-overlay/v1');
  string(overlay.tenant_id, '$.tenant_id', /^[a-z][a-z0-9-]{2,63}$/);
  exact(overlay.role_pack_ref, ['role_pack_id','version'], ['role_pack_id','version'], '$.role_pack_ref');
  string(overlay.role_pack_ref.role_pack_id, '$.role_pack_ref.role_pack_id'); string(overlay.role_pack_ref.version, '$.role_pack_ref.version');

  array(overlay.systems, '$.systems', 1);
  overlay.systems.forEach((x, i) => {
    const p = `$.systems[${i}]`;
    exact(x, ['system_id','connector_id','granted_capabilities'], ['system_id','connector_id','granted_capabilities'], p);
    string(x.system_id, `${p}.system_id`); string(x.connector_id, `${p}.connector_id`); uniqueStrings(x.granted_capabilities, `${p}.granted_capabilities`, 1);
  });
  uniqueIds(overlay.systems, 'system_id', '$.systems');

  array(overlay.enabled_actions, '$.enabled_actions');
  overlay.enabled_actions.forEach((x, i) => {
    const p = `$.enabled_actions[${i}]`;
    exact(x, ['action_id','approval_role'], ['action_id'], p); string(x.action_id, `${p}.action_id`);
    if ('approval_role' in x) string(x.approval_role, `${p}.approval_role`);
  });
  uniqueIds(overlay.enabled_actions, 'action_id', '$.enabled_actions');
  string(overlay.human_manager_role, '$.human_manager_role'); uniqueStrings(overlay.escalation_roles, '$.escalation_roles', 1); string(overlay.model_profile_id, '$.model_profile_id');
  exact(overlay.privacy, ['data_classification','zero_data_retention_required','allowed_regions'], ['data_classification','zero_data_retention_required','allowed_regions'], '$.privacy');
  enumValue(overlay.privacy.data_classification, CLASS, '$.privacy.data_classification'); boolean(overlay.privacy.zero_data_retention_required, '$.privacy.zero_data_retention_required'); uniqueStrings(overlay.privacy.allowed_regions, '$.privacy.allowed_regions', 1);
  string(overlay.outcome_contract_id, '$.outcome_contract_id');
  return true;
}

export function validateOutcomeContractShape(contract) {
  assertNoForbiddenSecrets(contract); exact(contract, OUTCOME_KEYS, OUTCOME_KEYS, '$');
  if (contract.schema !== 'fde-agent/outcome-contract/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected fde-agent/outcome-contract/v1');
  ['outcome_contract_id','tenant_id','role_pack_id','measurement_window'].forEach((key) => string(contract[key], `$.${key}`));
  exact(contract.baseline_period, ['start','end'], ['start','end'], '$.baseline_period'); string(contract.baseline_period.start, '$.baseline_period.start'); string(contract.baseline_period.end, '$.baseline_period.end');
  array(contract.metrics, '$.metrics', 1);
  contract.metrics.forEach((x, i) => {
    const p = `$.metrics[${i}]`; const keys = ['metric_id','unit','direction','baseline','target','source_of_truth'];
    exact(x, keys, keys, p); string(x.metric_id, `${p}.metric_id`); string(x.unit, `${p}.unit`); enumValue(x.direction, ['INCREASE','DECREASE','HOLD'], `${p}.direction`); number(x.baseline, `${p}.baseline`); number(x.target, `${p}.target`); string(x.source_of_truth, `${p}.source_of_truth`);
  });
  uniqueIds(contract.metrics, 'metric_id', '$.metrics');
  exact(contract.attribution, ['method','external_factor_policy','dispute_owner_role'], ['method','external_factor_policy','dispute_owner_role'], '$.attribution');
  enumValue(contract.attribution.method, ['A_B_TEST','MATCHED_CONTROL','TIME_SERIES','BEFORE_AFTER_WITH_ADJUSTMENT'], '$.attribution.method'); string(contract.attribution.external_factor_policy, '$.attribution.external_factor_policy'); string(contract.attribution.dispute_owner_role, '$.attribution.dispute_owner_role');
  uniqueStrings(contract.kill_criteria, '$.kill_criteria', 1);
  return true;
}

export function validateComposition(role, overlay) {
  assertNoForbiddenSecrets(role); assertNoForbiddenSecrets(overlay); validateRolePackShape(role); validateTenantOverlayShape(overlay);
  if (overlay.role_pack_ref.role_pack_id !== role.role_pack_id || overlay.role_pack_ref.version !== role.version) fail('ROLE_PACK_REFERENCE_MISMATCH', '$.role_pack_ref', 'does not target supplied Role Pack');

  const roleSystems = new Map(role.systems.map((x) => [x.system_id, x]));
  const bound = new Map();
  overlay.systems.forEach((x, i) => {
    const declared = roleSystems.get(x.system_id);
    if (!declared) fail('UNKNOWN_SYSTEM_BINDING', `$.systems[${i}].system_id`, 'not declared by Role Pack');
    for (const cap of x.granted_capabilities) if (!declared.required_capabilities.includes(cap)) fail('AUTHORITY_WIDENING', `$.systems[${i}].granted_capabilities`, `${cap} outside capability ceiling`);
    for (const cap of declared.required_capabilities) if (!x.granted_capabilities.includes(cap)) fail('MISSING_REQUIRED_CAPABILITY', `$.systems[${i}].granted_capabilities`, `${cap} required`);
    bound.set(x.system_id, x);
  });
  for (const x of role.systems) if (!bound.has(x.system_id)) fail('MISSING_SYSTEM_BINDING', '$.systems', `${x.system_id} unbound`);

  const prohibited = new Set(role.prohibited_actions); const actions = new Map(role.actions.map((x) => [x.action_id, x]));
  overlay.enabled_actions.forEach((x, i) => {
    const p = `$.enabled_actions[${i}]`;
    if (prohibited.has(x.action_id)) fail('PROHIBITED_ACTION_GRANTED', `${p}.action_id`, 'explicitly prohibited');
    const declared = actions.get(x.action_id);
    if (!declared) fail('AUTHORITY_WIDENING', `${p}.action_id`, 'outside action ceiling');
    if (!bound.get(declared.system_id)?.granted_capabilities.includes(declared.capability)) fail('ACTION_CAPABILITY_NOT_GRANTED', `${p}.action_id`, 'capability not granted');
    if (declared.approval === 'ALWAYS' && x.approval_role !== declared.required_approver_role) fail('APPROVAL_ROLE_MISMATCH', `${p}.approval_role`, `requires ${declared.required_approver_role}`);
    if (declared.approval !== 'ALWAYS' && 'approval_role' in x) fail('UNEXPECTED_APPROVAL_ROLE', `${p}.approval_role`, 'action does not accept approval role');
  });

  if (overlay.human_manager_role !== role.human_manager_role) fail('HUMAN_MANAGER_MISMATCH', '$.human_manager_role', 'cannot replace Role Pack manager');
  for (const required of role.required_escalation_roles) if (!overlay.escalation_roles.includes(required)) fail('ESCALATION_ROLE_REMOVED', '$.escalation_roles', `${required} required`);
  const profile = role.model_profiles.find((x) => x.profile_id === overlay.model_profile_id);
  if (!profile) fail('UNKNOWN_MODEL_PROFILE', '$.model_profile_id', 'not declared by Role Pack');
  if (CLASS.indexOf(overlay.privacy.data_classification) > CLASS.indexOf(profile.maximum_data_classification)) fail('MODEL_PROFILE_DATA_CLASSIFICATION_EXCEEDED', '$.privacy.data_classification', 'profile not approved');
  if (profile.zero_data_retention_required && !overlay.privacy.zero_data_retention_required) fail('DATA_RETENTION_POLICY_WEAKENED', '$.privacy.zero_data_retention_required', 'cannot weaken zero-retention');
  overlay.privacy.allowed_regions.forEach((region, i) => { if (!profile.allowed_regions.includes(region)) fail('REGION_NOT_ALLOWED', `$.privacy.allowed_regions[${i}]`, `${region} not allowed`); });
  return true;
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!plain(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
export const canonicalJson = (value) => JSON.stringify(canonicalize(value));
export const prettyCanonicalJson = (value) => `${JSON.stringify(canonicalize(value), null, 2)}\n`;
export const sha256 = (value) => createHash('sha256').update(typeof value === 'string' ? value : canonicalJson(value)).digest('hex');
export const readJson = async (filePath) => JSON.parse(await readFile(filePath, 'utf8'));
