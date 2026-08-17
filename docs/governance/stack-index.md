# Git Town Stacked PR and molecular implementation index

This is the consumer-owned traceability index. Canonical Git Town and Tech Lead procedures remain at:

```text
ed3c/skills-shared@ec5a240fa3cbafda2c6a8bce0ae12143e0992f80
```

The branch graph below is a logical and GitHub-observed Stack. It does **not** prove a local Git Town executable, linked Worktrees, sync/restack, Forgejo, Actions, merge, release, or production.

## Evidence vocabulary

- `OPEN_DRAFT` — GitHub branch and Draft PR exist; not merged/admitted.
- `IMPLEMENTED_DRAFT` — code/docs and exact synthetic evidence exist on the Draft Stack.
- `PARTIAL_ATOMS` — only part of the required molecular chain exists.
- `GATE_OPEN` — reviewed convergence/admission remains open.
- `PLANNED` — Issue/task shape only.
- `BLOCKED_LIVE_SUBSTRATE` — local/private/provider evidence required.
- `HUMAN_ADMIT_REQUIRED` — merge/release/production/legal/financial transition.

## Molecular atom contract

| Atom | Owns | Required review surface |
|---|---|---|
| `C` | public schema/type/interface/lifecycle lock | fixtures, compatibility/deprecation and contract assertions |
| `K` | deterministic module core | unit/negative tests, bounded resources, nearest README |
| `A` | provider/storage/identity/runtime/transport adapter | exact version, conformance, degraded/failure states |
| `E` | cross-cutting Eval, mutation and fault controls | planted defect killed without weakening tested code |
| `X` | explicit multi-parent convergence/E2E | exact parent SHAs, conflict stop, integration/failure tests |
| `D` | docs, receipt and handoff | State Machine, DAG/data flow, evidence ceiling, rollback |

Default order:

```text
C → K → A? → E? → X? → D?
```

No empty atom is created for format alone. Each atom has one writer, one path lease, one purpose and one oracle.

## Actual PR graph

### Foundation

| PR | Atom / Issue | Branch | Head | Tree | Parent | State |
|---:|---|---|---|---|---|---|
| #5 | #2 governance | `agent/00-bootstrap-control-plane` | `0e3024a7ed0505b2fdb02f42fa5008d98be5ea6c` | `98cc058aafd1c352061bc945292064c9ba2335aa` | `main@709abf4` | `OPEN_DRAFT` |
| #6 | #3 contracts | `agent/01-contracts` | `20a5d29a0428b866b040ae8bad3ee9838c09ffcf` | `c810f999847db102b91f9fec61e98a6316cd696c` | PR #5 | `OPEN_DRAFT` |
| #7 | #4 compiler | `agent/02-role-overlay-compiler` | `f3c926620e3203d9d6dce0b2e81a9ff8c7e7fd22` | `9debfbaee09d6685ed154413a8c1bdbced3d89aa` | PR #6 | `OPEN_DRAFT` |
| #24 | #14 shared binding | `agent/03-shared-procedure-bindings` | `35be041e250236510211a1afaf900306a5d6ef60` | `ad71b0391900ff464ac4f0f4493760798e4aba77` | PR #7 | `OPEN_DRAFT` |
| #48 | #47 operating map | `agent/04-agent-operating-map` | `42500190aefc5c873b441e19b5beef7b4bbf9264` | `9b443d99bd4773b6a9ef70fc8b968ab793486131` | PR #24 | `OPEN_DRAFT · STALE_CURRENT_STATUS` |

### Contract Foundation siblings from PR #48

| PR | Atom | Branch | Head | Tree | State / missing |
|---:|---|---|---|---|---|
| #49 | `I15-C` | `agent/i15-c-registry-contract` | `c2277a79e3934ea81a3484cab92e466683f693d8` | `750e838e8c5e8f37c87a8b869ed0552c4862c8cf` | `PARTIAL_ATOMS`; K/E/D missing |
| #50 | `I25-C` | `agent/i25-c-opportunity-outcome-contract` | `8197a1922ee40a58137ea5a1362ce44811c6667d` | `deff19b8be715e58d9617c0f937ddb55bbc76bff` | `PARTIAL_ATOMS`; K/E/D missing |
| #51 | `I26-C` | `agent/i26-c-ingestion-provenance-contract` | `ccb44e63d535e9c27399731f7ac993d100217a7b` | `47fac65af6aed80347c36adbb8eef1cfb5699ee2` | `PARTIAL_ATOMS`; K/A/E/D missing |
| #52 | `I31-C` | `agent/i31-c-evalpack-receipt-contract` | `74cd7312326e7857daad4942ff4480b6ab506734` | `7859360e6a4601ca846926a998aff637cac74b5c` | `PARTIAL_ATOMS`; K/E/D missing |
| #53 | `I23-D/E` | `agent/i23-d-source-evidence-ledger` | `55741a8d70392647adbcd75e082db4cbda17d139` | `810573324d8aa48625dc650a100d07b1eba04fcd` | source ledger only; artifact/X closure open |

Admission Gate: **#54 open**.

### Stage B1 — Data Readiness and Process Twin

