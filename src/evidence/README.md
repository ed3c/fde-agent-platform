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

## Exact implementation stack

| Atom | Branch | Draft PR | Exact head | Local evidence |
|---|---|---:|---|---:|
| `I8-C` | `agent/i8-c-evidence-process-contract` | #60 | `1f8499f84df212c6931c4a8065ae3a7e7e9f0912` | 4/4 |
| `I8-K` | `agent/i8-k-evidence-process-core` | #61 | `825e75e23825b441dfdd22bb461d4a544b588d56` | 5/5 core after contract tests |
| `I8-E` | `agent/i8-e-evidence-process-controls` | #62 | `2977099cc54886e8c3fa258a6e4e0c427f2a0211` | 4/4 mutation/integrity tests |
| `I8-D` | `agent/i8-d-stage-b1-handoff` | pending in this branch | current head | documentation/receipt only |

The terminal synthetic stack reports `13/13` local tests. The mutation checker kills `VIEW_COLLAPSE` and `UNCONTROLLED_CYCLE`, preserves one unresolved contradiction, and emits Process Twin digest `390ace1271dd31ecc0e03ee8be6423a569b0834396432f3017942b80a6284b7e` with no execution authority.
