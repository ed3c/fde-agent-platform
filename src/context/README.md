# Context contract plane

Issue: #27 · atom `I27-C`.

## Ownership

This directory owns the public, model-agnostic contracts for `ContextQuery` and `ContextPack`. It binds evidence provenance, bitemporal subject identity, mandatory policy dependencies, contradiction visibility, classification limits, and finite context budgets. It does not own retrieval-provider choice or execution authority.

## State machine

```text
QUERY_BOUND
→ CONTRACT_VALIDATED
→ CONTEXT_CANDIDATE
├─ READY
├─ DEGRADED
└─ REFUSED
```

## Hard boundaries

- retrieval rank or vector similarity never promotes a claim to fact;
- release-blocking queries must refuse unresolved contradictions;
- mandatory policy subjects cannot be dropped to fit a budget;
- cross-tenant or stale evidence fails closed;
- `ContextPack.execution_authority` is always `NONE`;
- exact digests bind query and pack subjects.

## Verification

```bash
node --test test/context-contracts.test.mjs
```

Synthetic contract evidence only. Production recall, organization-wide completeness, provider privacy, and business correctness remain unproved.
