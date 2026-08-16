# Opportunity and Outcome Charter contracts

Issue: #25 · atom `I25-C`.

## State machine

```text
CANDIDATE → SCORED → BASELINED → PILOT_PLANNED
      └────────────→ REJECTED / HUMAN_REVIEW_REQUIRED
```

## Contract boundary

The three-high heuristic is only an input signal. Admission requires explicit value, frequency, observability, controllability, reversibility, attribution, reuse, integration cost, risk, and organizational resistance.

A pilot is a bounded technical, safety, and value experiment. It is not slideware and it does not authorize production.

## Forbidden transitions

- fixed ROI claim before baseline evidence;
- outcome-linked pricing with a disputed or stale baseline;
- high-risk pilot without a safety POC;
- post-hoc weakening of kill criteria after results are visible;
- payment, final posting, deletion, overwrite, or permission change in a first pilot.

## Verification

```bash
node --test test/discovery-contracts.test.mjs
```
