#!/usr/bin/env node

import { cp, lstat, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const BINDING_PATH = 'docs/governance/skills-shared-binding.json';
const ISSUE_TEMPLATE_PATH = '.github/ISSUE_TEMPLATE/work-packet.yml';
const EXPECTED_REPOSITORY = 'ed3c/skills-shared';
const EXPECTED_REPOSITORY_ID = 1326262274;
const EXPECTED_SUBJECT = 'ec5a240fa3cbafda2c6a8bce0ae12143e0992f80';

const EXPECTED_BINDINGS = new Map([
  ['git-town-stacked-pr-worker', 'skills/git-town-stacked-pr-worker/SKILL.md'],
  ['dual-forge-repository-loop', 'skills/dual-forge-repository-loop/SKILL.md'],
  ['spatial-loop-systems-engineering', 'skills/spatial-loop-systems-engineering/SKILL.md'],
  ['shadow-architecture-watch-loop', 'skills/spatial-loop-systems-engineering/references/architecture-watch-loop.md'],
  ['procedural-shadow-runtime', 'skills/procedural-shadow-runtime/SKILL.md'],
  ['agentic-tech-lead-orchestration', 'skills/agentic-tech-lead-orchestration/SKILL.md']
]);

const SHARED_SKILL_NAMES = [...EXPECTED_BINDINGS.keys()].filter((name) => name !== 'shadow-architecture-watch-loop');
const SHARED_FRONTMATTER = new RegExp(
  `^---\\s*\\nname:\\s*["']?(?:${SHARED_SKILL_NAMES.map(escapeRegExp).join('|')})["']?\\s*(?:\\n|$)`,
  'i'
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function failure(code, message, subject) {
  return { code, message, subject };
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

async function readJson(root, relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
}

export async function checkSharedSkillBinding(
  root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
) {
  const failures = [];
  let binding;

  try {
    binding = await readJson(root, BINDING_PATH);
  } catch (error) {
    failures.push(failure('SHARED_BINDING_ABSENT', `Binding manifest is absent or invalid: ${error.message}`, BINDING_PATH));
  }

  if (binding) {
    if (binding.schema !== 'fde-agent-platform/shared-procedure-binding/v1') {
      failures.push(failure('SHARED_BINDING_SCHEMA_INVALID', 'Unexpected shared-procedure binding schema.', BINDING_PATH));
    }
    if (binding.mode !== 'REMOTE_CANONICAL_NO_VENDOR') {
      failures.push(failure('SHARED_BINDING_MODE_INVALID', 'Shared procedures must remain remote-canonical and non-vendored.', BINDING_PATH));
    }
    if (binding.source?.repository !== EXPECTED_REPOSITORY || binding.source?.repository_id !== EXPECTED_REPOSITORY_ID) {
      failures.push(failure('SHARED_REPOSITORY_IDENTITY_DRIFT', 'The canonical skills-shared repository identity changed.', BINDING_PATH));
    }
    if (binding.source?.subject_sha !== EXPECTED_SUBJECT || !/^[0-9a-f]{40}$/.test(binding.source?.subject_sha ?? '')) {
      failures.push(failure('SHARED_SUBJECT_MUTABLE', 'Active work packets must bind the admitted immutable skills-shared subject.', BINDING_PATH));
    }

    const actual = new Map((binding.bindings ?? []).map((entry) => [entry.id, entry.path]));
    for (const [id, expectedPath] of EXPECTED_BINDINGS) {
      if (actual.get(id) !== expectedPath) {
        failures.push(failure('SHARED_BINDING_PATH_MISSING', `Canonical binding ${id} is absent or points elsewhere.`, expectedPath));
      }
    }
    if (actual.size !== EXPECTED_BINDINGS.size) {
      failures.push(failure('SHARED_BINDING_SET_DRIFT', 'The shared binding set contains an undeclared or missing procedure.', BINDING_PATH));
    }

    if (binding.consumer_policy?.skill_body_location !== 'skills-shared-only'
      || binding.consumer_policy?.local_skill_md !== 'denied'
      || binding.consumer_policy?.local_skills_directory !== 'denied'
      || binding.consumer_policy?.copied_skill_frontmatter !== 'denied') {
      failures.push(failure('NON_VENDOR_POLICY_WEAKENED', 'The no-vendoring policy was weakened.', BINDING_PATH));
    }
  }

  try {
    const template = await readFile(path.join(root, ISSUE_TEMPLATE_PATH), 'utf8');
    for (const requiredLabel of ['Shared procedure bindings', 'Procedure delta and evidence ceiling']) {
      if (!template.includes(`label: ${requiredLabel}`)) {
        failures.push(failure('ISSUE_PROCEDURE_BINDING_ABSENT', `Work packet template is missing: ${requiredLabel}.`, ISSUE_TEMPLATE_PATH));
      }
    }
    if (!template.includes('Do not paste Skill bodies')) {
      failures.push(failure('ISSUE_NON_VENDOR_WARNING_ABSENT', 'Work packets must explicitly forbid pasted Skill bodies.', ISSUE_TEMPLATE_PATH));
    }
  } catch (error) {
    failures.push(failure('ISSUE_TEMPLATE_ABSENT', `Work packet template is absent: ${error.message}`, ISSUE_TEMPLATE_PATH));
  }

  const files = await walk(root);
  for (const relative of files) {
    const normalized = relative.replaceAll('\\', '/');
    const base = path.posix.basename(normalized);

    if (base.toLowerCase() === 'skill.md' || normalized.toLowerCase().startsWith('skills/')) {
      failures.push(failure('SHARED_SKILL_BODY_VENDORED', 'Shared Skill bodies and a local skills mirror are forbidden.', normalized));
      continue;
    }

    const stat = await lstat(path.join(root, relative));
    if (!stat.isFile() || stat.size > 2_000_000) continue;
    const text = await readFile(path.join(root, relative), 'utf8').catch(() => '');
    if (SHARED_FRONTMATTER.test(text)) {
      failures.push(failure('SHARED_SKILL_FRONTMATTER_COPIED', 'A canonical shared Skill body was copied under another path.', normalized));
    }
  }

  return {
    schema: 'fde-agent-platform/shared-procedure-binding-check/v1',
    state: failures.length === 0 ? 'PASS' : 'FAIL',
    root,
    source: binding?.source ?? null,
    checked_files: files.length,
    failures
  };
}

async function main() {
  const rootArg = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
  const receipt = await checkSharedSkillBinding(rootArg);
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
  process.exitCode = receipt.state === 'PASS' ? 0 : 2;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await main();
}

export async function withSharedBindingFixture(sourceRoot, mutate, run) {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'fde-shared-binding-'));
  try {
    await cp(sourceRoot, temp, { recursive: true });
    await mutate(temp, { readFile, writeFile });
    return await run(temp);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
