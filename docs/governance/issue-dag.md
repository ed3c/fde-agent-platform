# FDE Issue dependency DAG

This file owns repository-specific dependency classification. Issue bodies own detailed requirements. Exact Git/PR state and runtime receipts own observed facts.

Canonical procedure authority:

```text
ed3c/skills-shared@ec5a240fa3cbafda2c6a8bce0ae12143e0992f80
```

## Edge types

- **start edge** — enough stable interface exists to begin a child contract atom.
- **completion edge** — child cannot claim its integration complete until the parent implementation and Gate are admitted.
- **integration edge** — path-disjoint work may proceed but must meet at an explicit `X` convergence node.
- **review edge** — read-only monitor/evidence relation; never grants a writer lease.
- **live edge** — requires local/private/provider evidence unavailable to a GitHub-only runtime.
- **Human edge** — merge, release, production, legal, financial or organizational admission.

A branch name or a green leaf does not satisfy a completion edge.

## Actual implementation DAG through Stage B4

```mermaid
flowchart TD
  F["Foundation PR #5→#6→#7→#24→#48"]
  F --> R["I15-C PR #49"]
  F --> O["I25-C PR #50"]
  F --> ING["I26-C PR #51"]
  F --> EV["I31-C PR #52"]
  F --> SRC["I23-D/E PR #53"]

  ING --> D["I45 C/K/E PR #55→#56→#57"]
  R --> X58["X58 PR #59"]
  D --> X58
  X58 --> P["I8 C/K/E/D PR #60→#61→#62→#63"]

  P --> C["I27 C/K/E PR #66→#67→#68"]
  P --> Y["I9 C/K/E PR #69→#70→#71"]
  C --> X72["X72 PR #73"]
  Y --> X72
  R --> X72
  EV --> X72

  X72 --> W["I28 C/K/E/D PR #77→#78→#79→#80"]
  W --> S["I22 C/K/E/D PR #83→#84→#85→#86"]
  S --> G["I30 C/K/A/E/D PR #87→#88→#89→#90→#91"]
```

Admission remains open at #54, #64, #75, #81 and #92.

## Semantic product DAG

```mermaid
flowchart TD
  subgraph GOV[Foundation and delivery]
    I2["#2 governance"] --> I3["#3 public contracts"] --> I4["#4 compiler"] --> I14["#14 shared binding"] --> I47["#47 operating map"]
    I14 --> I13["#13 Git Town / Dual Forge live lane"]
    I47 --> I94["#94 current integration map"]
    I93["#93 Shadow review"] -. review .-> I94
  end

  subgraph BUS[Business and engagement]
    I47 --> I25["#25 opportunity / baseline"]
    I47 --> I26["#26 ingestion"]
    I15["#15 registries"] --> I18["#18 Workbench"]
    I25 --> I42["#42 engagement lifecycle"]
    I26 --> I42
    I18 --> I42
    I20["#20 operations"] --> I42
  end

  subgraph DAT[Evidence and data]
    I26 --> I45["#45 readiness"] --> I8["#8 Process Twin"] --> I27["#27 Context"]
    I8 --> I29["#29 persistence"]
  end

  subgraph AUT[Composition and authority]
    I14 --> I15
    I8 --> I9["#9 Policy"]
    I27 --> I28["#28 Workflow/Change"]
    I9 --> I28
    I15 --> I28
    I9 --> I22["#22 Security"]
    I28 --> I22
    I22 --> I30["#30 Connector/MCP"]
    I28 --> I30
    I18 --> I44["#44 identity/approval"]
  end

  subgraph RUN[Eval, runtime, release]
    I47 --> I31["#31 Eval platform"]
    I28 --> I10["#10 durable simulator"]
    I22 --> I10
    I30 --> I10
    I31 --> I10
    I10 --> I17["#17 release controller"]
    I30 --> I17
    I31 --> I17
    I32["#32 observability"] --> I17
    I17 --> I40["#40 durable adapter"]
    I29 --> I40
    I30 --> I40
    I40 --> I41["#41 production readiness"]
  end

  subgraph OUT[Outcome, operations and learning]
    I10 --> I11["#11 Outcome Ledger"]
    I10 --> I32
    I29 --> I32
    I31 --> I32
    I11 --> I32
    I11 --> I20
    I18 --> I20
    I20 --> I36["#36 commercial"]
    I25 --> I36
    I8 --> I16["#16 expert traces"]
    I15 --> I16
    I16 --> I19["#19 productization"]
    I10 --> I19
    I11 --> I19
    I12["#12 model release"] --> I35["#35 improvement"]
    I19 --> I35
    I31 --> I35
    I32 --> I35
  end

  subgraph LIVE[Product and live admission]
    I15 --> I38["#38 Role Packs"]
    I16 --> I38
    I28 --> I38
    I31 --> I38
    I15 --> I39["#39 API/SDK"]
    I28 --> I39
    I30 --> I39
    I31 --> I39
    I13 --> I33["#33 private Overlay"]
    I15 --> I33
    I22 --> I33
    I29 --> I33
    I12 --> I34["#34 deployment profiles"]
    I30 --> I34
    I33 --> I34
    I34 --> I40
    I41 --> I43["#43 assurance"]
    I32 --> I43
    I34 --> I44
    I13 --> I46["#46 live canary"]
    I17 --> I46
    I30 --> I46
    I33 --> I46
    I40 --> I46
    I41 --> I46
    I44 --> I46
    I42 --> I21["#21 synthetic AP capstone"]
    I17 --> I21
    I11 --> I21
    I31 --> I21
    I32 --> I21
    I33 --> I21
  end

  I11 --> I12
  I14 --> I23["#23 external evidence"]
```

## Current Issue status overlay

