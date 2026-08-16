# AGENTS.md

## Mission

Build the FDE Agent Platform as a public, domain-neutral **Outcome Delivery OS**. The current executable slice compiles a reusable Role Pack and a synthetic Tenant Overlay into a governed `DigitalEmployeeSpec` candidate.

## Mandatory read order

Before changing a path, read:

1. this file;
2. `docs/governance/skills-shared-binding.json`;
3. `docs/governance/skills-binding.md`;
4. `docs/architecture/README.md`;
5. `docs/architecture/system-contract.json`;
6. `docs/architecture/shadow-ledger.md`;
7. `docs/governance/git-town-repo-profile.md`;
8. `docs/governance/dual-forge-binding.json`;
9. `docs/governance/path-ownership.json`;
10. the owning GitHub issue and nearest `README.md`.

An absent input remains `ABSENT`. Do not infer it from branch names, model memory, or another repository.

## Shared-procedure authority

`ed3c/skills-shared` is the canonical source of execution procedures for every unfinished issue. The exact repository subject and canonical paths are recorded in `docs/governance/skills-shared-binding.json`.

The Skill bodies remain exclusively in `skills-shared`.

This consumer repository must not contain or generate:

- a local `SKILL.md`;
- a tracked `skills/` mirror of shared procedures;
- a copied shared Skill frontmatter/body;
- a forked shared system prompt, publication policy, or reference procedure;
- a modified local substitute presented as the canonical Skill.

Repository-local files may contain only consumer-owned bindings, profiles, task packets, architecture contracts, adapters, tests, and exact-subject receipts. They may identify an applicable shared procedure by repository, immutable commit, path, and procedure ID, but must not reproduce its body.

A shared Skill update never silently changes an active issue. Rebinding to a newer `skills-shared` commit requires an explicit issue, exact-subject review, and revalidation.

## Unfinished-issue execution contract

Every unfinished implementation issue must state:

- exact `skills-shared` subject and applicable canonical paths;
- the procedure delta required for that issue;
- objective, non-goals, exact base, path lease, and interface locks;
- acceptance commands, immutable assertions, and negative controls;
- evidence ceiling, cleanup, rollback subject, and Human-owned operations.

The shared procedures direct **how** the issue is executed. The issue owns **what** changes in this repository and how its result is verified. Mentioning a Skill is not execution, and execution without exact-subject evidence is not verification.

## Public/private boundary

The public repository may contain generic contracts, synthetic fixtures, domain-neutral Role Packs, policy skeletons, deterministic validators/compilers, evaluation harnesses, and anonymized failure taxonomies.

The public repository must never contain customer documents, meetings, identities, event logs, business amounts, credentials, private policies, tenant mappings, customer-specific connectors, commercial contracts, live Tenant Overlays, or production Runtime Receipts.

Private artifacts belong to the admitted local Forgejo/private lane. Until that lane is bound, they are `ABSENT`, not simulated.

## Repository-specific architecture invariants

- A Tenant Overlay may restrict a Role Pack but may never widen its authority.
- Prohibited actions survive every composition and version upgrade.
- Human-owned approval and escalation boundaries cannot be removed by a model or overlay.
- Same normalized inputs produce byte-equivalent normalized output.
- Every compiled artifact binds exact input digests and contract versions.
- Deterministic rules own authorization, schema enforcement, graph validation, idempotency, and release gates.
- Model output is a candidate, never production authority.
- No external side effect is introduced without operation identity, idempotency, reconciliation, and rollback semantics.

## Evidence and authority boundary

A green local test proves only its exact local subject. Git Town execution, local Forgejo delivery, GitHub Actions, remote ancestry, merge, release, and production admission remain separate evidence lanes.

Semantic conflict resolution, merge, permission changes, secret setup, legal acceptance, release promotion, production deployment, and destructive rollback remain Human-owned.

## Current stack

```text
main
└─ agent/00-bootstrap-control-plane      (#2)
   └─ agent/01-contracts                 (#3)
      └─ agent/02-role-overlay-compiler  (#4)
         └─ agent/03-shared-procedure-bindings (#14)
```

## Verification

Run the strongest commands available for the active branch:

```bash
npm test
npm run check
```
