# FDE real-problem closure matrix

This document separates source claims, synthetic repository evidence, live/provider evidence, and business outcomes.

## Closure rule

A real enterprise problem is closed only when the relevant loop is evidenced:

```text
authorized source
→ ready data
→ approved process/context
→ governed workflow and authority
→ durable/reversible execution
→ replay/Shadow/canary/rollback
→ observed outcome and cost
→ Human/organizational acceptance
→ reusable product asset
```

The repository currently closes selected synthetic control-plane subloops. It does not close the full FDE outcome-delivery loop.

## Status vocabulary

- `CLOSED_SYNTHETIC` — exact synthetic fixture, core and mutations close the stated control problem on open Draft PRs.
- `PARTIAL_SYNTHETIC` — some deterministic stages exist; required stages remain absent.
- `PARTIAL_CONTRACT` — interface or evidence contract only.
- `OPEN_DESIGN` — Issue exists; implementation Stack is incomplete.
- `BLOCKED_LIVE_SUBSTRATE` — private/local/provider evidence is required.
- `SOURCE_REPORTED` — interview/presentation statement only.
- `PRIMARY_SOURCE_CONFIRMED` — cited source located, not reproduced.
- `SYNTHETIC_ANALOG_ONLY` — repository fixture resembles but does not reproduce the source case.
- `HUMAN_ADMIT_REQUIRED` — repository/business/security/legal/production owner transition.

## Problem matrix

| Source/PDF-derived problem | Repository route | Verdict | Remaining closure |
|---|---|---|---|
| AI is added to a broken Human workflow. | #45 Data Readiness, #8 Process Twin, #27 Context, #28 Workflow | `PARTIAL_SYNTHETIC` | real audit, Process Owner approval, runtime, outcome and adoption: #26 #18 #42 #10 #11 |
| SOP contains only the golden path. | separate documented/observed/system/target views; contradictions | `CLOSED_SYNTHETIC` | real source coverage and Human adjudication: #26 #18 |
| Informal exception routing and same-name people are hidden. | Source/claim/entity contracts | `PARTIAL_CONTRACT` | ingestion/disambiguation core and private evidence: #26 #33 |
| Dirty or semantically inconsistent data poisons decisions. | semantic metric, quality profile, readiness evaluator | `CLOSED_SYNTHETIC` | live lineage, persistence, owner and drift observation: #29 #32 |
| Enterprise processes include waits and controlled loops, not one DAG. | Process Twin + bounded controlled cycles | `CLOSED_SYNTHETIC` | durable event/state semantics: #10 #40 |
| Long documents produce noisy context. | minimal contradiction-preserving ContextPack | `CLOSED_SYNTHETIC` | real retrieval recall/latency and corpus completeness: #27/#31 extensions |
| Model output is verbose, unstable or hallucinatory. | closed contracts, deterministic hard controls, bounded model duties | `PARTIAL_SYNTHETIC` | executable model registry/routing/regression: #12 #31 |
| Workflow must divide autonomous, HITL and Human-only work. | WorkflowSpec executor/action/approval classes | `CLOSED_SYNTHETIC` | Workbench, identity, release and business validation: #18 #44 #17 #42 |
| Natural-language change request modifies production unsafely. | ChangeSpec candidate + protected paths + tests/approval/canary/rollback fields | `PARTIAL_SYNTHETIC` | executable replay/Shadow/canary and durable apply: #17 #10 #40 |
| Model or MCP gains ambient authority. | Policy, Security grant, endpoint allowlist, descriptor-only MCP | `CLOSED_SYNTHETIC` | live identity/grant issuer and real MCP/provider: #44 #46 |
| Connector timeout occurs after commit. | stable operation identity + `UNKNOWN_COMPLETION` + observation | `CLOSED_SYNTHETIC` | durable runtime and live provider semantics: #10 #40 #46 |
| Duplicate delivery duplicates an effect. | idempotent in-memory adapter | `CLOSED_SYNTHETIC` | provider-specific idempotency and irreversible-action tests: #41 #46 |
| Partial result or schema drift is promoted to success. | explicit ConnectorResult states and mutations | `CLOSED_SYNTHETIC` | provider schemas/rate limits/recovery: #30 adapters #41 #46 |
| Desired workflow state drifts from the System of Record. | exact postcondition observer and connector reconciliation primitive | `PARTIAL_SYNTHETIC` | persistent desired state, drift SLO, durable recovery: #10 #29 #32 #40 |
| Agent must overlay an existing System of Record. | typed Connector/Capability layer | `PARTIAL_SYNTHETIC` | private mappings, authorized sandbox and live identity: #33 #44 #46 |
| Model upgrade causes workflow behavior drift. | Eval contract and exact-subject invalidation | `PARTIAL_CONTRACT` | model registry, dual-run, cost/quality gate and rollback: #12 #31 |
| Expert behavior should be mined from traces, not anecdotes. | external claim ledger + planned trace store | `OPEN_DESIGN` | event schema, deduplication, causal outcome link and Skill lifecycle: #16 #23 |
| Bad cases should improve the system without online self-mutation. | candidate-only ChangeSpec + planned repair loop | `OPEN_DESIGN` | trace curation, Human adjudication, offline Eval and release: #19 #35 #32 |
| FDE scaling is limited by document toil and communication. | ingestion contracts + process/workflow compiler | `PARTIAL_CONTRACT` | real ingestion, Workbench, engagement receipts and capacity ledger: #26 #18 #20 #42 |
| FDE scaling is limited by politics and adoption. | planned Workbench, engagement lifecycle and managed operations | `OPEN_DESIGN` | cross-department decisions, training, override/adoption metrics: #18 #20 #37 #42 |
| Organization must retain Agent/Skill assets after employee departure. | Registry/private-reference architecture | `OPEN_DESIGN` | ownership transfer, private resolver, identity lifecycle and productization: #15 #33 #37 #19 |
| Delivery should be measured by outcomes, not features or human-days. | Opportunity/Outcome Charter contracts | `PARTIAL_CONTRACT` | Outcome Ledger, real measurement, attribution, cost and settlement: #11 #25 #36 |
| 5–10% point ROI vs 25–75% transformation ROI. | external evidence ledger | `SOURCE_REPORTED` | sample, formula, cost scope, period and controls: #23 #11 |
| 260-step support flow covers 95% and beats Humans. | source ledger + planned capstone | `SOURCE_REPORTED` / `SYNTHETIC_ANALOG_ONLY` | workflow artifact, denominator, error/override and comparison protocol: #23 #21 |
| Top operator performs more than 10,000 actions in 90 days. | source ledger | `SOURCE_REPORTED` | logs, cohort, deduplication, outcome link and platform-policy review: #23 #16 |
| Regional sales pilot moved from lagging to leading. | source ledger + discovery route | `SOURCE_REPORTED` | baseline, control cohort, margin, adoption and confounders: #23 #25 #11 |
| 3M revenue / 12M input reached quarter break-even. | source ledger + commercial route | `SOURCE_REPORTED` | accounting scope, recognition, allocation and audited ledger: #23 #11 #36 |
| PostgreSQL graph plus SFT/RL improves traversal. | synthetic Process Twin; planned persistence/learning | `SOURCE_REPORTED` / `SYNTHETIC_ANALOG_ONLY` | database schema/runtime, dataset, reward, holdout and model comparison: #23 #29 #35 |
| Most GenAI pilots fail to reach production. | source ledger | `PRIMARY_SOURCE_CONFIRMED` | current replication, definitions, sample limits and denominator: #23 |
| `4+X` standard roles plus private enterprise context. | RolePack/TenantOverlay compiler | `PARTIAL_SYNTHETIC` | Role Pack catalog, private resolver, domain Evals and reuse metrics: #38 #33 #19 |
| Progressive grayscale onboarding is required. | Change/Workflow fields; planned Release Controller | `OPEN_DESIGN` | executable risk-weighted progression and kill-switch tests: #17 #10 #41 |
| Model versions must be pinned and regression-tested. | exact-subject principle + Eval contract | `OPEN_DESIGN` | model registry/router, shadow divergence, cost review and rollback: #12 #31 |
| Git Town and Dual Forge must prove public/private delivery. | logical Stack and governance contracts | `BLOCKED_LIVE_SUBSTRATE` | local executable, Worktrees, Forgejo, sync/restack and local-main receipt: #13 |
| Customer bytes remain outside public GitHub. | no-vendoring/private-boundary controls | `PARTIAL_SYNTHETIC` / `BLOCKED_LIVE_SUBSTRATE` | actual private resolver, storage, authorization and cleanup: #33 #29 #44 |
| Production resilience and assurance are required. | planned readiness/assurance routes | `OPEN_DESIGN` | load/chaos/restore/DR and external review: #41 #43 |

