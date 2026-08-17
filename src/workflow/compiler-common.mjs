import { ContractValidationError } from '../../scripts/lib/contract-validation.mjs';

export const fail = (code, path, message) => { throw new ContractValidationError(code, path, message); };
export const AUTHORITY_TO_ACTION_CLASS = { A0: 'READ', A1: 'RECOMMEND', A2: 'DRAFT', A3: 'REVERSIBLE_ACTION', A4: 'APPROVED_COMMIT', A5: 'PROHIBITED' };
export const CLASS_ORDER = ['NONE', 'READ', 'RECOMMEND', 'DRAFT', 'REVERSIBLE_ACTION', 'APPROVED_COMMIT', 'PROHIBITED'];
export const ensureTenant = (value, tenantRef, path) => { if (value !== tenantRef) fail('TENANT_MISMATCH', path, `${value} != ${tenantRef}`); };
export const exactDigest = (value, expected, path, code) => { if (value !== expected) fail(code, path, `${value} != ${expected}`); };
export const setEqualsForCompiler = (left, right) => { const a = new Set(left); const b = new Set(right); return a.size === b.size && [...a].every((item) => b.has(item)); };
