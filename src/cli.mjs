#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { ContractValidationError, prettyCanonicalJson, readJson } from '../scripts/lib/contract-validation.mjs';
import { compileDigitalEmployee } from './compiler/compile-digital-employee.mjs';

class UsageError extends Error {}

function parseCompileArguments(args) {
  const result = { rolePack: null, tenantOverlay: null, output: null };
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (!['--role-pack', '--tenant-overlay', '--output'].includes(flag)) {
      throw new UsageError(`Unknown argument: ${flag}`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith('--')) throw new UsageError(`Missing value for ${flag}`);
    index += 1;
    if (flag === '--role-pack') {
      if (result.rolePack) throw new UsageError('--role-pack may be supplied only once');
      result.rolePack = value;
    } else if (flag === '--tenant-overlay') {
      if (result.tenantOverlay) throw new UsageError('--tenant-overlay may be supplied only once');
      result.tenantOverlay = value;
    } else {
      if (result.output) throw new UsageError('--output may be supplied only once');
      result.output = value;
    }
  }
  if (!result.rolePack || !result.tenantOverlay) {
    throw new UsageError('compile requires --role-pack <path> and --tenant-overlay <path>');
  }
  return result;
}

function usage() {
  return [
    'Usage:',
    '  node src/cli.mjs compile --role-pack <path> --tenant-overlay <path> [--output <path>]',
    '',
    'The compiler is deterministic and performs no network, model, MCP, or production write.'
  ].join('\n');
}

export async function runCli(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;
  if (command !== 'compile') throw new UsageError(command ? `Unknown command: ${command}` : 'Command is required');
  const options = parseCompileArguments(args);
  const [rolePack, tenantOverlay] = await Promise.all([
    readJson(path.resolve(options.rolePack)),
    readJson(path.resolve(options.tenantOverlay))
  ]);
  const output = prettyCanonicalJson(compileDigitalEmployee(rolePack, tenantOverlay));
  if (options.output) {
    const outputPath = path.resolve(options.output);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, output, { encoding: 'utf8', flag: 'w' });
  } else {
    process.stdout.write(output);
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    process.exitCode = await runCli();
  } catch (error) {
    if (error instanceof UsageError) {
      process.stderr.write(`${error.message}\n\n${usage()}\n`);
      process.exitCode = 64;
    } else if (error instanceof ContractValidationError) {
      process.stderr.write(`${JSON.stringify({ state: 'FAIL', code: error.code, path: error.path, message: error.message }, null, 2)}\n`);
      process.exitCode = 2;
    } else {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 70;
    }
  }
}
