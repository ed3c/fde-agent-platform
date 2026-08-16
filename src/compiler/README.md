# Digital Employee compiler

The current vertical slice deterministically compiles a valid Role Pack and synthetic Tenant Overlay into a governed `DigitalEmployeeSpec` candidate.

## State machine

```text
INPUTS_BOUND
→ ROLE_PACK_VALIDATED
→ TENANT_OVERLAY_VALIDATED
→ CROSS_CONTRACT_VALIDATED
→ SEMANTICALLY_NORMALIZED
→ AUTHORITY_INTERSECTED
→ DIGESTS_BOUND
→ COMPILED
```

Failure routes include invalid schema, authority widening, prohibited action grant, unknown system/capability, secret-bearing field, and incompatible model/privacy policy.

## Inputs

- versioned Role Pack;
- versioned Tenant Overlay;
- public contract versions.

## Output

- deterministic `DigitalEmployeeSpec`;
- exact normalized input SHA-256 digests;
- effective actions/capabilities;
- preserved Human manager/escalation;
- `production_admission: HUMAN_ADMIT_REQUIRED`.

## Non-authority

Compilation does not prove:

- private Overlay resolution;
- business/process truth;
- policy or identity decision;
- connector/runtime behavior;
- model quality;
- Eval/Shadow/canary success;
- production admission or business outcome.

## Change law

Any change to normalization, digest identity, authority composition, public output, or stable failure codes requires an explicit Issue, updated fixtures, negative controls, and downstream revalidation.
