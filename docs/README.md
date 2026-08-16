# Documentation map

Documentation is divided by authority, not by writing style.

| Path | Owns | Does not own |
|---|---|---|
| root `README.md` | global status, data flow, directory map, entrypoint | detailed system invariants or execution truth |
| `AGENTS.md` | Agent read/route/execute/handoff contract | canonical shared Skill body |
| `docs/architecture/` | architecture SSOT, planes, state machines, invariants, Shadow deltas | Issue-specific acceptance or live receipts |
| `docs/governance/` | shared binding, Issue DAG, Git/Stack topology, ownership and runtime boundaries | product implementation |
| future `docs/evidence/` | external source ledger and admitted claim artifacts | product/runtime PASS |

## Documentation state machine

```text
OBSERVATION
→ DRAFT_MODEL
→ SOURCE/ISSUE_READBACK
→ ARCHITECTURE_OR_GOVERNANCE_REVIEW
→ PUBLISHED_DRAFT
→ RECONCILED / SUPERSEDED
```

A Markdown file is not runtime evidence. It may bind or summarize exact evidence and must retain the evidence ceiling.

## Change law

Every documentation change names:

- owning Issue;
- exact repository/branch subject;
- affected architecture/governance authority;
- whether the change is descriptive, normative, or evidentiary;
- stale links/assumptions;
- rollback or supersession path.

The nearest README must be updated in the same PR that introduces a new writable directory or materially changes its state machine, inputs, outputs, ownership, or tests.
