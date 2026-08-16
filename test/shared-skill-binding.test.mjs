import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

import {
  checkSharedSkillBinding,
  withSharedBindingFixture
} from '../scripts/check-shared-skill-binding.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

function codes(receipt) {
  return new Set(receipt.failures.map((entry) => entry.code));
}

test('shared procedures remain exact, external, and non-vendored', async () => {
  const receipt = await checkSharedSkillBinding(root);
  assert.equal(receipt.state, 'PASS', JSON.stringify(receipt.failures, null, 2));
});

test('negative control: a local skills/SKILL.md mirror is rejected', async () => {
  const receipt = await withSharedBindingFixture(
    root,
    async (fixture) => {
      const target = path.join(fixture, 'skills', 'copied');
      await mkdir(target, { recursive: true });
      await writeFile(path.join(target, 'SKILL.md'), '---\nname: copied\n---\n');
    },
    checkSharedSkillBinding
  );

  assert.equal(receipt.state, 'FAIL');
  assert.ok(codes(receipt).has('SHARED_SKILL_BODY_VENDORED'));
});

test('negative control: copied canonical Skill frontmatter under another name is rejected', async () => {
  const receipt = await withSharedBindingFixture(
    root,
    async (fixture) => {
      const target = path.join(fixture, 'docs', 'copied-procedure.md');
      await writeFile(target, '---\nname: dual-forge-repository-loop\n---\n\n# Copied body\n');
    },
    checkSharedSkillBinding
  );

  assert.equal(receipt.state, 'FAIL');
  assert.ok(codes(receipt).has('SHARED_SKILL_FRONTMATTER_COPIED'));
});

test('negative control: mutable or changed skills-shared subject is rejected', async () => {
  const receipt = await withSharedBindingFixture(
    root,
    async (fixture) => {
      const target = path.join(fixture, 'docs', 'governance', 'skills-shared-binding.json');
      const binding = JSON.parse(await readFile(target, 'utf8'));
      binding.source.subject_sha = 'main';
      await writeFile(target, `${JSON.stringify(binding, null, 2)}\n`);
    },
    checkSharedSkillBinding
  );

  assert.equal(receipt.state, 'FAIL');
  assert.ok(codes(receipt).has('SHARED_SUBJECT_MUTABLE'));
});

test('negative control: issue template cannot omit procedure delta', async () => {
  const receipt = await withSharedBindingFixture(
    root,
    async (fixture) => {
      const target = path.join(fixture, '.github', 'ISSUE_TEMPLATE', 'work-packet.yml');
      const current = await readFile(target, 'utf8');
      await writeFile(target, current.replace('label: Procedure delta and evidence ceiling', 'label: Implementation notes'));
    },
    checkSharedSkillBinding
  );

  assert.equal(receipt.state, 'FAIL');
  assert.ok(codes(receipt).has('ISSUE_PROCEDURE_BINDING_ABSENT'));
});
