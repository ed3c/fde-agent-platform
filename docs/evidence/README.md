# External FDE case evidence lane

Issue: #23 · atom `I23-D/E`.

This directory separates external source statements from repository runtime evidence. It does not validate the commercial or technical claims made by Varick, Lingyang, or cited research merely because a transcript contains them.

## Evidence states

```text
SOURCE_REPORTED
→ PRIMARY_SOURCE_CONFIRMED
→ ARTIFACT_OBTAINED
→ INDEPENDENTLY_REPRODUCED / CONTRADICTED
```

`UNKNOWN` and `NOT_EXERCISED` remain valid terminal dispositions for the current review period. `PASS` is not a valid source-evidence state.

## Admission law

- Original media/transcript and timestamp bind the claim wording.
- A primary source confirms only that the source made the statement.
- A production or benchmark claim needs inspectable artifacts and a reproducible protocol.
- Synthetic analogs in this repository test architecture contracts; they do not reproduce customer outcomes.
- Private customer artifacts stay in the admitted private lane.
- Any architecture change caused by evidence is tracked in its owning Issue and Shadow Architecture ledger.

## Files

- `source-ledger.json` — machine-readable claim ledger.
- `claim-matrix.md` — claim, current status, missing evidence, and repository route.

## Verification

```bash
node scripts/check-source-evidence.mjs docs/evidence/source-ledger.json
node --test test/source-evidence-ledger.test.mjs
```
