# Multi-layer Eval contract plane

Issue: #31 · atom `I31-C`.

## State machine

```text
CASE_BOUND → ORACLE_RUN → MUTATION_KILLED → PASS / FAIL / NOT_EXERCISED / SKIPPED_BY_POLICY
```

## Core law

Deterministic safety, authority, accounting, state, and security assertions execute before model judges. An LLM judge is supplementary and can never override a hard failure.

Every positive receipt binds the exact subject, pack, evaluator, fixture, environment, command, coverage, mutation kills, timestamps, and artifact digest.

## Forbidden transitions

- source-reported external claim labeled repository runtime PASS;
- skipped or absent case collapsed into PASS;
- positive receipt without a planted mutation kill;
- blocking case removed or threshold weakened after activation;
- model judge configured as a hard oracle;
- hard failure summarized away by an aggregate score.

## Verification

```bash
node --test test/eval-contracts.test.mjs
```
