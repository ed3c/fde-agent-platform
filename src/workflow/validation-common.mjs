import {
  assertNoForbiddenSecrets,
  canonicalize,
  ContractValidationError,
  sha256
} from '../../scripts/lib/contract-validation.mjs';

export const ID = /^[a-z][a-z0-9-]{2,95}$/;
export const TOOL_ID = /^[a-z][a-z0-9.-]{2,127}$/;
export const DIGEST = /^[a-f0-9]{64}$/;
export const ACTION_CLASSES = ['NONE', 'READ', 'RECOMMEND', 'DRAFT', 'REVERSIBLE_ACTION', 'APPROVED_COMMIT', 'PROHIBITED'];
export const EXECUTOR_CLASSES = ['DETERMINISTIC', 'MODEL', 'HUMAN', 'CONNECTOR'];
export const SAFE_MODEL_RESPONSIBILITIES = ['CLASSIFY', 'EXTRACT', 'SUMMARIZE', 'RECOMMEND'];
export const TERMINAL_KINDS = new Set(['TERMINAL_SUCCESS', 'TERMINAL_FAILURE']);
export const SIDE_EFFECT_CLASSES = new Set(['DRAFT', 'REVERSIBLE_ACTION', 'APPROVED_COMMIT']);
const CODE_PATTERN = /(?:#!\s*\/|\b(?:python|bash|powershell|node)\b\s+-|\b(?:eval|exec)\s*\(|(?:&&|\|\||;\s*(?:rm|curl|wget|python|bash|node)\b))/i;

export const fail = (code, path, message) => {
  throw new ContractValidationError(code, path, message);
};
export const plain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
export const exact = (value, keys, path) => {
  if (!plain(value)) fail('INVALID_TYPE', path, 'expected object');
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) fail('UNEXPECTED_FIELD', `${path}.${key}`, 'not part of contract');
  }
  for (const key of keys) {
    if (!(key in value)) fail('MISSING_FIELD', `${path}.${key}`, 'required field absent');
  }
};
export const str = (value, path, pattern) => {
  if (typeof value !== 'string' || value.length === 0) fail('INVALID_TYPE', path, 'expected non-empty string');
  if (pattern && !pattern.test(value)) fail('INVALID_VALUE', path, 'invalid format');
};
export const nullableStr = (value, path, pattern) => {
  if (value === null) return;
  str(value, path, pattern);
};
export const bool = (value, path) => {
  if (typeof value !== 'boolean') fail('INVALID_TYPE', path, 'expected boolean');
};
export const integer = (value, path, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  if (!Number.isInteger(value) || value < min || value > max) {
    fail('INVALID_VALUE', path, `expected integer ${min}..${max}`);
  }
};
export const number = (value, path, min = 0, max = Number.MAX_VALUE) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    fail('INVALID_VALUE', path, `expected number ${min}..${max}`);
  }
};
export const iso = (value, path) => {
  str(value, path);
  if (Number.isNaN(Date.parse(value))) fail('INVALID_VALUE', path, 'expected ISO timestamp');
};
export const enumValue = (value, values, path) => {
  if (!values.includes(value)) fail('INVALID_VALUE', path, `expected one of ${values.join(', ')}`);
};
export const strings = (value, path, minimum = 0, pattern = null) => {
  if (!Array.isArray(value) || value.length < minimum) {
    fail('INVALID_VALUE', path, `expected at least ${minimum} items`);
  }
  const seen = new Set();
  value.forEach((item, index) => {
    str(item, `${path}[${index}]`, pattern);
    if (seen.has(item)) fail('DUPLICATE_IDENTITY', `${path}[${index}]`, 'duplicate item');
    seen.add(item);
  });
};
export const uniqueBy = (items, key, path) => {
  const seen = new Set();
  items.forEach((item, index) => {
    if (seen.has(item[key])) fail('DUPLICATE_IDENTITY', `${path}[${index}].${key}`, 'duplicate');
    seen.add(item[key]);
  });
};
export const setEquals = (left, right) => {
  const a = new Set(left);
  const b = new Set(right);
  return a.size === b.size && [...a].every((item) => b.has(item));
};

export function assertNoArbitraryCode(value, path = '$') {
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoArbitraryCode(item, `${path}[${index}]`));
  if (plain(value)) {
    return Object.entries(value).forEach(([key, child]) => assertNoArbitraryCode(child, `${path}.${key}`));
  }
  if (typeof value === 'string' && CODE_PATTERN.test(value)) {
    fail('ARBITRARY_CODE_FORBIDDEN', path, 'workflow contracts cannot contain executable code');
  }
}
