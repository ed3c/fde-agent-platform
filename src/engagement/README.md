# Engagement evidence ingestion contracts

Issue: #26 · atom `I26-C`.

## State machine

```text
SOURCE_REGISTERED → PARSED → REDACTED → CLAIM_CANDIDATE
                                      → ENTITY_CANDIDATE
                                      → AMBIGUOUS / HUMAN_REVIEW_REQUIRED
```

Ingestion never emits organizational truth. It emits exact-source candidates, parse completeness, redaction evidence, and unresolved ambiguity.

## Inputs and outputs

```text
private source bytes + authorization + parser identity
→ public-safe source manifest / claim candidate / entity-link candidate
```

Private bytes stay in the admitted private lane. Public GitHub contains only synthetic fixtures and contract behavior.

## Forbidden transitions

- parsed text directly becoming an admitted fact;
- same-name entity guessed without review;
- degraded source reported with certainty;
- missing redaction evidence for protected input;
- embedded authentication in a source locator;
- source or claim crossing a tenant boundary.

## Verification

```bash
node --test test/engagement-contracts.test.mjs
```
