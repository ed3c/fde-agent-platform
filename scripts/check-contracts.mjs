#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  ContractValidationError,
  readJson,
  validateComposition,
  validateOutcomeContractShape,
  validateRolePackShape,
  validateTenantOverlayShape
} from './lib/contract-validation.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

function findOpenAuthorityObjects(node, currentPath = '$') {
  const failures = [];
  if (Array.isArray(node)) {
    node.forEach((item, index) => failures.push(...findOpenAuthorityObjects(item, `${currentPath}[${index}]`)));
    return failures;
  }
  if (!node || typeof node !== 'object') return failures;
  if (node.type === 'object' && node.properties && node.additionalProperties !== false) {
    failures.push(`${currentPath} is an authority-bearing object without additionalProperties: false`);
  }
  for (const [key, child] of Object.entries(node)) {
    failures.push(...findOpenAuthorityObjects(child, `${currentPath}.${key}`));
  }
  return failures;
}

export async function checkContracts(base = root) {
  const failures = [];
  const schemasDir = path.join(base, 'contracts');
  const schemaFiles = (await readdir(schemasDir)).filter((name) => name.endsWith('.schema.json')).sort();
  const requiredSchemas = [
    'digital-employee-spec.schema.json',
    'outcome-contract.schema.json',
    'role-pack.schema.json',
    'runtime-receipt.schema.json',
    'tenant-overlay.schema.json'
  ];
  if (JSON.stringify(schemaFiles) !== JSON.stringify(requiredSchemas)) {
    failures.push({ code: 'SCHEMA_SET_MISMATCH', subject: 'contracts', message: `Expected ${requiredSchemas.join(', ')}` });
  }

  for (const file of schemaFiles) {
    try {
      const schema = JSON.parse(await readFile(path.join(schemasDir, file), 'utf8'));
      if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') throw new Error('wrong JSON Schema draft');
      if (typeof schema.$id !== 'string' || !schema.$id.endsWith('/v1')) throw new Error('stable v1 $id absent');
      if (schema.type !== 'object' || schema.additionalProperties !== false) throw new Error('top-level authority boundary must be closed');
      for (const message of findOpenAuthorityObjects(schema)) {
        failures.push({ code: 'OPEN_AUTHORITY_OBJECT', subject: file, message });
      }
    } catch (error) {
      failures.push({ code: 'SCHEMA_INVALID', subject: file, message: error.message });
    }
  }

  const rolePath = path.join(base, 'fixtures/valid/role-pack.customer-support.json');
  const overlayPath = path.join(base, 'fixtures/valid/tenant-overlay.demo.json');
  const outcomePath = path.join(base, 'fixtures/valid/outcome-contract.demo.json');
  try {
    const role = await readJson(rolePath);
    const overlay = await readJson(overlayPath);
    const outcome = await readJson(outcomePath);
    validateRolePackShape(role);
    validateTenantOverlayShape(overlay);
    validateOutcomeContractShape(outcome);
    validateComposition(role, overlay);
    if (outcome.outcome_contract_id !== overlay.outcome_contract_id) {
      throw new ContractValidationError('OUTCOME_CONTRACT_REFERENCE_MISMATCH', '$.outcome_contract_id', 'overlay and outcome fixture identities differ');
    }
    if (outcome.tenant_id !== overlay.tenant_id || outcome.role_pack_id !== role.role_pack_id) {
      throw new ContractValidationError('OUTCOME_CONTRACT_SUBJECT_MISMATCH', '$', 'outcome fixture is not bound to the valid role and tenant subjects');
    }
  } catch (error) {
    failures.push({ code: error.code ?? 'VALID_FIXTURE_FAILED', subject: error.path ?? 'valid-fixtures', message: error.message });
  }

  const negativeCases = [
    ['tenant-overlay.authority-widening.json', 'AUTHORITY_WIDENING'],
    ['tenant-overlay.prohibited-action.json', 'PROHIBITED_ACTION_GRANTED'],
    ['tenant-overlay.unknown-system.json', 'UNKNOWN_SYSTEM_BINDING'],
    ['tenant-overlay.secret-field.json', 'FORBIDDEN_SECRET_FIELD']
  ];
  const role = await readJson(rolePath);
  for (const [file, expectedCode] of negativeCases) {
    try {
      const overlay = await readJson(path.join(base, 'fixtures/invalid', file));
      validateComposition(role, overlay);
      failures.push({ code: 'NEGATIVE_CONTROL_SURVIVED', subject: file, message: `Expected ${expectedCode}.` });
    } catch (error) {
      if (!(error instanceof ContractValidationError) || error.code !== expectedCode) {
        failures.push({ code: 'NEGATIVE_CONTROL_WRONG_FAILURE', subject: file, message: `Expected ${expectedCode}, received ${error.code ?? error.name}: ${error.message}` });
      }
    }
  }

  return {
    schema: 'fde-agent-platform/contract-check/v1',
    state: failures.length === 0 ? 'PASS' : 'FAIL',
    schema_files: schemaFiles,
    valid_fixtures: [
      'role-pack.customer-support.json',
      'tenant-overlay.demo.json',
      'outcome-contract.demo.json'
    ],
    negative_controls: negativeCases.map(([file, expected]) => ({ file, expected })),
    failures
  };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const receipt = await checkContracts(process.argv[2] ? path.resolve(process.argv[2]) : root);
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
  process.exitCode = receipt.state === 'PASS' ? 0 : 2;
}
