# AGENTS.md

## Mission and current truth

Build `fde-agent-platform` as a public, domain-neutral **Outcome Delivery OS**. The current exact implementation parent is:

```text
agent/i30-d-connector-handoff
b24444b7910197c20ff53d12c983a052c82738ab
tree 461dbe49fa15f732ddc2d3a7868a6a05ccc12a5c
```

That subject contains a synthetic control plane through the typed Connector boundary. It does **not** contain an admitted durable runtime, release controller, production provider, customer deployment, or measured business outcome.

### Current implementation classification

| Surface | Current state | Gate / evidence ceiling |
|---|---|---|
| Governance, public contracts, Role/Overlay compiler, shared-procedure binding | `IMPLEMENTED_DRAFT` | PRs #5–#7, #24; open and unmerged |
| Artifact Registry, opportunity, ingestion, Eval contracts, external-claim ledger | `PARTIAL_CONTRACT` | PRs #49–#53; Gate #54 open |
| Data Readiness + bitemporal Process Twin | `SYNTHETIC_CLOSED` | PRs #55–#63; Gate #64 open |
| ContextPack + deterministic Policy/Capability | `SYNTHETIC_CLOSED` | PRs #66–#73; Gate #75 open |
| WorkflowSpec / ChangeSpec compiler | `SYNTHETIC_CLOSED` | PRs #77–#80; Gate #81 open |
| Security Control Plane + typed Connector/MCP + in-memory adapter | `SYNTHETIC_CLOSED` | PRs #83–#91; Gate #92 open |
| Durable simulator, release/canary, Outcome Ledger, models, Workbench, operations, capstone | `OPEN_DESIGN` | Issues #10–#12, #17–#21, #31–#44 |
| Git Town executable, Worktrees, Forgejo, private Overlay, live identity/provider/canary | `BLOCKED_LIVE_SUBSTRATE` | Issues #13, #33, #40, #44, #46 |
| Merge, release, production, legal, financial settlement | `HUMAN_ADMIT_REQUIRED` | repository / organization authority |

`IMPLEMENTED_DRAFT` and `SYNTHETIC_CLOSED` mean code and exact synthetic evidence exist on open Draft PRs. They do not mean admitted, merged, on `main`, GitHub-Actions-verified, production-ready, or customer-proven.

## Mandatory read order

Before modifying any path:

1. `AGENTS.md`;
2. root `README.md`;
3. `docs/governance/current-integration-status.md`;
4. `docs/architecture/closure-matrix.md`;
5. `docs/governance/skills-shared-binding.json`;
6. `docs/governance/skills-binding.md`;
7. `docs/architecture/README.md`;
8. `docs/architecture/system-contract.json`;
9. `docs/architecture/shadow-ledger.md`;
10. `docs/governance/issue-dag.md`;
11. `docs/governance/stack-index.md`;
12. `docs/governance/git-town-repo-profile.md`;
13. `docs/governance/dual-forge-binding.json`;
14. `docs/governance/path-ownership.json`;
15. the owning GitHub Issue and its current comments;
16. the nearest `README.md` for every writable path;
17. the exact parent/child/sibling Draft-PR graph.

A missing or unobserved input is `ABSENT` or `NOT_EXERCISED`. Never reconstruct it from memory, branch names, source articles, or a different runtime.

## Evidence vocabulary

Use these states exactly:

- `IMPLEMENTED_DRAFT` — implementation exists on an open Draft PR.
- `PARTIAL_CONTRACT` — interface/contract exists but its core, adapter, Eval, or handoff is incomplete.
- `SYNTHETIC_CLOSED` — the declared synthetic fixture and mutations close at the exact local evidence ceiling.
- `INTEGRATION_ADMISSION_OPEN` — an admission Gate still owns reviewed convergence and full-repository verification.
- `OPEN_DESIGN` — an Issue contract exists; no complete implementation Stack exists.
- `BLOCKED_LIVE_SUBSTRATE` — completion requires a local/private/provider runtime not available here.
- `SOURCE_REPORTED` / `PRIMARY_SOURCE_CONFIRMED` / `SYNTHETIC_ANALOG_ONLY` — external evidence states, never repository runtime PASS.
- `NOT_EXERCISED`, `ABSENT`, `SKIPPED_BY_POLICY`, `HUMAN_ADMIT_REQUIRED` — distinct non-PASS states.

Never compress these states into “done”.

## Canonical shared procedural authority

All unfinished work is directed by:

```text
ed3c/skills-shared@ec5a240fa3cbafda2c6a8bce0ae12143e0992f80
```

Exact paths are recorded in `docs/governance/skills-shared-binding.json`.

This repository must never contain:

- a local `SKILL.md`;
- a mirrored canonical `skills/` tree;
- copied Skill frontmatter/body, shared system prompt, rubric, or executable procedure;
- a consumer-owned replacement for the bound shared procedures.

Repository-local files may contain only consumer bindings, task packets, product code/adapters, synthetic fixtures, tests, and exact-subject receipts. Rebinding to another `skills-shared` commit requires a separate Issue and full revalidation.

