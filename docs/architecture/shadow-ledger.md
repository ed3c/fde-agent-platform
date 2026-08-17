# Shadow Architecture ledger

The Shadow Architect is read-only. It records material architecture deltas, falsifiers, observed evidence, and intervention levels. It never becomes a second implementation writer.

## Stable evidence boundaries

| Boundary | Current state | Effect |
|---|---|---|
| Open Draft PR Stack | observed | proves GitHub objects, not admission/merge |
| Full reviewed convergence tree | not exercised | blocks integrated-stage claim |
| Git Town executable / Worktrees | not exercised / absent | blocks sync/restack and lease-runtime claims |
| Local Forgejo / private lane | absent | blocks dual-forge and private Overlay claims |
| Exact-head GitHub Actions | not exercised | blocks CI claim |
| Live identity / provider / MCP | not exercised | blocks live authority/provider claim |
| Durable runtime / release | not implemented | blocks runtime/release closure |
| Outcome / organization | not implemented | blocks ROI/FDE delivery closure |
| Merge / release / production | Human admission required | never model-owned |

## 2026-08-16 — procedural grounding

- Delta: `PROCEDURAL_GROUNDING`, `OWNERSHIP`, `EVIDENCE`.
- Finding: repository work can bind exact shared procedures without copying Skill bodies.
- Must remain true: `skills-shared` owns Skill bodies; consumer owns bindings, task packets, product code and receipts.
- Falsifiers: local `SKILL.md`, copied frontmatter/body, mutable shared subject, omitted procedure delta.
- Intervention: `CONTINUE_WITH_WARNINGS_L1` after deterministic no-vendoring controls.

## 2026-08-16 — publication boundary

- Delta: `EXTERNAL_SIDE_EFFECT` limited to GitHub metadata and Git objects.
- Must remain true: GitHub publication is not Git Town, Forgejo, Actions, merge or production.
- Falsifier: PR prose collapses evidence lanes.
- Intervention: `CONTINUE_WITH_WARNINGS_L1`; all PRs remain Draft.

## 2026-08-17 — directory DAG and Stack index

- Delta: `OWNERSHIP`, `LIFECYCLE`, `TRACEABILITY`.
- Finding: the first operating map made Issue→directory→State Machine→atom routing possible.
- Material repair: removed the former `#45 → #29/#32 → #8 → #45` cycle by keeping semantic readiness upstream of persistence/observability.
- Remaining problem: the documentation snapshot later became stale while Stage B1–B4 implementation advanced.
- Intervention at that time: `RECONCILE_BEFORE_NEXT_STEP_L2`.

## 2026-08-17 — Stage B1 Data Readiness and Process Twin

- Delta: `EVIDENCE_STATE`, `TEMPORAL_MODEL`, `PROCESS_GRAPH`.
- Newly possible: critical data can fail closed; process views and contradictions remain distinct; controlled cycles are explicit.
- Falsifiers killed on synthetic fixtures: missing critical field, semantic drift reuse, view collapse, uncontrolled cycle, digest tampering.
- Must remain true: Process Twin has `execution_authority: NONE`; contradictions are not automatically resolved.
- Not proved: real source completeness, persistence, Process Owner approval, customer process truth.
- Gate: #64 open.
- Intervention: `CONTINUE_WITH_WARNINGS_L1`.

## 2026-08-17 — Stage B2 Context and Policy

- Delta: `CONTEXT_SELECTION`, `AUTHORITY_CANDIDATE`, `APPROVAL`.
- Newly possible: required evidence and contradictions cannot be hidden for budget; policy is deny-by-default with exact approval and separation of duties.
- Falsifiers killed: contradiction suppression, context truncation, default allow, SoD bypass, stale/altered decision.
- Must remain true: Context has no execution authority; Policy `ALLOW` is eligible candidate only.
- Not proved: production retrieval, live identity, credentials, connector behavior.
- Gate: #75 open.
- Intervention: `CONTINUE_WITH_WARNINGS_L1`.

