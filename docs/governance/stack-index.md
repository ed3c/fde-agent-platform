# Stacked PR Index

| Order | GitHub issue | Branch | Parent | Contract consumed | State |
|---:|---|---|---|---|---|
| 00 | #2 | `agent/00-bootstrap-control-plane` | `main` | seed repository identity | IMPLEMENTING |
| 01 | #3 | `agent/01-contracts` | `agent/00-bootstrap-control-plane` | architecture invariants and path policy | PLANNED |
| 02 | #4 | `agent/02-role-overlay-compiler` | `agent/01-contracts` | versioned Role Pack / Tenant Overlay contracts | PLANNED |

## Review law

Each child PR targets its parent branch. Review the smallest diff first. A green leaf is not a green integrated stack; parent contract changes require child revalidation.

## Runtime caveat

The graph is repository policy. The current runtime has no admitted `git-town` executable or local Forgejo, so live restack/sync receipts remain `NOT_EXERCISED`.
