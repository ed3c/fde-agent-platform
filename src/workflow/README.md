# Workflow and change compilation plane

Issue: [#28](https://github.com/ed3c/fde-agent-platform/issues/28)  
Shadow monitor: [#76](https://github.com/ed3c/fde-agent-platform/issues/76)

This directory compiles already-governed enterprise subjects into **static candidates**. It never executes tools, connectors, generated code, releases, or production changes.

## Local state machines

```text
WorkflowSpec
DRAFT
→ VALIDATED
→ COMPILED
├─ REFUSED
└─ HUMAN_ADMIT_REQUIRED before any release/runtime lane
```

```text
ChangeSpec
REQUESTED
→ CANDIDATE
→ VALIDATED / REFUSED
→ REPLAY / SHADOW / CANARY are downstream issue #17
```

Natural-language input can create only an untrusted `CANDIDATE` with `execution_authority: NONE`.

## Inputs

- exact bitemporal `ProcessTwin` subject;
- provenance-bound `ContextPack` in `READY` state;
- compiled `DigitalEmployeeSpec` and its authority ceiling;
- exact `PolicyRequest` + deterministic `PolicyDecision` pairs;
- active typed `ConnectorCapability` subjects;
- blocking Eval Pack subjects;
- a bounded target-state plan containing state, transition, timeout, retry, compensation, reconciliation, rollback, and Human escalation semantics.

## Outputs

- normalized `WorkflowSpec` with an exact SHA-256 identity;
- untrusted `ChangeSpec` candidate with exact source digests;
- stable refusal/error codes and mutation receipts;
- no runtime or production authority.

## Hard laws

- A Process Twin, ContextPack, model response, or policy decision is evidence/candidate input, not execution authority.
- Connector transitions cannot exceed the compiled Digital Employee, evaluated PolicyRequest, PolicyDecision, or ConnectorCapability ceilings.
- Models may classify, extract, summarize, or recommend. They cannot authorize, reconcile, own idempotency, approve, retry, promote, or decide transition legality.
- Side-effect retries require stable operation identity and idempotency.
- Reversible side effects require compensation, independent postcondition observation, rollback, and unknown-completion reconciliation.
- Cycles require explicit transition membership, iteration bounds, timeout, and exit condition.
- Arbitrary Python, shell, dynamic imports, or executable text are rejected.
- `execution_authority` remains `NONE`; `production_admission` remains `HUMAN_ADMIT_REQUIRED`.

## Exact molecular Stack

```text
PR #73 · exact Stage B2 parent convergence
agent/x72-context-policy-eval
e35f6745146e206046326bdbeb8b7ed92753c4a5

└─ PR #77 · I28-C contracts and validators
   agent/i28-c-workflow-change-contract
   d0d7d2cef586cbc8ac70a4dd14f58dd64b6d9bcd
   tree f46bf86e78f0e615324e6c87a7385d8dbd11fdc6

   └─ PR #78 · I28-K deterministic compiler
      agent/i28-k-workflow-compiler
      06a046794a9045f05047885e01badf50815e1dcb
      tree 8c93f8decc7780b05aaa48a8a03e71a683f1f899

      └─ PR #79 · I28-E mutation controls
         agent/i28-e-workflow-controls
         edd9e5dfd0962c9162a08180da8d6106094eb862
         tree c2b15e812ac9fbdb22952b0f3c802799a44882ac

         └─ I28-D receipt and handoff
            agent/i28-d-workflow-handoff
            exact head/tree are owned by its Draft PR metadata
```

Full receipt: [`docs/governance/stage-b3-workflow-receipt.md`](../../docs/governance/stage-b3-workflow-receipt.md).

## Verification

```bash
node --test test/workflow-contracts.test.mjs \
  test/workflow-core.test.mjs \
  test/workflow-mutations.test.mjs
node scripts/check-workflow-compiler.mjs
```

Observed local synthetic result:

```text
16 tests passed
0 failed
workflow_digest = e0a9bd6cef903cf8c690cba933e40013e19869c1b76947682ddc015053aa5a3e
mutations_killed = RETRY_WITHOUT_IDEMPOTENCY, COMPENSATION_REQUIRED, UNBOUNDED_CYCLE, MODEL_HARD_CONTROL_FORBIDDEN
```

Git Town, linked Worktrees, Forgejo, exact-head GitHub Actions, merge, release, live connectors, and production remain separate evidence lanes and are not proved by these tests.
