# Public contracts

These schemas are the public, domain-neutral boundary of the FDE Agent Platform.

- `role-pack.schema.json` defines reusable job capabilities and hard authority ceilings.
- `tenant-overlay.schema.json` binds private tenant systems and narrows a Role Pack.
- `digital-employee-spec.schema.json` defines the deterministic compiler output.
- `outcome-contract.schema.json` defines measurable result baselines and attribution.
- `runtime-receipt.schema.json` keeps execution evidence states distinct.

The JSON Schemas document interoperability. `scripts/lib/contract-validation.mjs` additionally enforces cross-document invariants that JSON Schema alone cannot prove, especially authority non-widening and model/privacy compatibility.

No customer evidence, employee identity, credential, private connector schema, or live receipt belongs in this directory.
