# Typed Connector SDK and MCP gateway boundary

Issue: [#30](https://github.com/ed3c/fde-agent-platform/issues/30)  
Shadow monitor: [#82](https://github.com/ed3c/fde-agent-platform/issues/82)

This module exposes exact, versioned, synthetic connector capabilities to already-governed WorkflowSpecs. MCP exposure is descriptor-only; authorization, grant evaluation, transactions, idempotency, audit, compensation, and reconciliation remain separate deterministic planes.

## State machines

```text
Request: BOUND → SECURITY_VERIFIED → DISPATCHED
Result: SUCCEEDED | FAILED | RATE_LIMITED | PARTIAL | UNKNOWN_COMPLETION
Unknown completion: UNKNOWN_COMPLETION → RECONCILIATION_REQUIRED → SUCCEEDED / FAILED / FROZEN
```

## Hard laws

- Request, payload, security decision, capability, connector version, operation, logical endpoint, and operation identity are exact-subject bound.
- Duplicate delivery cannot duplicate a side effect.
- Timeout after commit yields `UNKNOWN_COMPLETION`; the gateway never blindly retries.
- Partial success and schema drift remain explicit and reconciliation-bound.
- Adapter selection is registry-owned, not model-owned.
- MCP descriptors contain no endpoint, grant, host material, invocation function, or execution authority.
- Public adapters and fixtures are synthetic. Customer mappings stay in the private forge.

## Molecular Stack

```text
PR #87 · I30-C connector request/result/receipt and MCP contracts
└─ PR #88 · I30-K exact registry and deterministic gateway
   └─ PR #89 · I30-A synthetic idempotent adapter
      └─ PR #90 · I30-E fault and mutation controls
         └─ I30-D exact receipt and runtime handoff
```

Security prerequisite:

```text
PR #83 → #84 → #85 → #86
```

## Verification

```text
16 Connector tests passed
14 Security tests passed
30 combined tests passed
```

Connector mutations killed:

```text
INPUT_SUBJECT_TAMPERING
BLIND_RETRY_AFTER_UNKNOWN_COMPLETION
CROSS_TENANT_CONFUSED_DEPUTY
ADAPTER_ENDPOINT_SUBSTITUTION
```

This evidence is synthetic and exact-subject bound. Git Town, Worktrees, Forgejo, GitHub Actions, live identity/provider/MCP behavior, merge, release, customer outcome, and production remain separate evidence lanes.