## Loop-level verdict

| Loop | Verdict |
|---|---|
| Data semantics, Process Twin and Context | `PARTIAL_SYNTHETIC` to `CLOSED_SYNTHETIC` |
| Static workflow, authority and Connector safety | `CLOSED_SYNTHETIC` |
| Durable execution and release | `OPEN_DESIGN` |
| Outcome and commercial settlement | `OPEN_DESIGN` |
| Human FDE and organizational adoption | `OPEN_DESIGN` |
| Learning and productization | `OPEN_DESIGN` |
| Private/live provider | `BLOCKED_LIVE_SUBSTRATE` |
| Git/forge runtime | `BLOCKED_LIVE_SUBSTRATE` |
| Full FDE outcome-delivery loop | **`NOT_CLOSED`** |

## Next closure sequence

```text
Gate #92 admission
→ I31-K/E/D executable Eval plane
→ I10-C/K/E/D durable simulator and Runtime Receipts
→ I17-C/K/E/X/D replay / Shadow / canary / rollback
→ I11-C/K/E/D Outcome Ledger
→ I18 / I42 Workbench and engagement lifecycle
→ I21-C/K/A/E/X/D synthetic AP capstone
```

Parallel requirements:

```text
I15-K/E/D Registry
I25-K/E/D baseline/discovery
I26-K/E/D ingestion
I29-C/K/A/E/D persistence
I32-C/K/A/E/D observability
#13 → #33 → #44 → #46 private/live lane
```

Source claims remain governed by Issue #23 and its external evidence ledger. They never inherit a repository `PASS` from a synthetic analogue.