| Issue group | Current state | Admission/completion note |
|---|---|---|
| #2 #3 #4 #14 #47 | `IMPLEMENTED_DRAFT` | Foundation PRs remain open/unmerged. #94 repairs stale routing docs. |
| #15 #25 #26 #31 | `PARTIAL_CONTRACT` | C atom exists; core/Eval/handoff atoms remain. Gate #54 open. |
| #23 | `PARTIAL_CONTRACT` / external evidence lane | ledger exists; independent artifacts/reproduction absent. |
| #45 | `SYNTHETIC_CLOSED` | C/K/E exist; Gate #64 and live data/persistence remain. |
| #8 | `SYNTHETIC_CLOSED` | C/K/E/D exist; Gate #64 and real Process Owner evidence remain. |
| #27 #9 | `SYNTHETIC_CLOSED` | C/K/E exist; Gate #75 open. |
| #28 | `SYNTHETIC_CLOSED` | C/K/E/D exist; Gate #81 open. |
| #22 #30 | `SYNTHETIC_CLOSED` | Security C/K/E/D and Connector C/K/A/E/D exist; Gate #92 open. |
| #10–#12 #16–#21 #29 #32–#44 #46 | `OPEN_DESIGN` or `BLOCKED_LIVE_SUBSTRATE` | no complete implementation Stack. |
| #13 #33 #44 #46 live portions | `BLOCKED_LIVE_SUBSTRATE` | requires local/private/provider authorization and receipts. |
| #54 #64 #75 #81 #92 | `INTEGRATION_ADMISSION_OPEN` | must not be bypassed by downstream prose. |
| #93 | read-only review | closes after #94 documentation handoff. |
| #94 | documentation implementation | docs-only branch from Stage B4 terminal. |

## Start vs completion dependencies

| Child | May start contract work when | Cannot complete until |
|---|---|---|
| #10 Durable simulator | exact Workflow/Security/Connector/Eval contracts are locked | Gate #92 admitted, executable #31 K/E exists, full convergence tests pass |
| #17 Release Controller | ChangeSpec/WorkflowSpec and runtime/release interfaces are locked | #10, #31, #32 and Gate #92 admitted; replay/Shadow/canary faults pass |
| #11 Outcome Ledger | runtime receipt contract is locked | #10 executable receipts and baseline/measurement sources exist |
| #18 Workbench | Registry/process/approval interfaces are locked | identity, engagement/release/outcome subjects are integrated |
| #21 AP capstone | domain contracts and fixtures may be designed | #10/#11/#17/#18/#31/#32 plus private-reference boundaries converge |
| #29 Persistence | Process Twin/Registry/Security contracts are locked | migrations, tenancy, restore and integration Evals pass |
| #32 Observability | exact receipt identities are locked | persistence/runtime/outcome/Eval subjects exist and correlation tests pass |
| #38 Role Packs | Registry/Workflow common contracts are locked | expert traces, Eval packs and catalog lifecycle converge |
| #39 API/SDK | read/validate/compile contracts are locked | Registry/Workflow/Connector/Eval integration and authority separation pass |
| #46 Live canary | public/private/live contracts are designed | local forge, private resolver, identity, runtime, resilience and Human authorization all exist |

## Admission Gate DAG

```text
#54 Contract Foundation
  ↓
#64 Data Readiness + Process Twin
  ↓
#75 Context + Policy convergence
  ↓
#81 WorkflowSpec / ChangeSpec
  ↓
#92 Security + Connector/MCP
  ↓
future #10/#17/#21 gates
```

A later Draft Stack may exist before an earlier Gate closes, but its evidence remains provisional and exact-parent-bound.

## Convergence nodes

| Node | Required exact convergence |
|---|---|
| #28 | Process Twin + Context + Registry + Policy/Capability + Eval contracts |
| #30 | Workflow action contract + Policy + Security + ConnectorCapability |
| #10 | Workflow semantics + Security/Connector result semantics + executable Eval contract |
| #17 | runtime + ChangeSpec + Security/Connector + Eval + Observability |
| #32 | runtime + persistence + security + Eval + Outcome identities |
| #40 | simulator + persistence + connector + observability + deployment profile |
| #42 | business, evidence, target design, release, operations and Eval gates |
| #21 | full synthetic business/evidence/design/runtime/outcome/Workbench slice |
| #46 | public/private Git, identity, connector, runtime, resilience and authorization evidence |

Convergence never auto-resolves semantic conflict. One writer binds admitted exact subjects and re-runs all required tests/mutations.

## Parallelizable next atoms

After review of exact parent contracts, these are path-disjoint candidates:

```text
I31-K/E/D  executable Eval plane
I15-K/E/D  Registry core
I25-K/E/D  discovery/baseline core
I26-K/E/D  ingestion core
I29-C       persistence contract
```

`I10-C` may be prepared against locked contracts, but `I10-K/E/D` completion remains blocked on executable I31 and Gate #92 admission.

## Review-only and source lanes

- Shadow Architecture issues are read-only and never write Builder paths.
- #23 records source evidence; it cannot mutate product code or promote interview claims.
- #43 maps assurance evidence; it cannot certify compliance.
- Human/legal/financial/security owners retain waivers, settlement, merge, release and production authority.

## Cycle prevention

- #45 semantic/readiness contracts remain upstream of #8.
- #29 persistence and #32 observability are downstream adapters, not prerequisites for defining readiness semantics.
- #31 common Eval contract may start early, but module-specific Evals consume their module subjects.
- #10 runtime consumes Connector results; #30 does not consume #10.
- #17 release consumes runtime; runtime must not depend on release promotion.

Any new cycle is `DAG_CYCLE` and blocks branch allocation until the interface or edge type is corrected.
