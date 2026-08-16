# Policy and connector capability plane

Issue: #9 · atom `I9-C`.

## State machine

```text
REQUESTED
→ CONTRACT_VALIDATED
→ DENY / APPROVAL_REQUIRED / ALLOW_CANDIDATE
```

## Hard boundaries

- authentication never implies authorization;
- unknown capability is deny-by-default;
- models cannot choose identities, credentials, approvers, scopes, or policy outcomes;
- side effects require stable operation identity, idempotency, postcondition observation, and compensation where reversible;
- irreversible operations remain prohibited or Human-approved;
- a policy `ALLOW` is only an eligible execution candidate, never production admission.

## Verification

```bash
node --test test/policy-contracts.test.mjs
```

Synthetic contract evidence only. Live credentials, identity provider behavior, connector execution, and production admission remain separate.
