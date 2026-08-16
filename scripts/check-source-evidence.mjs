import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const ALLOWED = new Set(['SOURCE_REPORTED', 'PRIMARY_SOURCE_CONFIRMED', 'ARTIFACT_OBTAINED', 'INDEPENDENTLY_REPRODUCED', 'CONTRADICTED', 'UNKNOWN', 'NOT_EXERCISED']);
const RUNTIME_RELATIONS = new Set(['NONE', 'SYNTHETIC_ANALOG_ONLY']);
const DIGEST = /^[a-f0-9]{64}$/;

export class SourceEvidenceError extends Error {
  constructor(code, path, message) {
    super(`${path}: ${message}`);
    Object.assign(this, { name: 'SourceEvidenceError', code, path });
  }
}
const fail = (code, path, message) => { throw new SourceEvidenceError(code, path, message); };

export function validateSourceLedger(ledger) {
  if (!ledger || typeof ledger !== 'object' || Array.isArray(ledger)) fail('INVALID_LEDGER', '$', 'expected object');
  if (ledger.schema !== 'fde-agent/source-evidence-ledger/v1') fail('SCHEMA_MISMATCH', '$.schema', 'expected source evidence ledger v1');
  if (ledger.repository_runtime_relation !== 'NONE') fail('RUNTIME_RELATION_OVERCLAIM', '$.repository_runtime_relation', 'external ledger cannot claim repository runtime relation');
  if (!Array.isArray(ledger.entries) || ledger.entries.length === 0) fail('EMPTY_LEDGER', '$.entries', 'at least one claim required');
  const ids = new Set();
  ledger.entries.forEach((entry, index) => {
    const path = `$.entries[${index}]`;
    const required = ['claim_id', 'source_family', 'source_type', 'source_anchor', 'claim_summary', 'state', 'artifact_digest', 'evidence_needed', 'synthetic_analog_issue', 'runtime_relation'];
    for (const key of required) if (!(key in entry)) fail('MISSING_FIELD', `${path}.${key}`, 'required field absent');
    for (const key of ['claim_id', 'source_family', 'source_type', 'source_anchor', 'claim_summary']) if (typeof entry[key] !== 'string' || entry[key].length === 0) fail('INVALID_FIELD', `${path}.${key}`, 'expected non-empty string');
    if (ids.has(entry.claim_id)) fail('DUPLICATE_CLAIM', `${path}.claim_id`, 'duplicate claim identity');
    ids.add(entry.claim_id);
    if (!ALLOWED.has(entry.state)) fail(entry.state === 'PASS' ? 'SOURCE_PASS_FORBIDDEN' : 'INVALID_STATE', `${path}.state`, 'invalid source-evidence state');
    if (!RUNTIME_RELATIONS.has(entry.runtime_relation)) fail('INVALID_RUNTIME_RELATION', `${path}.runtime_relation`, 'invalid runtime relation');
    if (!Array.isArray(entry.evidence_needed) || entry.evidence_needed.length === 0) fail('EVIDENCE_PLAN_ABSENT', `${path}.evidence_needed`, 'missing independent evidence plan');
    if (!Number.isInteger(entry.synthetic_analog_issue) || entry.synthetic_analog_issue <= 0) fail('INVALID_ISSUE_REFERENCE', `${path}.synthetic_analog_issue`, 'expected positive Issue number');
    if (entry.artifact_digest !== null && !DIGEST.test(entry.artifact_digest)) fail('INVALID_ARTIFACT_DIGEST', `${path}.artifact_digest`, 'expected SHA-256 digest');
    if (['ARTIFACT_OBTAINED', 'INDEPENDENTLY_REPRODUCED'].includes(entry.state) && entry.artifact_digest === null) fail('ARTIFACT_EVIDENCE_ABSENT', `${path}.artifact_digest`, `${entry.state} requires an exact artifact digest`);
    if (entry.state === 'SOURCE_REPORTED' && entry.runtime_relation === 'NONE' && entry.synthetic_analog_issue !== 23) fail('ANALOG_ROUTE_MISSING', `${path}.runtime_relation`, 'design-relevant claim should declare synthetic analog only');
  });
  return true;
}

async function main() {
  const path = process.argv[2] ?? 'docs/evidence/source-ledger.json';
  const ledger = JSON.parse(await readFile(path, 'utf8'));
  validateSourceLedger(ledger);
  console.log(`PASS source evidence ledger · ${ledger.entries.length} claims · runtime relation NONE`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`${error.code ?? 'SOURCE_EVIDENCE_ERROR'} ${error.message}`);
    process.exitCode = 1;
  });
}
