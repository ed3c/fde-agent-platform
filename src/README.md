# Product source map

`src/` contains consumer-owned product implementation. Canonical procedures do not live here.

## Implemented today

```text
src/
└── compiler/
    ├── compile-digital-employee.mjs
    └── README.md
```

All other modules listed below are planned and must be created only by their owning Issue with a local README, locked interfaces, path lease, tests, and Stack atom.

## Planned module map

| Planned path | Responsibility | Issues |
|---|---|---|
| `discovery/` | opportunity scoring, baseline, Outcome Charter, pilot plan | #25 |
| `engagement/` | evidence audit and phase-gate orchestration | #26 #42 |
| `data/` | semantic readiness, persistence adapters | #45 #29 |
| `evidence/` | bitemporal claims and Process Twin | #8 |
| `context/` | minimal provenance-aware ContextPack | #27 |
| `registry/` | immutable artifact/version registries | #15 |
| `workflow/` | WorkflowSpec/ChangeSpec compiler | #28 |
| `policy/` | authorization and capability decisions | #9 |
| `security/` | tenant/tool/secret/trust controls | #22 |
| `identity/` | SSO, roles, approval signatures, lifecycle | #44 |
| `connectors/` | typed connector SDK and MCP boundary | #30 |
| `runtime/` | simulator and durable adapter | #10 #40 |
| `release/` | replay, Shadow, canary, rollback controller | #17 |
| `outcomes/` | Outcome Ledger and commercial candidates | #11 #36 |
| `models/` | routing, versioning, model release | #12 |
| `learning/` | expert traces, productization, repair/post-training | #16 #19 #35 |
| `observability/` | trace/audit/outcome correlation | #32 |
| `private-lane/` | immutable private Overlay resolution | #33 |
| `deployment/` | deployment profiles, resilience, live canary | #34 #41 #46 |
| `workbench/` | Human review, governance, adoption | #18 #37 |
| `operations/` | managed-service lifecycle and incidents | #20 |
| `assurance/` | control/evidence-pack generation | #43 |
| `api/` | typed API, SDK, CLI, plugin candidates | #39 |

## Module creation contract

```text
Issue + exact base
→ contract/interface lock
→ new directory + local README
→ deterministic core
→ unit/negative tests
→ cross-module Eval/integration
→ exact receipt + Stack index update
```

## Cross-module laws

- Dependencies flow through public contracts, never hidden imports or shared mutable state.
- A module may narrow authority but may not widen an upstream ceiling.
- Model/provider code is behind typed adapters.
- External writes are behind policy, identity, connector, runtime, and release gates.
- Every module exposes bounded inputs/outputs and explicit degraded/failure states.
- New third-party dependencies require an explicit dependency/admission Issue.