## 2026-08-17 — Stage B3 WorkflowSpec and ChangeSpec

- Delta: `WORKFLOW_STATE`, `FAILURE_SURFACE`, `CHANGE_GOVERNANCE`.
- Newly possible: states, transitions, retry, timeout, compensation, reconciliation, rollback, controlled cycles and Human gates are statically representable.
- Falsifiers killed: arbitrary code, unknown transition, retry without idempotency, missing compensation, model-owned hard control, unbounded loop, stale policy subject, digest tampering.
- Must remain true: natural language stops at ChangeSpec candidate; Workflow/Change have no execution authority; production admission remains Human-owned.
- Not proved: durable execution, replay, Shadow, canary, provider behavior.
- Gate: #81 open.
- Intervention: `CONTINUE_WITH_WARNINGS_L1`.

## 2026-08-17 — Stage B4 Security and Connector/MCP

- Delta: `TRUST_BOUNDARY`, `EXTERNAL_EFFECT`, `AUDIT`, `RECONCILIATION`.
- Newly possible: short-lived reference grants, logical endpoint allowlists, exact security decisions, typed connector requests/results/receipts, descriptor-only MCP and in-memory side effects.
- Falsifiers killed: revoked grant replay, arbitrary endpoint, audience mismatch, cross-tenant confused deputy, audit tampering, input subject tampering, endpoint substitution, blind retry after unknown completion.
- Must remain true: Policy/Security `ALLOW` remain candidates; MCP carries no endpoint/grant/callback; synthetic evidence cannot become provider evidence.
- Observed repair: two benign contents-API writes failed; exact reviewed blobs were published through ordinary Git object fast-forward without weakening assertions.
- Not proved: live identity/grants, real MCP transport, external provider transaction semantics, durable runtime or production.
- Gate: #92 open.
- Intervention: `CONTINUE_WITH_WARNINGS_L1`.

## 2026-08-17 — repository-wide closure reconciliation (#93/#94)

- Delta: `DOCUMENTATION_TRUTH`, `CLOSURE_CLASSIFICATION`, `ISSUE_DAG`, `STACK_TRACEABILITY`.
- Material finding: `AGENTS.md`, root/source READMEs, Architecture SSOT, Issue DAG, Stack Index and Shadow Ledger still described most Stage B1–B4 modules as planned.
- Tech Lead verdict: synthetic control-plane mechanics reach an in-memory Connector result; the complete FDE delivery loop is not closed.
- Real closure gaps: executable Eval, durable runtime, release/canary, Outcome Ledger, observability, Workbench/engagement/operations, model/learning, private/live provider, Git Town/Forgejo and customer evidence.
- Source verdict: 260-step flow, 10,000 expert actions, regional uplift, unit economics, ROI and Varick SFT/RL remain source-reported or synthetic analogues.
- Documentation repair: #94 updates current truth, directory State Machines, product DAG, closure matrix, Gate table and actual PR #5–#91 index from exact Stage B4 terminal.
- Falsifiers: existing directory marked planned; absent path marked implemented; Draft/local synthetic marked admitted; source claim marked reproduced; product code changed by docs atom.
- Provider event: first oversized closure-matrix blob write was refused; a smaller equivalent matrix was created. Record first attempt as `FAILED_TOOL`, not a product/test failure.
- Current intervention: `RECONCILE_BEFORE_NEXT_STEP_L2` until the #94 Draft PR is published and exact changed paths are re-observed.

## Current Shadow recommendation

```text
1. publish and review #94 as documentation-only;
2. keep Gates #54/#64/#75/#81/#92 open until local reviewed convergence exists;
3. complete I31-K/E/D before claiming #10 integration-ready;
4. execute I10 → I17 → I11 → I18/#42 → I21 for the shortest synthetic closure path;
5. run #13/#33/#44/#46 separately for real private/live evidence;
6. never promote source claims or synthetic analogues to customer/runtime/business truth.
```
