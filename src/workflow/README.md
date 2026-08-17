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

## Molecular Stack

```text
I28-C contracts and validators
→ I28-K deterministic compiler
→ I28-E mutation controls
→ I28-D exact receipt and handoff
```

Branch/PR identities are recorded in the Stage B3 receipt after publication. Git Town, linked Worktrees, Forgejo, GitHub Actions, merge, release, live connectors, and production remain separate evidence lanes.
