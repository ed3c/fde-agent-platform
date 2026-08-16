# Public contracts

These schemas are the public, domain-neutral interoperability boundary of the FDE Agent Platform.

## Current contracts

- `role-pack.schema.json` — reusable job capability and authority ceiling.
- `tenant-overlay.schema.json` — tenant system bindings and restrictions.
- `digital-employee-spec.schema.json` — deterministic composition output.
- `outcome-contract.schema.json` — baseline, metric, and attribution intent.
- `runtime-receipt.schema.json` — exact execution evidence disposition.

## Local state machine

```text
PROPOSED
→ SCHEMA_VALIDATED
→ CROSS_CONTRACT_VALIDATED
→ INTERFACE_LOCKED
→ CONSUMED
→ SUPERSEDED / DEPRECATED
```

A contract is not `LOCKED` merely because a JSON file parses. It must have stable identity/version, closed authority-bearing boundaries, synthetic positive/negative fixtures, cross-contract assertions, and an owning Issue.

## Inputs and outputs

```text
architecture invariant + Issue contract
→ JSON Schema + cross-document rule
→ synthetic fixture + stable error code
→ exact contract digest consumed by compiler/module
```

## Authority

Contracts describe allowed shapes and ceilings. They do not grant runtime, connector, model, merge, release, or production authority.

## Forbidden content

No customer evidence, employee identity, credential, private policy, customer mapping, live connector schema, commercial contract, private Tenant Overlay body, or production receipt belongs here.

## Change rules

- Breaking changes require a new version and migration/deprecation disposition.
- A Worker may not weaken an assertion or expand authority to make an implementation pass.
- New module contracts are added by their owning Issue and indexed in root README, the Issue DAG, and Stack index.
- `scripts/lib/contract-validation.mjs` owns current cross-document invariants that JSON Schema alone cannot prove.
