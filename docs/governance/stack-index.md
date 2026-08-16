# Stacked PR Index

| Order | GitHub issue | Branch | Parent | Contract consumed | State |
|---:|---|---|---|---|---|
| 00 | #2 | `agent/00-bootstrap-control-plane` | `main` | seed repository identity | DRAFT PR #5 |
| 01 | #3 | `agent/01-contracts` | `agent/00-bootstrap-control-plane` | architecture invariants and path policy | DRAFT PR #6 |
| 02 | #4 | `agent/02-role-overlay-compiler` | `agent/01-contracts` | versioned Role Pack / Tenant Overlay contracts | DRAFT PR #7 |
| 03 | #14 | `agent/03-shared-procedure-bindings` | `agent/02-role-overlay-compiler` | exact external procedural authority and no-vendoring law | IMPLEMENTING |
| 04 | #8 | `agent/04-evidence-process-twin` | `agent/03-shared-procedure-bindings` | governed DigitalEmployeeSpec plus shared procedure binding | PLANNED |
| 05 | #9 | `agent/05-policy-connector-registry` | `agent/04-evidence-process-twin` | evidence-bound Process Twin | PLANNED |
| 06 | #10 | `agent/06-durable-runtime-drift` | `agent/05-policy-connector-registry` | policy and connector capability decisions | PLANNED |
| 07 | #11 | `agent/07-outcome-ledger` | `agent/06-durable-runtime-drift` | exact Runtime Receipts | PLANNED |
| 08 | #12 | `agent/08-model-release-train` | `agent/07-outcome-ledger` | Outcome Contract and unit economics | PLANNED |

Infrastructure issue #13 is a separate live-runtime closure lane. It does not become an artificial product-stack child.

## Review law

Each child PR targets its parent branch. Review the smallest diff first. A green leaf is not a green integrated stack; parent contract changes require child revalidation.

Every planned issue binds applicable procedures from the exact `skills-shared` subject recorded in `skills-shared-binding.json`. The issue references procedure paths and deltas only; Skill bodies remain in `skills-shared`.

## Runtime caveat

The graph is repository policy. The current runtime has no admitted `git-town` executable or local Forgejo, so live restack/sync receipts remain `NOT_EXERCISED`.
