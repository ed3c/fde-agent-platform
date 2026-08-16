# GitHub workflow surface

This directory contains repository-owned Issue and PR envelopes. It does not contain canonical shared procedures.

## Ownership

- Canonical procedure source: `ed3c/skills-shared@ec5a240fa3cbafda2c6a8bce0ae12143e0992f80`.
- Consumer owners: #2, #14, and #47.
- Human/repository policy owns merge, ready-for-review, permissions, release, and production.

## State machine

```text
WORK_REQUEST
→ ISSUE_CONTRACT_DRAFT
→ REQUIRED_FIELDS_COMPLETE
→ EXACT_BASE_AND_PATH_LEASE_BOUND
→ BRANCH/ATOM_ALLOCATED
→ DRAFT_PR_OPEN
→ REVIEW_AND_EVIDENCE
→ HUMAN_ADMIT / REJECT / SUPERSEDE
```

## Inputs

- objective and non-goals;
- exact base and shared-procedure subject;
- path lease and interface locks;
- acceptance/mutation controls;
- evidence ceiling and rollback.

## Outputs

- one Issue task packet;
- one Draft PR envelope per molecular atom;
- exact parent/child/sibling identity;
- Human-owned transition status.

## Forbidden transitions

- template completion does not create a branch, Worktree, provider, test result, or approval;
- no auto-merge, force push, semantic auto-resolution, permission widening, secret setup, release, or production;
- PR prose cannot promote `NOT_EXERCISED` to `PASS`.

## Verification

The governance checker must verify required fields and reject a work packet that omits the exact shared subject, procedure delta, evidence ceiling, or rollback/Human boundary.