## Repository truth hierarchy

1. Exact Git objects and provider readback own branch/tree facts.
2. Runtime and verification receipts own exercised behavior.
3. Public contracts and code own executable semantics.
4. Open Issues own unfinished requirements and evidence ceilings.
5. `docs/architecture/README.md` owns the architecture model.
6. `docs/governance/issue-dag.md` owns dependency classification.
7. `docs/governance/stack-index.md` owns repository-specific molecular PR topology.
8. Root and nearest READMEs are routing/index layers, not independent authority.
9. External articles/PDFs/presentations are source evidence only; see `docs/architecture/closure-matrix.md` and Issue #23.

A lower layer may summarize a higher layer but cannot contradict or promote it.

## Gate law

The following admission Gates remain open:

```text
#54  Contract Foundation siblings
#64  Data Readiness + Process Twin
#75  Context + Policy convergence
#81  WorkflowSpec / ChangeSpec
#92  Security + Connector/MCP
```

A downstream Draft Stack may prepare against an exact upstream subject, but it cannot claim integrated admission while its Gate is open. Parent drift invalidates dependent tests, approvals, and receipts until restack and revalidation.

## Route by path

| Path | Current state | Owner / nearest README |
|---|---|---|
| `.github/**` | implemented governance | #2 #14 #47; `.github/README.md` |
| `contracts/**` | implemented across Draft stacks | owning contract Issue; `contracts/README.md` |
| `docs/**` | implemented, currently reconciled by #94 | `docs/README.md` and nearest README |
| `fixtures/**` | synthetic only | owning module Issue; `fixtures/README.md` |
| `scripts/**` | deterministic gates | owning module Issue; `scripts/README.md` |
| `src/compiler/**` | `IMPLEMENTED_DRAFT` | #4; `src/compiler/README.md` |
| `src/registry/**` | `PARTIAL_CONTRACT` | #15; `src/registry/README.md` |
| `src/engagement/**` | `PARTIAL_CONTRACT` | #26; `src/engagement/README.md` |
| `src/data/**` | `SYNTHETIC_CLOSED` readiness; persistence absent | #45 / #29; `src/data/README.md` |
| `src/evidence/**` | `SYNTHETIC_CLOSED` | #8; `src/evidence/README.md` |
| `src/context/**` | `SYNTHETIC_CLOSED` | #27; `src/context/README.md` |
| `src/policy/**` | `SYNTHETIC_CLOSED` | #9; `src/policy/README.md` |
| `src/workflow/**` | `SYNTHETIC_CLOSED` | #28; `src/workflow/README.md` |
| `src/security/**` | `SYNTHETIC_CLOSED` | #22; `src/security/README.md` |
| `src/connectors/**` | `SYNTHETIC_CLOSED` for in-memory adapter | #30; `src/connectors/README.md` |
| absent `src/runtime`, `src/release`, `src/outcomes`, `src/models`, `src/learning`, `src/observability`, `src/private-lane`, `src/deployment`, `src/workbench`, `src/operations`, `src/assurance`, `src/api` | `OPEN_DESIGN` / `BLOCKED_LIVE_SUBSTRATE` | owning Issue; create only with contract + local README in the same first atom |
| `evals/**` | base contract only | #31; `evals/README.md` |
| `role-packs/**` | absent | #38; do not create before common catalog contract |
| `test/**` | implemented assertions across modules | owning Issue; `test/README.md` |

## Tech Lead work-packet preconditions

No Builder or Worker starts until the owning task packet includes:

- exact base commit/tree and admission Gate;
- objective, non-goals, and evidence ceiling;
- bound `skills-shared` subject and issue-specific procedure delta;
- locked interfaces and consumed exact subjects;
- write, read-only, and forbidden paths;
- one branch writer and one non-overlapping path lease;
- serial, sibling, convergence, or review-only edge;
- acceptance commands and immutable assertions;
- negative/mutation/fault controls;
- cleanup and rollback identity;
- Human-owned transitions.

Missing fields produce `INTERFACE_LOCK_ABSENT`, `UNDECLARED_DEPENDENCY`, or `HUMAN_ADMIT_REQUIRED`; they do not invite guesswork.

## Consumer execution state machine

```text
R0 ROUTE
→ R1 BIND_ISSUE_AND_GATE
→ R2 BIND_SHARED_PROCEDURES
→ R3 READ_CURRENT_STATUS_AND_NEAREST_READMES
→ R4 LOCK_INTERFACES_AND_EVIDENCE_CEILING
→ R5 COMPILE_DAG_AND_MOLECULAR_ATOMS
→ R6 ACQUIRE_PATH_LEASE
→ R7 IMPLEMENT_SMALLEST_COHESIVE_ATOM
→ R8 VERIFY_AND_KILL_MUTATIONS
→ R9 SHADOW_ARCHITECTURE_REVIEW
→ R10 PUBLISH_DRAFT_AND_REOBSERVE
→ R11 STACK_HANDOFF
→ R12 HUMAN_OR_REPOSITORY_ADMISSION
```

Stable stop states:

