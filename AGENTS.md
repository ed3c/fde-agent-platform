# AGENTS.md

## Mission and current truth

Build `fde-agent-platform` as a public, domain-neutral Outcome Delivery OS. The repository currently implements only:

1. repository governance and evidence-bound delivery configuration;
2. public Role Pack, Tenant Overlay, Digital Employee, Outcome, and Runtime Receipt contracts;
3. a deterministic Role Pack + synthetic Tenant Overlay compiler;
4. exact external `skills-shared` binding with no-vendoring controls;
5. this Agent operating/directory/DAG/Stack-PR documentation gate.

Everything else remains Issue-owned and `PLANNED`, `ABSENT`, `NOT_IMPLEMENTED`, or `NOT_EXERCISED`.

## Mandatory read order

Before modifying any path:

1. `AGENTS.md`;
2. root `README.md`;
3. `docs/governance/skills-shared-binding.json`;
4. `docs/governance/skills-binding.md`;
5. `docs/architecture/README.md`;
6. `docs/architecture/system-contract.json`;
7. `docs/architecture/shadow-ledger.md`;
8. `docs/governance/issue-dag.md`;
9. `docs/governance/stack-index.md`;
10. `docs/governance/git-town-repo-profile.md`;
11. `docs/governance/dual-forge-binding.json`;
12. `docs/governance/path-ownership.json`;
13. the owning GitHub Issue;
14. the nearest `README.md` for every writable path;
15. the current parent/child/sibling PR graph.

A missing input is `ABSENT`. Do not infer it from a branch name, model memory, an Issue title, another repository, or a prior runtime.

## Shared procedural authority

All unfinished work is directed by canonical procedures at:

```text
ed3c/skills-shared@ec5a240fa3cbafda2c6a8bce0ae12143e0992f80
```

The exact bound paths are in `docs/governance/skills-shared-binding.json`.

This repository must never contain:

- a local `SKILL.md`;
- a canonical `skills/` mirror;
- copied shared Skill frontmatter/body;
- a forked shared system prompt, publication policy, architecture rubric, or reference procedure;
- shared executable code presented as consumer-owned truth.

Repository-local files may contain only consumer bindings, profiles, task packets, product code/adapters, synthetic fixtures, tests, and exact-subject receipts.

A newer `skills-shared` commit does not silently change an active task. Rebinding requires an explicit Issue, exact-subject review, and revalidation.

## Repository documentation hierarchy

- Root `README.md` owns the global status, data flow, lifecycle summary, directory map, and Stack entrypoint.
- `docs/architecture/README.md` owns system planes, architecture DAGs, state/authority boundaries, and invariants.
- `docs/governance/issue-dag.md` owns the Issue dependency graph.
- `docs/governance/stack-index.md` owns active and planned Git Town Stack PR topology and molecular PR atoms.
- A nearest directory `README.md` owns local inputs, outputs, state machine, forbidden transitions, issues, and verification.
- Open Issues own incomplete work contracts.
- Runtime/verification receipts own execution facts.

A README may summarize another authority but must link to it and must not create a contradictory second truth.

## Route by path

| Writable path | Required owner/Issue class | Mandatory nearest README |
|---|---|---|
| `.github/**` | governance/work-packet Issue | `.github/README.md` |
| `contracts/**` | contract/interface-lock Issue | `contracts/README.md` |
| `docs/**` | architecture/governance/evidence Issue | `docs/README.md` plus nearest architecture/governance README |
| `fixtures/**` | owning contract/Eval Issue | `fixtures/README.md` |
| `scripts/**` | deterministic checker/adapter Issue | `scripts/README.md` |
| `src/compiler/**` | #4 or an explicit compiler-change Issue | `src/compiler/README.md` |
| any new `src/<module>/**` | the module Issue indexed in root README | `src/README.md` and a new local README in the same first PR |
| `evals/**` | #31 or an Issue consuming its contract | root README until `evals/README.md` lands |
| `role-packs/**` | #38 and one Role Pack leaf Issue/atom | root README until `role-packs/README.md` lands |
| `test/**` | owning implementation Issue; assertions are read-only unless the Issue explicitly adds coverage | `test/README.md` |

Do not create a planned directory merely because it appears in a diagram. Its owning Issue must first lock interfaces, paths, tests, and evidence.

## Work-packet preconditions

No implementation branch or Worker starts until the owning task packet states:

- immutable repository/base subject;
- objective and non-goals;
- exact `skills-shared` subject and applicable paths;
- issue-specific procedure delta;
- public interface locks and dependency policy;
- write, read-only, and forbidden paths;
- parent/child/sibling edge and consumed parent artifact;
- acceptance commands and non-modifiable assertions;
- negative/mutation/fault controls;
- context/provider evidence and freshness;
- evidence ceiling;
- cleanup, rollback subject, and Human-owned operations.

Missing fields block dispatch.

## Consumer execution state machine

