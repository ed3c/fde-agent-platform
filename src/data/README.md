# Data-for-Agent readiness

Owner: issue #45. Canonical procedures remain in `skills-shared`.

## State machine

```text
SOURCE_PROFILED
→ SEMANTICALLY_BOUND
→ ACCESS_CHECKED
→ FRESHNESS_CHECKED
→ READY / DEGRADED / BLOCKED
→ REVALIDATED / SUPERSEDED
```

Inputs are admitted source manifests, task-specific metric definitions, field-level quality profiles, access/freshness policy, and dependent baseline/Eval subjects. Outputs are a deterministic `DataReadinessDecision`, explicit blocking/degraded reasons, an exact input digest, and stale-evidence invalidation references.

Forbidden transitions: valid JSON or a high global average directly becoming `READY`; missing, stale, or unauthorized critical data being guessed by a model; semantic drift silently reusing prior evidence; private customer data entering public fixtures.

## Exact implementation stack

| Atom | Branch | Draft PR | Exact head | Local evidence |
|---|---|---:|---|---:|
| `I45-C` | `agent/i45-c-data-readiness-contract` | #55 | `e7f3b21e1b66b521ab1f63b26673776bfe1c60d7` | 4/4 |
| `I45-K` | `agent/i45-k-data-readiness-core` | #56 | `5ae021e291331dd342602c78b9d4250231a1d7a0` | 5/5 |
| `I45-E` | `agent/i45-e-data-readiness-controls` | #57 | `e42181c1ba3a72e839a0b56ccaf1b4c4e8a0d9e5` | 4/4 |

The terminal synthetic stack reports `13/13` local tests. PR #59 is the explicit Evidence Foundation convergence that imports the exact Registry subject. Git Town, Forgejo, GitHub Actions, merge, production freshness, and enterprise correctness remain separate evidence lanes.
