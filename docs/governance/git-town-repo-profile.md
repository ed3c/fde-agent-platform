# Git Town Stacked-PR Repository Profile

## Identity

```yaml
schema: git-town-stacked-pr-worker/repo-profile/v1
repository:
  full_name: ed3c/fde-agent-platform
  immutable_identity: github-repository-id:1335749319
  default_branch: main
  perennial_branches: []
  allowed_remote_name: github
  allowed_remote_url_pattern: https://github.com/ed3c/fde-agent-platform.git
```

## Authority documents

```yaml
authority:
  agents: AGENTS.md
  architecture: docs/architecture/README.md
  git_governance: docs/governance/git-town-repo-profile.md
  harness: package.json
  path_ownership: docs/governance/path-ownership.json
  git_town_admission: docs/governance/git-town-repo-profile.md
  issue_template: .github/ISSUE_TEMPLATE/work-packet.yml
  pull_request_template: .github/PULL_REQUEST_TEMPLATE.md
```

## Git Town admission

```yaml
git_town:
  required_version: 24.0.0
  source_repository: git-town/git-town
  immutable_release: tag:v24.0.0
  executable_state: ABSENT
  executable_sha256: ABSENT
  provenance_ref: ABSENT
  direct_license: MIT
  sbom_or_transitive_review: NOT_EXERCISED
  notices_review: NOT_EXERCISED
  legal_approval: HUMAN_ADMIT_REQUIRED
  admitted_for_live_execution: false
```

The checked-in `.git-town.toml` declares repository policy. It does not prove an executable exists or ran.

## Synchronization policy

```yaml
sync:
  feature_strategy: rebase
  perennial_strategy: ff-only
  default_scope: stack
  non_interactive: true
  auto_resolve: false
  default_push: false
  allow_all_stacks: false
  timeout_seconds: 300
  dry_run_required: true
  post_sync_ancestry_check: true
  rerun_evals_after_sync: true
```

## Worker and lease policy

```yaml
workers:
  primary_checkout_mutation: denied
  linked_worktree_required: true
  worktree_root: HOST_OWNED
  branch_lease_root: HOST_OWNED
  repository_lease: required
  lease_ttl_seconds: 3600
  sibling_path_overlap: denied
  preserve_blocked_worktree: true
```

## Receipts and publication

```yaml
receipts:
  root: .receipts/
  append_only: true
  secret_values: denied
  task_packet_digest_required: true
  before_after_graph_required: true
  cleanup_lane_required: true

publication:
  automated_worker_publication: blocked
  github_connector_operator: admitted_for_draft_pr_only
  initial_pr_intent: connector-observed
  ready_for_review: HUMAN_ADMIT_REQUIRED
  merge: HUMAN_ADMIT_REQUIRED
  production_promotion: HUMAN_ADMIT_REQUIRED
```

Current branch publication is a GitHub connector lane. It must not be reported as Git Town sync, dual-forge delivery, GitHub Actions success, or remote ancestry proof.

## Stable stack

```text
main
└─ agent/00-bootstrap-control-plane
   └─ agent/01-contracts
      └─ agent/02-role-overlay-compiler
```
