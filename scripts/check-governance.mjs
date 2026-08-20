#!/usr/bin/env node

import { cp, lstat, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const FORBIDDEN_PREFIXES = [
  'tenant-overlays-private/',
  'customer-data/',
  'local-forgejo/',
  '.receipts/'
];

const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bghp_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/
];

function failure(code, message, subject) {
  return { code, message, subject };
}

async function readText(root, relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

async function readJson(root, relativePath) {
  return JSON.parse(await readText(root, relativePath));
}

async function walk(root, current = '') {
  const absolute = path.join(root, current);
  const entries = await readdir(absolute, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (['.git', 'node_modules', 'coverage', 'dist'].includes(entry.name)) continue;
    const relative = path.posix.join(current.split(path.sep).join('/'), entry.name);
    if (entry.isDirectory()) files.push(...await walk(root, relative));
    else files.push(relative);
  }

  return files;
}

export async function checkGovernance(root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))) {
  const failures = [];

  const requiredFiles = [
    'AGENTS.md',
    '.git-town.toml',
    'docs/architecture/README.md',
    'docs/architecture/system-contract.json',
    'docs/architecture/shadow-ledger.md',
    'docs/governance/runtime-identity.json',
    'docs/governance/dual-forge-binding.json',
    'docs/governance/git-town-repo-profile.md',
    'docs/governance/path-ownership.json',
    'docs/governance/task-contract.bootstrap.json',
    'docs/governance/stack-index.md'
  ];

  for (const required of requiredFiles) {
    try {
      await lstat(path.join(root, required));
    } catch {
      failures.push(failure('REQUIRED_FILE_ABSENT', 'Required governance file is absent.', required));
    }
  }

  const gitTown = await readText(root, '.git-town.toml');
  if (!/main\s*=\s*"main"/.test(gitTown)) {
    failures.push(failure('GIT_TOWN_MAIN_UNBOUND', 'Git Town main branch is not fixed to main.', '.git-town.toml'));
  }
  if (!/auto-resolve\s*=\s*false/.test(gitTown)) {
    failures.push(failure('GIT_TOWN_AUTO_RESOLVE', 'Automatic conflict resolution must remain disabled.', '.git-town.toml'));
  }
  if (!/push-branches\s*=\s*false/.test(gitTown)) {
    failures.push(failure('GIT_TOWN_BACKGROUND_PUSH', 'Default/background branch publication must remain disabled.', '.git-town.toml'));
  }

  const runtime = await readJson(root, 'docs/governance/runtime-identity.json');
  if (runtime.runtime !== 'CHATGPT_GITHUB_CONNECTOR') {
    failures.push(failure('RUNTIME_IDENTITY_DRIFT', 'Bootstrap receipt must retain the observed connector runtime identity.', 'docs/governance/runtime-identity.json'));
  }
  if (runtime.forgejo_binding === 'PASS' || runtime.git_town_executable === 'PASS') {
    failures.push(failure('RUNTIME_CAPABILITY_OVERCLAIM', 'Absent Forgejo/Git Town capabilities cannot be promoted to PASS.', 'docs/governance/runtime-identity.json'));
  }

  const dualForge = await readJson(root, 'docs/governance/dual-forge-binding.json');
  if (dualForge.evidence.github_ingress !== 'PASS') {
    failures.push(failure('GITHUB_INGRESS_UNBOUND', 'Observed GitHub ingress must remain explicitly bound.', 'docs/governance/dual-forge-binding.json'));
  }
  if (dualForge.evidence.forgejo_runtime === 'PASS' || dualForge.evidence.local_worktrees === 'PASS') {
    failures.push(failure('FORGEJO_EVIDENCE_OVERCLAIM', 'Local Forgejo/worktree evidence is absent in this runtime.', 'docs/governance/dual-forge-binding.json'));
  }
  if (dualForge.evidence.final_merge !== 'HUMAN_ADMIT_REQUIRED') {
    failures.push(failure('HUMAN_MERGE_AUTHORITY_LOST', 'Merge authority must remain Human-owned.', 'docs/governance/dual-forge-binding.json'));
  }

  const task = await readJson(root, 'docs/governance/task-contract.bootstrap.json');
  if (task.automation.auto_resolve_conflicts !== false || task.automation.auto_merge !== false) {
    failures.push(failure('TASK_AUTOMATION_WIDENED', 'Task contract cannot admit auto conflict resolution or merge.', 'docs/governance/task-contract.bootstrap.json'));
  }
  if (task.automation.git_town_admitted !== false) {
    failures.push(failure('GIT_TOWN_FALSE_ADMISSION', 'Git Town remains unadmitted until executable provenance exists.', 'docs/governance/task-contract.bootstrap.json'));
  }
  if (task.branches.length !== 3 || task.branches[0].parent !== 'main') {
    failures.push(failure('STACK_GRAPH_INVALID', 'Bootstrap task contract must preserve the three-node serial stack.', 'docs/governance/task-contract.bootstrap.json'));
  }

  const systemContract = await readJson(root, 'docs/architecture/system-contract.json');
  if (systemContract.complexity !== 'LEVEL_C' || systemContract.mode !== 'MONITOR') {
    failures.push(failure('SPATIAL_CLASSIFICATION_DRIFT', 'Agentic system must remain Level C in MONITOR mode.', 'docs/architecture/system-contract.json'));
  }
  if (systemContract.gate !== 'READY_FOR_PROTOTYPE') {
    failures.push(failure('EVIDENCE_GATE_OVERPROMOTED', 'Bootstrap cannot claim implementation or production acceptance.', 'docs/architecture/system-contract.json'));
  }

  const ownership = await readJson(root, 'docs/governance/path-ownership.json');
  const forbiddenPrefixes = new Set(ownership.public_forbidden_prefixes ?? []);
  for (const required of FORBIDDEN_PREFIXES) {
    if (!forbiddenPrefixes.has(required)) {
      failures.push(failure('FORBIDDEN_PREFIX_REMOVED', 'A private/runtime path boundary was removed.', required));
    }
  }

  const files = await walk(root);
  for (const relative of files) {
    const normalized = relative.replaceAll('\\', '/');
    if (FORBIDDEN_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
      failures.push(failure('FORBIDDEN_TRACKED_PATH', 'Private/runtime artifacts cannot be tracked in the public repository.', normalized));
      continue;
    }

    const base = path.posix.basename(normalized);
    if (base === '.env' || (base.startsWith('.env.') && base !== '.env.example')) {
      failures.push(failure('ENV_FILE_TRACKED', 'Environment-value files cannot be tracked.', normalized));
      continue;
    }

    const stat = await lstat(path.join(root, relative));
    if (!stat.isFile() || stat.size > 2_000_000) continue;
    const text = await readFile(path.join(root, relative), 'utf8').catch(() => '');
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(text)) {
        failures.push(failure('SECRET_PATTERN_DETECTED', 'Credential-like material detected.', normalized));
        break;
      }
    }
  }

  return {
    schema: 'fde-agent-platform/governance-check/v1',
    state: failures.length === 0 ? 'PASS' : 'FAIL',
    root,
    checked_files: files.length,
    failures
  };
}

async function main() {
  const rootArg = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
  const receipt = await checkGovernance(rootArg);
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
  process.exitCode = receipt.state === 'PASS' ? 0 : 2;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await main();
}

// Exported only for negative-control tests that copy and mutate a fixture tree.
export async function withGovernanceFixture(sourceRoot, mutate, run) {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'fde-governance-'));
  try {
    await cp(sourceRoot, temp, { recursive: true });
    await mutate(temp, { readFile, writeFile });
    return await run(temp);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
