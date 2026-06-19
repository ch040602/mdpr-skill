# Phase 13 — Coherence Lint

## Goal

디자인 다양화가 AI slop으로 흐르지 않도록 deck-level coherence를 강제한다.

## Tasks

- [x] mixed radius family lint.
- [x] mixed shadow family lint.
- [x] mixed spacing scale lint.
- [x] mixed type scale lint.
- [x] multiple primary accents lint.
- [x] arbitrary raw hex lint.
- [x] excessive decorative effects lint.
- [x] repeated same layout kind rhythm lint.
- [x] dense slide expressive effect lint.
- [x] icon/accent mismatch lint.
- [x] title rhythm mismatch lint.
- [x] card surface inconsistency lint.

## Severity

```text
error: output should fail in strict mode
warn: output allowed but reported
info: debug-only note
```

## Acceptance

- [x] deliberate mixed radius fixture fails.
- [x] deliberate raw hex fixture fails.
- [x] high-density expressive effect fixture fails or downshifts.
- [x] normal profile gallery passes.
