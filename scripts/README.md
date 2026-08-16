# Deterministic scripts and checks

Scripts implement repository-owned validation, compilation support, and evidence checks. Canonical shared procedures remain in `skills-shared`; do not copy shared Skill scripts here.

## State machine

```text
INPUT_SUBJECT_BOUND
→ INPUT_VALIDATED
→ CHECK/COMPILE
├─ PASS + RECEIPT
├─ FAIL + STABLE_CODE
└─ NOT_EXERCISED / ABSENT
```

## Current scripts

- `check-governance.mjs` — repository policy, public/private boundary, runtime-evidence overclaim checks.
- `check-shared-skill-binding.mjs` — immutable external binding and no-vendoring checks.
- `check-contracts.mjs` — public contract and cross-contract validation.
- `lib/contract-validation.mjs` — deterministic schema/cross-document rules.

## Laws

- Scripts fail closed on missing critical inputs.
- `PASS`, `FAIL`, `ABSENT`, `NOT_EXERCISED`, and `SKIPPED_BY_POLICY` remain distinct.
- Stable error codes are part of the contract.
- A verifier must kill a planted defect before its positive claim is trusted.
- Scripts may not fetch mutable remote procedures, secrets, or private tenant bytes into Git.
- A script result is bound to its exact code, inputs, command, runtime, and exit state.

## Adding a script

The owning Issue must define the input/output schema, side effects, bounds, cleanup, stable failures, tests, and evidence ceiling. External/provider invocations require PRECHECK and a typed adapter boundary.
