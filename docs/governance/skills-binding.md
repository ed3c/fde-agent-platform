# Shared Procedure Binding

`fde-agent-platform` is a **consumer** of procedural authority from `ed3c/skills-shared`. It is not a distribution copy of that repository.

Machine-readable identity and paths live in `skills-shared-binding.json`. The current exact subject is:

```text
ed3c/skills-shared@ec5a240fa3cbafda2c6a8bce0ae12143e0992f80
```

## Canonical sources

| Procedure ID | Canonical path in `skills-shared` | Consumer responsibility |
|---|---|---|
| `git-town-stacked-pr-worker` | `skills/git-town-stacked-pr-worker/SKILL.md` | repo profile, stack graph, path leases, local receipts |
| `dual-forge-repository-loop` | `skills/dual-forge-repository-loop/SKILL.md` | GitHub/Forgejo binding and exact-SHA crossing evidence |
| `spatial-loop-systems-engineering` | `skills/spatial-loop-systems-engineering/SKILL.md` | repository-specific system contract, invariants, probes, evidence ceiling |
| `shadow-architecture-watch-loop` | `skills/spatial-loop-systems-engineering/references/architecture-watch-loop.md` | read-only architecture delta ledger and checkpoint outcome |
| `procedural-shadow-runtime` | `skills/procedural-shadow-runtime/SKILL.md` | procedure-delta disposition and exact-subject receipt closure |
| `agentic-tech-lead-orchestration` | `skills/agentic-tech-lead-orchestration/SKILL.md` | issue DAG, interface locks, worker packets, and bounded repair |

The table is a binding index, not a copy of any procedure.

## Non-vendoring law

The following are governance failures:

- adding a local `SKILL.md`;
- adding a tracked `skills/` directory that mirrors shared procedures;
- copying a shared Skill frontmatter/body into another filename;
- copying shared system prompts, publication policies, scripts, schemas, or references and presenting them as canonical;
- editing a local clone instead of changing `skills-shared` through its own issue/PR process;
- binding an active work packet to mutable `main` without an exact commit subject.

Consumer-specific code is allowed only when it implements this repository's product, adapter, profile, checker, task packet, fixture, or receipt. A consumer adapter must point back to the canonical shared procedure that governs it.

## Issue binding contract

Every unfinished issue must contain a short binding block with:

```yaml
shared_procedure_source:
  repository: ed3c/skills-shared
  subject_sha: ec5a240fa3cbafda2c6a8bce0ae12143e0992f80
  applicable_paths:
    - <canonical path>
procedure_delta:
  - <named obligation required for this issue>
evidence_ceiling: <highest evidence this runtime can honestly produce>
```

The issue must not paste the corresponding Skill sections. At execution time, an admitted runtime resolves the exact paths from the bound subject, computes the applicable delta, and records terminal dispositions.

## Ownership split

```text
skills-shared
  owns portable procedure bodies, states, schemas, checkers, and evidence ceilings

fde-agent-platform issue
  owns objective, exact base, path lease, interface locks, acceptance, rollback, and product behavior

fde-agent-platform repository
  owns consumer bindings, product implementation, synthetic fixtures, and repo-specific receipts

Human / trusted operator
  owns semantic conflict admission, merge, permissions, secrets, release, and production
```

## Rebinding

A newer `skills-shared` commit is adopted only through a dedicated GitHub issue that:

1. records old and new subjects;
2. identifies changed applicable procedures;
3. computes the procedure delta for every affected open issue;
4. reruns consumer governance and product checks;
5. preserves prior receipts as evidence for their original subject only.
