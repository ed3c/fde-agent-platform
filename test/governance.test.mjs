import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { checkGovernance, withGovernanceFixture } from '../scripts/check-governance.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

function codes(receipt) {
  return new Set(receipt.failures.map((entry) => entry.code));
}

test('repository governance passes on the exact bootstrap tree', async () => {
  const receipt = await checkGovernance(root);
  assert.equal(receipt.state, 'PASS', JSON.stringify(receipt.failures, null, 2));
});

test('negative control: Git Town auto-resolution is rejected', async () => {
  const receipt = await withGovernanceFixture(
    root,
    async (fixture) => {
      const target = path.join(fixture, '.git-town.toml');
      const current = await readFile(target, 'utf8');
      await writeFile(target, current.replace('auto-resolve = false', 'auto-resolve = true'));
    },
    checkGovernance
  );
  assert.equal(receipt.state, 'FAIL');
  assert.ok(codes(receipt).has('GIT_TOWN_AUTO_RESOLVE'));
});

test('negative control: absent Forgejo evidence cannot be promoted', async () => {
  const receipt = await withGovernanceFixture(
    root,
    async (fixture) => {
      const target = path.join(fixture, 'docs/governance/dual-forge-binding.json');
      const current = JSON.parse(await readFile(target, 'utf8'));
      current.evidence.forgejo_runtime = 'PASS';
      await writeFile(target, `${JSON.stringify(current, null, 2)}\n`);
    },
    checkGovernance
  );
  assert.equal(receipt.state, 'FAIL');
  assert.ok(codes(receipt).has('FORGEJO_EVIDENCE_OVERCLAIM'));
});

test('negative control: private tenant overlays cannot enter public GitHub', async () => {
  const receipt = await withGovernanceFixture(
    root,
    async (fixture) => {
      const target = path.join(fixture, 'tenant-overlays-private');
      await mkdir(target, { recursive: true });
      await writeFile(path.join(target, 'customer-a.json'), '{"private":true}\n');
    },
    checkGovernance
  );
  assert.equal(receipt.state, 'FAIL');
  assert.ok(codes(receipt).has('FORBIDDEN_TRACKED_PATH'));
});
