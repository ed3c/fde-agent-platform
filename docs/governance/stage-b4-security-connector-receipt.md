# Stage B4 Security + Connector/MCP receipt

Disposition:

```text
STAGE_B4_SYNTHETIC_IMPLEMENTATION_COMPLETE
INTEGRATION_ADMISSION_OPEN
```

## Exact Stack

```text
Stage B3 terminal
b63a936fbc0e8bf0e3f9fcb8d3727d9703f2f7dd

└─ PR #83 · I22-C Security contracts
   a8d8dc239ce20389e8ceadd35f339d0a2ff76375
   tree 839cde4b1ed6c19c24179e48cfe3a8c3676f6a2f

   └─ PR #84 · I22-K Security and audit core
      1da01d8d2d91d2cf5ff32ef11c9dda8682503fe3
      tree 26af4e4446789a44a3e042d92394ce72dbe33296

      └─ PR #85 · I22-E Security mutations
         7c325790a21edc4aee188b71d71b7d0af9640433
         tree ea6c1870c2f8121e212c12430aa2f50925128593

         └─ PR #86 · I22-D Security handoff
            2318b7e38bb6c58b90bb336e98dafa1f1aa90a6b
            tree 198adc33e88b5542a78896e19c8acad0aae8865b

            └─ PR #87 · I30-C Connector/MCP contracts
               e81c751506e8d8c288aa741d2df2b284183fa8e5
               tree f24d7964eef22465a864a7aa446ce6b3bbaf689e

               └─ PR #88 · I30-K Registry and Gateway
                  3cdf99a55a02242ff71ae80816850800c79a2e18
                  tree 2dd4b7fa854bd82106200a47ed35ea14773ed115

                  └─ PR #89 · I30-A Synthetic adapter
                     61ce9b510a60d5034f8cd14d670da88425cb7fd3
                     tree 53d378204d816026d55ec364b299d5c10f34f0da

                     └─ PR #90 · I30-E Connector controls
                        4af988dbef6e940049c52b2936fc6fc214742a03
                        tree 7500de44b98f3c3830d72c21f7ca821324d650f0

                        └─ I30-D · this receipt/handoff branch
```

## Exact local synthetic evidence

```text
node --test \
  test/security-contracts.test.mjs \
  test/security-core.test.mjs \
  test/security-mutations.test.mjs \
  test/connector-contracts.test.mjs \
  test/connector-gateway.test.mjs \
  test/connector-core.test.mjs \
  test/connector-mutations.test.mjs

30 tests passed
0 failed
```

```text
node scripts/check-security-controls.mjs
PASS
mutations_killed = REVOKED_GRANT_REPLAY, ARBITRARY_ENDPOINT_SELECTION, AUDIENCE_MISMATCH, AUDIT_TAMPERING
execution_admission = ELIGIBLE_CANDIDATE_ONLY
```

```text
node scripts/check-connector-gateway.mjs
PASS
mutations_killed = INPUT_SUBJECT_TAMPERING, BLIND_RETRY_AFTER_UNKNOWN_COMPLETION, CROSS_TENANT_CONFUSED_DEPUTY, ADAPTER_ENDPOINT_SUBSTITUTION
live_provider = NOT_EXERCISED
```

## Closed synthetic invariants

- authentication is not authorization;
- grants are short-lived, tenant/principal/audience/workflow/operation bound and revocable;
- public subjects contain reference digests, not host secret values;
- endpoints are logical allowlisted identities, never model-selected URLs;
- Policy and Security ALLOW remain candidate-only;
- MCP is descriptor-only and carries no endpoint, grant, credential, invocation function, transaction, or execution authority;
- Connector requests bind exact Workflow, SecurityInvocation, SecurityDecision, ConnectorCapability, connector version, operation identity, logical endpoint, and input digest;
- duplicate delivery does not duplicate a side effect;
- timeout after commit becomes `UNKNOWN_COMPLETION` and requires observation/reconciliation, never blind retry;
- rate limit, partial success, schema drift, postcondition uncertainty, and audit-chain tampering remain explicit;
- synthetic receipts do not establish live-provider or production behavior.

## Provider publication failures

Two benign GitHub contents-API writes were refused by the provider. In each case the identical reviewed content was published through Git blob/tree/commit fast-forward. These are recorded as `FAILED_TOOL` for the initial write attempts, not as assertion failures or evidence of provider execution.

## Evidence boundary

Observed/local synthetic evidence does not prove live identity/grant issuance, host secret delivery, real MCP transport, external provider endpoints, provider rate limits or transaction semantics, private tenant mappings, Git Town, linked Worktrees, local Forgejo, exact-head GitHub Actions, merge, release, customer acceptance, compliance, business outcomes, or production. Those lanes remain `ABSENT`, `NOT_EXERCISED`, or `HUMAN_ADMIT_REQUIRED`.

## Downstream handoff

After repository/Human admission of this exact Stage, issue #10 may consume the ConnectorResult/Receipt and fault semantics in the deterministic durable-workflow simulator. Issue #17 may consume ChangeSpec + Security + Connector subjects for replay/shadow/canary control. Live provider adapters remain separate private or provider-specific work.
