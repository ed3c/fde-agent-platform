# Security control plane

Issue: #22. This plane binds tenant, principal, audience, workflow, capability, policy decision, logical endpoint, region, data classification, expiry, revocation, operation identity, and audit-chain evidence before a connector request may become an eligible candidate.

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