```text
PR #51 I26-C
└─ #55 I45-C
   └─ #56 I45-K
      └─ #57 I45-E
         └─ #59 X58 Registry/Evidence/Readiness convergence
            └─ #60 I8-C
               └─ #61 I8-K
                  └─ #62 I8-E
                     └─ #63 I8-D
```

| PR | Branch | Head | Tree |
|---:|---|---|---|
| #55 | `agent/i45-c-data-readiness-contract` | `e7f3b21e1b66b521ab1f63b26673776bfe1c60d7` | `6f17438b88b7348879a7ee8b428904b5e123bb90` |
| #56 | `agent/i45-k-data-readiness-core` | `5ae021e291331dd342602c78b9d4250231a1d7a0` | `ca55302288fbd934ced7ea3971613e6bca52b995` |
| #57 | `agent/i45-e-data-readiness-controls` | `e42181c1ba3a72e839a0b56ccaf1b4c4e8a0d9e5` | `a9818e5d66f6a64b8e48ca8dac21b3f08a26f356` |
| #59 | `agent/x58-evidence-foundation` | `b7a04fd13f69902072ab27c3bb9a2d958f4c0567` | `23204c02fe6c2743d4ea7ac96ca9fc653231f1b8` |
| #60 | `agent/i8-c-evidence-process-contract` | `1f8499f84df212c6931c4a8065ae3a7e7e9f0912` | `4255efca1545b9feb26cf2f839d53dded4a5b41c` |
| #61 | `agent/i8-k-evidence-process-core` | `825e75e23825b441dfdd22bb461d4a544b588d56` | `56583503e8f14cca5e8fc0df0263a9f3fb2a5208` |
| #62 | `agent/i8-e-evidence-process-controls` | `2977099cc54886e8c3fa258a6e4e0c427f2a0211` | `0f10f6a44c392b55484ba2cefab1f3bffcd50402` |
| #63 | `agent/i8-d-stage-b1-handoff` | `fd1a34753a8d41b0f416be6dca85d364d3420a39` | `c559717549801d907c14695a5af1022d84414e32` |

Disposition: `SYNTHETIC_CLOSED · GATE_OPEN #64`.

### Stage B2 — Context and Policy siblings plus convergence

```text
Stage B1 terminal
├─ #66 I27-C → #67 I27-K → #68 I27-E
└─ #69 I9-C  → #70 I9-K  → #71 I9-E

exact reviewed subjects → #73 X72 convergence
```

| PR | Branch | Head | Tree |
|---:|---|---|---|
| #66 | `agent/i27-c-context-contract` | `5caf334df5a8c51164467858795d49500d5c09c7` | `a68443d6e0c3508ea33a519367ee38836a7309e4` |
| #67 | `agent/i27-k-context-core` | `8c9bb1eee992526c521959b9c77ea1d43e6a13b8` | `7862d21f2e81dff309c24275ed702a4e47abe0d0` |
| #68 | `agent/i27-e-context-controls` | `0b16065e996c958cd59c5a80c52b9f4c3d6bad47` | `af646d4a6ec513eea003141530be7a2fb1b212db` |
| #69 | `agent/i9-c-policy-capability-contract` | `a41a25597511e91af30d1658e89924aba74080cc` | `9e065252506042f7abddcdd440490f872efed4c0` |
| #70 | `agent/i9-k-policy-core` | `ed80741153bf5497c1f13385ac041bb00df061d2` | `dd6d640d2310af9b090f032a9425a369c1426d07` |
| #71 | `agent/i9-e-policy-controls` | `6bf5da8c8ee759633021c078abecd29290bf8bcc` | `dbee65fe957687e0f971fc540192dc886f6ce589` |
| #73 | `agent/x72-context-policy-eval` | `e35f6745146e206046326bdbeb8b7ed92753c4a5` | `9e412651c3b1ea8acf50a0d0d81306c426439e9f` |

No separate I27-D or I9-D PR exists. The handoff is the explicit convergence PR #73.  
Disposition: `SYNTHETIC_CLOSED · GATE_OPEN #75`.

### Stage B3 — WorkflowSpec / ChangeSpec

```text
#73 → #77 I28-C → #78 I28-K → #79 I28-E → #80 I28-D
```

| PR | Branch | Head | Tree |
|---:|---|---|---|
| #77 | `agent/i28-c-workflow-change-contract` | `d0d7d2cef586cbc8ac70a4dd14f58dd64b6d9bcd` | `f46bf86e78f0e615324e6c87a7385d8dbd11fdc6` |
| #78 | `agent/i28-k-workflow-compiler` | `06a046794a9045f05047885e01badf50815e1dcb` | `8c93f8decc7780b05aaa48a8a03e71a683f1f899` |
| #79 | `agent/i28-e-workflow-controls` | `edd9e5dfd0962c9162a08180da8d6106094eb862` | `c2b15e812ac9fbdb22952b0f3c802799a44882ac` |
| #80 | `agent/i28-d-workflow-handoff` | `b63a936fbc0e8bf0e3f9fcb8d3727d9703f2f7dd` | `dbf6ea93874c4680644eeddb7753d2fdb9c1c8fa` |

