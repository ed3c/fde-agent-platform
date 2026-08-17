# Stage B3 — WorkflowSpec / ChangeSpec compiler receipt

## Disposition

```text
STAGE_B3_SYNTHETIC_IMPLEMENTATION_COMPLETE
INTEGRATION_ADMISSION_OPEN
```

This receipt records static contracts, deterministic compilation, and mutation sensitivity. It does not authorize merge, connector execution, release, or production.

## Exact prerequisite

```text
PR #73
agent/x72-context-policy-eval
e35f6745146e206046326bdbeb8b7ed92753c4a5
tree 9e412651c3b1ea8acf50a0d0d81306c426439e9f
```

The exact shared procedural authority remains:

```text
ed3c/skills-shared@ec5a240fa3cbafda2c6a8bce0ae12143e0992f80
```

No Skill body is stored in this repository.

## Molecular Stack

```text
PR #77 · I28-C
agent/i28-c-workflow-change-contract
d0d7d2cef586cbc8ac70a4dd14f58dd64b6d9bcd
tree f46bf86e78f0e615324e6c87a7385d8dbd11fdc6

└─ PR #78 · I28-K
   agent/i28-k-workflow-compiler
   06a046794a9045f05047885e01badf50815e1dcb
   tree 8c93f8decc7780b05aaa48a8a03e71a683f1f899

   └─ PR #79 · I28-E
      agent/i28-e-workflow-controls
      edd9e5dfd0962c9162a08180da8d6106094eb862
      tree c2b15e812ac9fbdb22952b0f3c802799a44882ac

      └─ I28-D
         agent/i28-d-workflow-handoff
         exact head/tree are read from its Draft PR metadata
```

## Closed synthetic invariants

### WorkflowSpec

- one initial state and explicit success/failure terminal states;
- no transition from a terminal state or to an unknown state;
- no undeclared or unbounded cycle;
- Connector transitions bind exact action, operation, capability, policy, tool ID, Context, Process Twin, DigitalEmployee ceiling, and deterministic PolicyDecision;
- side effects require operation identity, idempotency, audit/postcondition evidence, compensation, rollback, and unknown-completion reconciliation;
- model responsibilities are limited to classify, extract, summarize, and recommend;
- model output cannot own authorization, idempotency, retry, reconciliation, approval, accounting, transition legality, release, or promotion;
- blocking Eval and policy subjects are exact and cannot diverge between source and release gate;
- `execution_authority: NONE` and `production_admission: HUMAN_ADMIT_REQUIRED` are permanent.

### ChangeSpec

- natural-language requests create only `CANDIDATE` subjects;
- requester identity and verification state remain explicit;
- unresolved questions and contradictions block `VALIDATED` state;
- policy-impacting changes require Human approval;
- shadow, bounded canary, Human takeover, rollback, blast radius, exact source digests, and required tests are explicit;
- protected source/authority paths, prohibited action classes, arbitrary code, and cross-tenant widening are refused.

## Compiler verification

The compiler re-executes the upstream deterministic oracles rather than trusting their prose or receipts:

```text
Process Twin self-digest and contradiction gate
ContextPack shape, self-digest, READY and tenant gate
DigitalEmployee compiled state and authority ceiling
ConnectorCapability exact version/action/operation gate
PolicyRequest exact subject gate
PolicyDecision deterministic replay through Policy Gateway
Workflow static validator
```

The first module split produced an invalid re-export. The test runner rejected it before publication; the aggregator was repaired and all tests rerun.

## Local synthetic evidence

```text
node --test test/workflow-contracts.test.mjs \
  test/workflow-core.test.mjs \
  test/workflow-mutations.test.mjs

16 tests passed
0 failed
```

```text
node scripts/check-workflow-compiler.mjs
PASS
workflow_digest = e0a9bd6cef903cf8c690cba933e40013e19869c1b76947682ddc015053aa5a3e
mutations_killed = RETRY_WITHOUT_IDEMPOTENCY, COMPENSATION_REQUIRED, UNBOUNDED_CYCLE, MODEL_HARD_CONTROL_FORBIDDEN
execution_authority = NONE
production_admission = HUMAN_ADMIT_REQUIRED
```

Additional tests reject Process Twin/Context/Policy/capability/tool/evidence drift, stale decisions, action widening, digest tampering, unresolved ChangeSpecs, missing approvals, and arbitrary code.

## Shadow Architect checkpoints

```text
ARCHITECTURE_CHOICE     CONTINUE_WITH_WARNINGS_L1
FIRST_VERTICAL_SLICE    CONTINUE_WITH_WARNINGS_L1
FIRST_GREEN             CONTINUE_WITH_WARNINGS_L1
STAGE_HANDOFF           CONTINUE_WITH_WARNINGS_L1
```

No L3 blocker remains inside the synthetic static-compiler scope.

## Evidence boundary

Observed or locally exercised:

- GitHub Issues, branches, commits, trees, Draft PRs, parent ancestry, and changed paths;
- deterministic static contracts, compiler behavior, exact output digest, and planted mutations;
- read-only Shadow Architecture review.

Not exercised or admitted:

- full repository regression on one admitted integration tree;
- Git Town executable, sync, restack, or linked Worktrees;
- local Forgejo and local-main-first delivery;
- exact-head GitHub Actions;
- live identity, credential, MCP, Connector, model, database, or durable-runtime provider;
- replay, Shadow traffic, canary, release, customer acceptance, ROI, commercial settlement, compliance, merge, or production.

These remain `ABSENT`, `NOT_EXERCISED`, or `HUMAN_ADMIT_REQUIRED`.

## Downstream frontier

After repository/Human admission of the exact Stage B3 subject:

```text
#28 WorkflowSpec / ChangeSpec
├─ #30 Connector SDK and MCP gateway boundary
├─ #10 deterministic durable-runtime simulator
├─ #17 release-safety / Change Controller
├─ #39 typed API / SDK / CLI
└─ #21 synthetic AP exception capstone
```

No downstream issue may report Stage B3 as integrated if any parent subject drifts.

## Rollback

Close the I28-D Draft PR and delete only the D branch. Preserve all exact C/K/E subjects for review. Do not rewrite shared history or silently substitute a newer parent.
