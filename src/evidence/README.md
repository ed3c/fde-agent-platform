# Evidence Graph and Process Twin

Owner: issue #8. Canonical procedures remain in `skills-shared`.

## State machine

```text
CLAIM_CANDIDATE
→ PROVENANCE_BOUND
→ READINESS_CHECKED
→ ADMITTED / CONTRADICTED / STALE / REJECTED
→ VIEW_PROJECTED
→ PROCESS_TWIN_CANDIDATE
→ STATICALLY_VALIDATED
```

The module preserves four separate views: `DOCUMENTED`, `OBSERVED`, `SYSTEM_ENFORCED`, and `APPROVED_TARGET`. It emits a bitemporal, contradiction-preserving Process Twin with `execution_authority: NONE`.

Forbidden transitions: document text directly becoming truth; blocked readiness being admitted; contradictory sources being silently collapsed; an approved-target view without confirmed Human ownership; an undeclared cycle; Process Twin evidence becoming execution authority.
