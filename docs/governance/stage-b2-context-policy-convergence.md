# Stage B2 Context / Policy / Registry / Eval convergence receipt

Issue: #72. Shadow monitor: #65.

## Exact inputs

- Context terminal: `0b16065e996c958cd59c5a80c52b9f4c3d6bad47`, tree `af646d4a6ec513eea003141530be7a2fb1b212db`.
- Policy terminal and ordinary Git parent: `6bf5da8c8ee759633021c078abecd29290bf8bcc`, tree `dbee65fe957687e0f971fc540192dc886f6ce589`.
- Registry contract carried by the Stage B1 lineage: `c2277a79e3934ea81a3484cab92e466683f693d8`, tree `750e838e8c5e8f37c87a8b869ed0552c4862c8cf`.
- Eval contract: `74cd7312326e7857daad4942ff4480b6ab506734`, tree `7859360e6a4601ca846926a998aff637cac74b5c`.

## Convergence method

This convergence has one ordinary parent. It imports exact reviewed Context and Eval blobs into the exact Policy terminal tree. Registry files are already present through the Stage B1 convergence lineage. It is not an octopus merge, a Git Town receipt, a Forgejo merge, or main admission.

## Local exact reconstruction

```text
Context contracts/core/mutations  12/12
Policy contracts/core/mutations   13/13
Registry contracts                 6/6
Eval contracts                     7/7
Total                              38/38
```

Mutation checkers:

```text
CONTRADICTION_SUPPRESSED
CONTEXT_BUDGET_TRUNCATION
DEFAULT_ALLOW_UNKNOWN_CAPABILITY
SOD_BYPASS
```

## Preserved invariants

- `ContextPack.execution_authority = NONE`.
- required evidence and material contradictions cannot be hidden to satisfy budget.
- unknown capability, prohibited action, stale/missing approval, and SoD violation fail closed.
- Policy `ALLOW` is only an eligible candidate, not execution or production admission.
- Registry private references contain exact metadata/digests only, never private bodies.
- LLM judges cannot override deterministic hard Eval failures.

## Evidence ceiling

The exact Git tree and local synthetic compatibility may reach L3 for the exercised contracts. Git Town, linked Worktrees, local Forgejo, GitHub Actions, merge, release, live connector execution, customer acceptance, and production remain `NOT_EXERCISED`, `ABSENT`, or `HUMAN_ADMIT_REQUIRED`.
