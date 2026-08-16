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
