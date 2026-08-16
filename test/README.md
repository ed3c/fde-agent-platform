# Test, mutation, and fault evidence

`test/` contains repository-owned executable assertions for the current Node.js implementation. The future shared Eval platform is tracked by #31 and will use `evals/`.

## Test state machine

```text
SUBJECT_AND_FIXTURE_BOUND
→ POSITIVE_ASSERTION
→ PLANTED_MUTATION / FAILURE
→ VERIFIER_DETECTS
→ EXACT_RESULT_REPORTED
```

## Current scope

- governance and public/private boundaries;
- external `skills-shared` binding/no-vendoring;
- public contract and cross-contract validation;
- deterministic Role Pack/Overlay compilation.

## Laws

- Supplied assertions are immutable to the implementation under test.
- A Worker may add coverage inside its lease; weakening/removing a gate is `ASSERTION_MUTATION`.
- Every critical positive path has a negative or mutation control.
- Tests bind exact code/tree, fixture version, command, runtime, and exit state.
- Unit green is not integration, GitHub Actions, provider, security audit, production, or ROI evidence.
- Skipped, absent, not exercised, and Human-admitted states are not PASS.

## Execution

```bash
npm test
npm run check
npm run compile:demo
```

Cross-module replay, chaos, load, provider, private-lane, and production tests must remain in their owning Issues and evidence lanes.
