# Registry contract plane

Issue: #15 · atom `I15-C`.

## Ownership

This directory owns immutable registry identity and lifecycle validation for Role Packs, private Tenant Overlay references, Outcome Contracts, and compiled DigitalEmployeeSpec subjects. It never stores private Tenant Overlay bytes.

## State machine

```text
DRAFT → VALIDATED → ACTIVE → SUPERSEDED
   └──────────────→ REVOKED
```

`SUPERSEDED` and `REVOKED` are terminal. Logical ID, version, and content digest are immutable across a state transition.

## Inputs and outputs

```text
versioned artifact metadata + exact digest + source subjects
→ registry contract validation
→ immutable RegistryEntry subject or stable failure code
```

## Forbidden transitions

- mutable display name as identity;
- same logical ID/version with a different digest;
- public storage of private payloads or credentials;
- ACTIVE without a validation receipt;
- Tenant Overlay reference that widens a Role Pack authority ceiling;
- automatic promotion, deprecation, or revocation.

## Verification

```bash
node --test test/registry-contracts.test.mjs
```

The contract can reach local deterministic evidence only. A private resolver, production database, promotion, or customer authorization remains separately admitted.