```text
ISSUE_ABSENT
SUBJECT_DRIFT
SHARED_BINDING_STALE
README_STALE_OR_ABSENT
INTERFACE_LOCK_ABSENT
PATH_LEASE_OVERLAP
DAG_CYCLE
UNDECLARED_DEPENDENCY
ASSERTION_MUTATION
PRIVATE_DATA_BOUNDARY_VIOLATION
AUTHORITY_WIDENING
SEMANTIC_CONFLICT_UNPROVEN
EVIDENCE_OVERPROMOTION
REPAIR_BUDGET_EXHAUSTED
INTEGRATION_ADMISSION_OPEN
HUMAN_ADMIT_REQUIRED
```

## System and authority laws

- Evidence, Process Twin, ContextPack, model output, external claims, and telemetry never authorize an action.
- Policy `ALLOW` and Security `ALLOW` are candidate admission only.
- MCP exposes descriptors; it is not authorization, identity, transaction, idempotency, or rollback.
- Connector requests bind exact workflow, policy, security, capability, endpoint reference, payload digest, operation identity, and connector version.
- Unknown completion is observed/reconciled before retry.
- Natural-language changes stop at an untrusted `ChangeSpec` candidate.
- Models cannot own authorization, accounting, idempotency, transition legality, reconciliation, approval, release, or production promotion.
- Private tenant bytes, identities, credentials, mappings, contracts, and live receipts never enter public GitHub.
- Business success requires an admitted baseline, measurement, counterfactual/attribution method, costs, external-factor treatment, and Human review. Tool success is not ROI.

## Real-problem closure law

A real enterprise problem is closed only when its loop is evidenced end to end:

```text
source authorization
→ evidence/data readiness
→ process/context model
→ governed workflow and authority
→ durable execution and reconciliation
→ release/rollback
→ observed outcome and cost
→ Human/organizational acceptance
→ reusable productization
```

Today the repository closes only selected **synthetic control-plane subloops** through an in-memory connector. Durable execution, release, outcome, organization, private/live provider, and productization loops remain open. Never describe a source article or synthetic analogue as an enterprise closure.

## Git Town and molecular Stack law

Canonical procedure: `skills/git-town-stacked-pr-worker/SKILL.md` at the bound shared subject. Repository atoms are:

```text
C  contract/schema/interface lock
K  deterministic core
A  adapter/provider integration
E  eval/mutation/fault controls
X  explicit convergence/E2E
D  documentation/receipt/handoff
```

Rules:

- one atom = one cohesive purpose, writer, lease, review surface, and oracle;
- serial edges consume exact parent subjects;
- path-disjoint work is sibling work, not an artificial long chain;
- only `X` may converge multiple admitted subjects;
- `E` cannot repair or weaken the implementation/assertions under test;
- `D` cannot promote evidence or change product behavior;
- Git Town sync/restack is not correctness, merge, or production evidence;
- no automatic semantic conflict resolution, force push, ship, merge, release, or promotion.

The complete actual and planned index is `docs/governance/stack-index.md`.

## Current implementation frontier

After Gate #92 admission, the shortest path toward a real synthetic FDE delivery loop is:

```text
I31-K/E/D  executable Eval harness
→ I10-C/K/E/D  durable simulator + Runtime Receipts
→ I17-C/K/E/X/D  replay / Shadow / canary / rollback controller
→ I11-C/K/E/D  Outcome Ledger
→ I18 / I42  Human Workbench + engagement gates
→ I21-C/K/A/E/X/D  synthetic AP capstone
```

Parallel prerequisites include I15-K/E/D registries, I25-K/E/D discovery/baseline, I26-K/E/D ingestion, I29 persistence, I32 observability, and the live/private route #13/#33/#44/#46.

## Verification order

```text
syntax / Markdown structure
→ exact Issue/PR/branch/tree readback
→ schema/type/static checks
→ unit/contract tests
→ integration/replay
→ mutation/fault controls
→ no-vendoring/private-data/residue checks
→ Shadow Architecture checkpoint
→ provider-specific receipts
→ Human/repository admission
```

For product-capable local trees:

```bash
npm test
npm run check
npm run compile:demo
```

A green result is exact-tree and exact-environment specific. It becomes stale after any material source, configuration, model, connector, policy, workflow, or environment change.

## Completion report

Every handoff reports:

- Issue, atom, Gate, exact base/head/tree, and parent edge;
- changed paths and path lease;
- consumed/emitted contracts;
- commands, exits, tests, mutations, and failed-tool attempts;
- current evidence class and ceiling;
- Tech Lead dependency decision;
- Shadow Architecture finding/intervention;
- unresolved source, live-substrate, organizational, and business gaps;
- cleanup and rollback identity;
- Git Town, Worktrees, Forgejo, Actions, merge, release, production, commercial, and outcome states separately;
- Human-owned next decision.

Never report `PASS` for `ABSENT`, `NOT_EXERCISED`, `SOURCE_REPORTED`, `SYNTHETIC_ANALOG_ONLY`, `INTEGRATION_ADMISSION_OPEN`, or `HUMAN_ADMIT_REQUIRED`.
