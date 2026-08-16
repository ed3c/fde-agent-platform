# AGENTS.md

## Mission

Build the FDE Agent Platform as a public, domain-neutral **Outcome Delivery OS**. The first executable slice compiles a reusable Role Pack and a private Tenant Overlay into a governed `DigitalEmployeeSpec` candidate.

## Mandatory read order

Before changing a path, read:

1. this file;
2. `docs/architecture/README.md`;
3. `docs/architecture/system-contract.json`;
4. `docs/architecture/shadow-ledger.md`;
5. `docs/governance/git-town-repo-profile.md`;
6. `docs/governance/dual-forge-binding.json`;
7. `docs/governance/path-ownership.json`;
8. the owning GitHub issue and nearest `README.md`.

An absent input remains `ABSENT`. Do not infer it from branch names or prior repositories.

## Canonical shared procedures

This repository binds, but does not copy or shadow, these canonical procedures from `ed3c/skills-shared`:

- `git-town-stacked-pr-worker`;
- `dual-forge-repository-loop`;
- `spatial-loop-systems-engineering` in default `MONITOR` mode;
- `procedural-shadow-runtime` for pre-side-effect and receipt closure;
- `agentic-tech-lead-orchestration` for contract-first task DAGs and stacked branches.

Repository-local files contain only consumer profiles, task packets, tests, adapters, and receipts.

## Public/private boundary

The public repository may contain:

- generic contracts and schemas;
- synthetic fixtures;
- domain-neutral Role Packs;
- policy skeletons;
- deterministic validators and compilers;
- evaluation harnesses;
- anonymized failure taxonomies.

The public repository must never contain:

- customer documents, meetings, identities, event logs, or business amounts;
- credentials, tokens, cookies, browser profiles, private keys, or `.env` values;
- customer-specific policies, system mappings, connector implementations, or commercial contracts;
- live Tenant Overlays or production Runtime Receipts.

Private artifacts belong to the admitted local Forgejo/private lane. Until that lane is bound, they are `ABSENT`, not simulated.

## Architecture laws

- A Tenant Overlay may restrict a Role Pack but may never widen its authority.
- Prohibited actions survive every composition and version upgrade.
- Human-owned approval and escalation boundaries cannot be removed by a model or overlay.
- Same normalized inputs must produce byte-equivalent normalized output.
- Every compiled artifact binds exact input digests and contract versions.
- Deterministic rules own authorization, graph validation, idempotency, and schema enforcement.
- Model output is a candidate, never production authority.
- No external side effect is introduced without identity, idempotency, reconciliation, and rollback semantics.

## Shadow Architecture loop

The Builder owns implementation. The Shadow Architect is read-only and records material deltas in `docs/architecture/shadow-ledger.md`.

At each material checkpoint ask:

1. What became newly possible?
2. What must now remain true?
3. How would we know it is false?

Use `L3 BLOCK` before permission widening, irreversible writes, destructive migration, secret exposure, evidence promotion, production deployment, or autonomous workflow mutation without a verified rollback path.

## Branch and writer policy

- One issue owns one branch writer and one path lease.
- Child branches consume an explicit parent contract.
- Independent path-disjoint work is a sibling, not an artificial child.
- No automatic semantic conflict resolution, force push, merge, `git town ship`, permission change, or production promotion.
- Git Town synchronization is bounded, non-interactive, `--no-auto-resolve`, and no-push by default.
- Three materially different failures with the same signature stop blind repair and require a fresh diagnosis/new worktree.

## Current stack

```text
main
└─ agent/00-bootstrap-control-plane   (#2)
   └─ agent/01-contracts              (#3)
      └─ agent/02-role-overlay-compiler (#4)
```

## Verification

Run the strongest commands available for the active branch:

```bash
npm test
npm run check
```

A green local test proves only its exact local subject. Git Town execution, Forgejo delivery, GitHub Actions, remote ancestry, merge, and production admission remain separate evidence lanes.
