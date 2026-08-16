# Synthetic fixtures

Fixtures are executable examples and negative controls. They are not anonymized customer exports and never stand in for production evidence.

## Layout

```text
fixtures/
├── valid/      admitted positive contract inputs
├── invalid/    planted boundary violations
└── expected/   reviewed deterministic outputs
```

## State machine

```text
RAW_SYNTHETIC
→ CLASSIFIED_VALID / CLASSIFIED_INVALID
→ VERSIONED
→ BOUND_TO_TEST
→ EXECUTED
→ RECEIPTED
→ SUPERSEDED
```

## Invariants

- Every fixture is synthetic and secret-free.
- Invalid fixtures name the exact invariant/error code they must trigger.
- Expected outputs bind exact input/contract versions and deterministic normalization.
- A fixture cannot be edited only to match a broken implementation; the owning contract and assertion must be reviewed first.
- Customer traces, identifiers, amounts, policies, and mappings remain in the private lane.

## Data flow

```text
contract / failure hypothesis
→ synthetic case
→ validator/compiler/runtime/eval
→ exact result
→ assertion + mutation sensitivity
```

## Verification

Run the owning test suite. A positive fixture without a planted negative counterpart is insufficient for authority, security, accounting, or state-transition claims.
