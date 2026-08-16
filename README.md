# FDE Agent Platform

A public, domain-neutral **Outcome Delivery OS** for turning reusable Role Packs plus private Tenant Overlays into governed digital employees.

## First vertical slice

```text
Role Pack
+ Tenant Overlay
+ deterministic policy checks
        ↓
DigitalEmployeeSpec candidate
```

The first implementation deliberately contains no model call, network call, MCP server, database, or production write. It proves the composition boundary before adding runtime authority.

## Repository split

| Public GitHub | Private local Forgejo / tenant plane |
|---|---|
| Generic schemas and Role Packs | Customer evidence and identities |
| Synthetic fixtures | Private policies and authority limits |
| Deterministic compiler and evals | System mappings and connector implementations |
| Policy skeletons | Commercial contracts and live outcomes |
| Anonymized failure taxonomy | Production Runtime Receipts |

Private material must never be copied into this repository. The dual-forge live lane is currently unbound and is reported as `ABSENT` / `NOT_EXERCISED`, not simulated.

## Architecture

Read [`docs/architecture/README.md`](docs/architecture/README.md) and [`AGENTS.md`](AGENTS.md) before implementation.

## Development

Requires Node.js 22 or newer and no third-party runtime dependency for the bootstrap slice.

```bash
npm test
npm run check
```

## Stacked delivery

```text
main
└─ agent/00-bootstrap-control-plane
   └─ agent/01-contracts
      └─ agent/02-role-overlay-compiler
```

Each child PR targets its parent branch. Merge, release, permission changes, and production promotion remain Human-owned.

## First executable slice

The first vertical slice compiles a reusable Role Pack with a synthetic Tenant Overlay:

```bash
npm test
npm run check
npm run compile:demo
```

The compiler is deterministic. It normalizes semantic sets, rejects authority widening and secret-bearing input, preserves prohibited actions, binds both normalized inputs by SHA-256, and emits `production_admission: HUMAN_ADMIT_REQUIRED`.

```text
Role Pack
+ Tenant Overlay
→ cross-contract validation
→ deterministic normalization
→ authority intersection
→ DigitalEmployeeSpec
```

This slice does **not** call a model, MCP server, ERP/CRM system, Git Town executable, local Forgejo, or production runtime. Those remain separately admitted future lanes.
