# Stage B4 synthetic connector threat model

| Threat | Control | Falsifier |
|---|---|---|
| Cross-tenant confused deputy | exact tenant on grant, invocation, capability | tenant mutation must deny |
| Audience confusion / passthrough | exact audience on grant and endpoint policy | wrong audience must deny |
| Model-selected endpoint / SSRF | closed invocation contract + logical endpoint allowlist | arbitrary URL must deny |
| Grant replay after revoke/expiry | revocation state + exact expiry | replay must deny |
| Policy receipt laundering | exact policy decision digest binding | changed subject must deny |
| Capability widening | exact capability/operation/action class | mismatch must deny |
| Side-effect duplicate | stable operation identity + idempotency digest | missing identity/key must deny |
| Secret leakage | repository secret-field/value scanner | secret canary must fail |
| Audit tampering | chained event digest | changed prior event must fail |
| Region/classification egress | exact region and classification ceilings | out-of-scope request must deny |

This document is a design/eval surface, not a compliance certificate or proof of live identity/provider behavior.
