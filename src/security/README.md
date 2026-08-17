# Security control plane

Issue: [#22](https://github.com/ed3c/fde-agent-platform/issues/22)  
Shadow monitor: [#82](https://github.com/ed3c/fde-agent-platform/issues/82)

This plane binds tenant, principal, audience, workflow, capability, policy decision, logical endpoint, region, data classification, expiry, revocation, operation identity, and audit-chain evidence before a connector request may become an eligible candidate.

## State machines

```text
Grant: ISSUED → ACTIVE → REVOKED / EXPIRED
Invocation: REQUESTED → ALLOWED_CANDIDATE / DENIED
Audit: GENESIS → APPEND_ONLY_CHAIN → TAMPERED_REFUSAL
```

## Boundaries

- Authentication evidence is not authorization.
- A capability grant is a short-lived, audience-bound reference subject; it contains no host secret value.
- Endpoint references are logical allowlisted identities, never model-selected URLs.
- Policy ALLOW and security ALLOW both remain candidate-only.
- Public receipts contain digests and reason codes, not tenant payloads or host material.
- The Security plane never calls a connector and never grants production authority.

## Molecular Stack

```text
PR #83 · I22-C contracts
└─ PR #84 · I22-K security and audit core
   └─ PR #85 · I22-E mutation controls and threat model
      └─ I22-D exact receipt and Connector handoff
```

## Verification

```text
14 security tests passed
mutations killed:
  REVOKED_GRANT_REPLAY
  ARBITRARY_ENDPOINT_SELECTION
  AUDIENCE_MISMATCH
  AUDIT_TAMPERING
```

This evidence is synthetic and exact-subject bound. Git Town, Worktrees, Forgejo, GitHub Actions, live identity/provider behavior, merge, release, and production are separate evidence lanes.
