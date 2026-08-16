# Architecture SSOT

## System intent

The FDE Agent Platform compiles reusable role capability into a tenant-bounded digital employee without granting the compiler or model production authority.

```text
Outcome Contract
+ Role Pack
+ Tenant Overlay
+ Process / Policy evidence (future)
        ↓
Deterministic compiler
        ↓
DigitalEmployeeSpec candidate
        ↓
Verification / Shadow / Canary (future)
        ↓
Governed durable runtime (future)
```

## Complexity and operating mode

- Spatial complexity: **Level C — distributed / agentic system**.
- Current mode: **MONITOR**.
- Current implementation gate: **READY_FOR_PROTOTYPE**.
- PRECHECK is mandatory before external integration, persistent state, credentials, permission widening, irreversible writes, or production publication.

## Realms

### R1 — Public control plane

- Owner: repository maintainers.
- State: generic contracts, Role Packs, policy skeletons, compiler, synthetic fixtures.
- Authority: generate and validate candidates only.
- Forbidden: customer-private or credential-bearing data.

### R2 — Private tenant plane

- Owner: customer / admitted private Forgejo runtime.
- State: Tenant Overlays, evidence, identities, policies, mappings, commercial baselines.
- Authority: supplies configuration within a Role Pack's declared ceiling.
- Current status: `ABSENT` in this runtime.

### R3 — Model plane

- Owner: approved provider or local model operator.
- State: model version and inference request/response.
- Authority: propose classifications or content only.
- Current status: `NOT_IMPLEMENTED`.

### R4 — Execution and connector plane

- Owner: typed connector gateway and durable runtime.
- State: workflow execution, idempotency keys, side-effect receipts, reconciliation.
- Authority: bounded by policy and Human approval.
- Current status: `NOT_IMPLEMENTED`.

### R5 — Human authority plane

- Owner: business, risk, security, and repository authorities.
- State: approvals, waivers, merge/promotion decisions, incident adjudication.
- Authority: irreversible and high-risk transitions.

## Candidate lifecycle

```text
DRAFT
→ VALIDATED
→ COMPILED
→ SHADOWED          (future)
→ CANARY_ADMITTED    (future)
→ MANAGED_PRODUCTION (future, Human-admitted)
→ FROZEN / ROLLED_BACK
```

The initial stack implements only `DRAFT → VALIDATED → COMPILED`.

## Golden invariants

| ID | Statement | Enforcement | Falsifier |
|---|---|---|---|
| INV-001 | A Tenant Overlay cannot widen Role Pack authority. | Set-subset validation in compiler. | Overlay grants an undeclared action and compilation succeeds. |
| INV-002 | Public GitHub contains no live tenant/private/secret material. | Ignore policy, path scanner, review. | A tracked forbidden path or credential-like artifact appears. |
| INV-003 | Prohibited actions remain prohibited after composition. | Contract plus compiler rejection. | Output contains a prohibited action. |
| INV-004 | Composition is deterministic. | Canonical JSON ordering and digest tests. | Same normalized inputs produce different normalized output. |
| INV-005 | Output binds exact input identity. | SHA-256 digests and contract versions. | Output lacks or misstates a source digest. |
| INV-006 | Human-owned boundaries cannot be removed. | Required manager/escalation fields and policy checks. | A required approval path disappears. |
| INV-007 | Candidate generation is not production admission. | Explicit lifecycle state and evidence ceilings. | A compile receipt is treated as deployment approval. |
| INV-008 | GitHub, Forgejo, local worktree, Actions, and merge evidence remain separate. | Typed governance receipts. | One lane is inferred from another. |

## Unknown register

| Unknown | State | Probe / route |
|---|---|---|
| Local Forgejo repository identity and remote | UNKNOWN_BLOCKING for dual-forge delivery | Bind from an admitted local runtime. |
| Git Town executable provenance/checksum | UNKNOWN_BLOCKING for live sync claim | Install exact admitted release and capture host receipt. |
| Production connector semantics | UNKNOWN_BOUNDED | Introduce only after Connector Capability Registry contract. |
| Durable runtime choice | UNKNOWN_BOUNDED | Compare after workflow state and recovery invariants are locked. |
| Model routing/provider policy | UNKNOWN_BOUNDED | Add after deterministic slice and model release contract. |

## Evidence ladder

- L0: source claim / design intent.
- L1: static architecture reasoning.
- L2: deterministic unit proof.
- L3: local integration evidence.
- L4+: real substrate, adversarial, and production evidence.

The bootstrap can reach L2 for governance and compiler invariants. It cannot claim L4 Forgejo, Git Town, external connector, model, or production evidence.