Disposition: `SYNTHETIC_CLOSED · GATE_OPEN #81`.

### Stage B4 — Security and Connector/MCP

```text
#80
└─ #83 I22-C → #84 I22-K → #85 I22-E → #86 I22-D
   └─ #87 I30-C → #88 I30-K → #89 I30-A → #90 I30-E → #91 I30-D
```

| PR | Branch | Head | Tree |
|---:|---|---|---|
| #83 | `agent/i22-c-security-contract` | `a8d8dc239ce20389e8ceadd35f339d0a2ff76375` | `839cde4b1ed6c19c24179e48cfe3a8c3676f6a2f` |
| #84 | `agent/i22-k-security-core` | `1da01d8d2d91d2cf5ff32ef11c9dda8682503fe3` | `26af4e4446789a44a3e042d92394ce72dbe33296` |
| #85 | `agent/i22-e-security-controls` | `7c325790a21edc4aee188b71d71b7d0af9640433` | `ea6c1870c2f8121e212c12430aa2f50925128593` |
| #86 | `agent/i22-d-security-handoff` | `2318b7e38bb6c58b90bb336e98dafa1f1aa90a6b` | `198adc33e88b5542a78896e19c8acad0aae8865b` |
| #87 | `agent/i30-c-connector-contract` | `e81c751506e8d8c288aa741d2df2b284183fa8e5` | `f24d7964eef22465a864a7aa446ce6b3bbaf689e` |
| #88 | `agent/i30-k-connector-gateway` | `3cdf99a55a02242ff71ae80816850800c79a2e18` | `2dd4b7fa854bd82106200a47ed35ea14773ed115` |
| #89 | `agent/i30-a-synthetic-connector-adapter` | `61ce9b510a60d5034f8cd14d670da88425cb7fd3` | `53d378204d816026d55ec364b299d5c10f34f0da` |
| #90 | `agent/i30-e-connector-controls` | `4af988dbef6e940049c52b2936fc6fc214742a03` | `7500de44b98f3c3830d72c21f7ca821324d650f0` |
| #91 | `agent/i30-d-connector-handoff` | `b24444b7910197c20ff53d12c983a052c82738ab` | `461dbe49fa15f732ddc2d3a7868a6a05ccc12a5c` |

Disposition: `SYNTHETIC_CLOSED · GATE_OPEN #92`.

## Documentation reconciliation atom

```text
Issue #94
branch agent/i94-d-current-integration-map
parent Stage B4 terminal b24444b7910197c20ff53d12c983a052c82738ab
Shadow monitor #93
atom I94-D
```

This atom is docs-only and must not alter product code, schemas, fixtures, tests or checkers. Its Draft PR and exact terminal are recorded in the publication Gate after GitHub creates the PR.

## Missing atoms by issue

| Issue | Existing | Required next |
|---:|---|---|
| #15 | C | K → E → D |
| #25 | C | K → E → D |
| #26 | C | K → A? → E → D |
| #31 | C | K → E → D |
| #23 | D/E ledger | artifact acquisition → X reproduction → D handoff |
| #45 | C/K/E | D + Gate admission |
| #27 | C/K/E | convergence/Gate admission; provider Evals later |
| #9 | C/K/E | convergence/Gate admission; identity adapter later |
| #10 | none | C → K → E → D |
| #17 | none | C → K → E → X → D |
| #11 | none | C → K → E → D |
| #18 | none | C → K → E → X → D |
| #21 | none | C → K → A → E → X → D |
| #29 | none | C → K → A → E → D |
| #32 | none | C → K → A → E → D |
| #33 | none | C → K/A → E → D, private/live |
| #38 | none | C → K(pack siblings) → E → X → D |
| #40 | none | C → A → E → X → D |
| #41 | none | C → K → E → X → D |
| #44 | none | C → K → A → E → D |
| #46 | none | C → A → E → X → D, private/live |

## Next molecular frontier

### Critical path

```text
Gate #92
→ I31-K → I31-E → I31-D
→ I10-C → I10-K → I10-E → I10-D
→ I17-C → I17-K → I17-E → I17-X → I17-D
→ I11-C → I11-K → I11-E → I11-D
→ I18 / I42
→ I21-C → I21-K → I21-A → I21-E → I21-X → I21-D
```

### Parallel path-disjoint work

```text
I15-K/E/D
I25-K/E/D
I26-K/E/D
I29-C
I32-C
I23 artifact acquisition (read-only source lane)
```

`I10-C` may start from locked Stage B4 and I31-C interfaces, but I10 integration cannot close until I31-K/E and Gate #92 are admitted.

## Git Town / review law

- each serial PR targets its exact parent branch;
- siblings remain independent until an explicit `X` convergence;
- parent drift invalidates every downstream receipt;
- Git Town sync/restack proves synchronization only;
- no automatic semantic conflict resolution or force update;
- a green leaf does not make the integrated Stack green;
- every PR records Issue/atom, exact base/head/tree, paths, commands, mutations, evidence ceiling, failed tools, rollback and Human-owned transition;
- live/private work remains in #13/#33/#44/#46 and cannot be proven by the GitHub connector alone.