```text
R0 ROUTE
→ R1 BIND_ISSUE
→ R2 BIND_SHARED_PROCEDURES
→ R3 READ_NEAREST_READMES
→ R4 LOCK_INTERFACES
→ R5 COMPILE_DAG_AND_PR_ATOMS
→ R6 ACQUIRE_PATH_LEASE
→ R7 IMPLEMENT
→ R8 VERIFY_AND_MUTATE
→ R9 SHADOW_ARCHITECTURE_REVIEW
→ R10 STACK_HANDOFF
```

Stable stop states:

```text
ISSUE_ABSENT
SUBJECT_MUTABLE
SHARED_BINDING_STALE
README_ABSENT
INTERFACE_LOCK_ABSENT
PATH_LEASE_OVERLAP
DAG_CYCLE
UNDECLARED_DEPENDENCY
ASSERTION_MUTATION
PRIVATE_DATA_BOUNDARY_VIOLATION
EVIDENCE_OVERPROMOTION
REPAIR_BUDGET_EXHAUSTED
SEMANTIC_CONFLICT_UNPROVEN
PUBLICATION_NOT_ADMITTED
HUMAN_ADMIT_REQUIRED
```

## Architecture and authority laws

- A Tenant Overlay may restrict a Role Pack but never widen authority.
- Prohibited actions survive composition, release, retry, recovery, model changes, and handoff.
- Human approval, escalation, legal, financial, merge, release, and production boundaries cannot be removed by a model, UI, overlay, or successful test.
- Parsed text, retrieval results, expert behavior, model output, external case reports, and telemetry are evidence/candidates, not self-authorizing truth.
- Deterministic code owns schema validation, authorization, transition legality, idempotency, accounting, reconciliation, and release-blocking assertions.
- Natural-language change requests become untrusted `ChangeSpec` candidates; they never execute directly.
- No external side effect exists without operation identity, policy decision, idempotency, timeout/unknown-completion handling, postcondition observation, reconciliation, and rollback/compensation disposition.
- Customer-private bytes, identities, credentials, policies, mappings, contracts, and live receipts never enter public GitHub.

## Git Town and molecular Stack PR law

Git Town is used only as the admitted branch graph and synchronization engine. The repository owns task decomposition, branch names, path leases, tests, receipts, publication policy, and rollback.

Every Issue is decomposed into the smallest required terminal atoms:

```text
C  contract/schema/interface lock
K  deterministic core
A  adapter/provider integration
E  evals/mutation/fault injection
X  cross-module integration/E2E
D  docs/receipt/handoff
```

Rules:

- one atom has one cohesive purpose, one branch writer, one path lease, and one independent oracle;
- a serial child must consume an exact parent contract or implementation;
- independent path-disjoint atoms are siblings;
- review/Shadow/evidence work is read-only and cannot become a second writer;
- a multi-parent convergence requires an explicit integration node after all parent subjects are admitted;
- tests accompany the atom they verify; a later `E` atom adds cross-cutting mutation/fault coverage and may not repair missing unit tests retroactively;
- no automatic semantic conflict resolution, force push, `ship`, merge, ready-for-review, permission change, release, or promotion.

The complete atom index is `docs/governance/stack-index.md`.

## Current active stack

```text
main
└─ agent/00-bootstrap-control-plane          #2  / PR #5
   └─ agent/01-contracts                     #3  / PR #6
      └─ agent/02-role-overlay-compiler      #4  / PR #7
         └─ agent/03-shared-procedure-bindings #14 / PR #24
            └─ agent/04-agent-operating-map    #47 / DRAFT PR PENDING
```

The current connector runtime can publish GitHub branches/issues/draft PRs. It does not prove Git Town execution, a local Worktree, Forgejo, Actions, merge, or production.

## Verification order

Run the strongest available gates in this order:

```text
format/syntax
→ schema/type/static checks
→ unit/contract checks
→ integration/replay
→ mutation/negative/fault controls
→ artifact/private-data/residue checks
→ Shadow Architecture checkpoint
```

For the current repository:

```bash
npm test
npm run check
npm run compile:demo
```

A green result is bound to the exact tree/environment. Do not reuse it after a material subject changes.

## Bounded repair

At most three materially different repairs may target one stable failure signature. The fourth attempt is forbidden until the task split, interface, or assumption is re-diagnosed. Preserve the failing subject and evidence.

## Completion report

Every Worker/Agent handoff reports:

- Issue and task-packet identity;
- exact base/head/tree;
- branch parent and Stack edge;
- changed paths and path lease;
- consumed/emitted contracts;
- commands, exits, test/mutation results;
- evidence states and ceiling;
- retries and unresolved blindspots;
- Shadow Architecture outcome;
- cleanup and rollback identity;
- Git Town, Forgejo, Actions, publication, merge, release, and production states separately;
- Human-owned next decision.

Never report `PASS` for `ABSENT`, `NOT_EXERCISED`, `SKIPPED_BY_POLICY`, or `HUMAN_ADMIT_REQUIRED`.
