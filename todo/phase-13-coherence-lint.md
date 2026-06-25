# Phase 13 - Coherence Lint

## Goal

Enforce deck-level coherence so design diversity does not drift into generic or inconsistent output.

## Tasks

- [x] Mixed radius family lint.
- [x] Mixed shadow family lint.
- [x] Mixed spacing scale lint.
- [x] Mixed type scale lint.
- [x] Multiple primary accents lint.
- [x] Arbitrary raw hex lint.
- [x] Excessive decorative effects lint.
- [x] Repeated same layout kind rhythm lint.
- [x] Dense slide expressive effect lint.
- [x] Icon/accent mismatch lint.
- [x] Title rhythm mismatch lint.
- [x] Card surface inconsistency lint.

## Severity

```text
error: output should fail in strict mode
warn: output is allowed but reported
info: debug-only note
```

## Acceptance

- [x] Deliberate mixed radius fixture fails.
- [x] Deliberate raw hex fixture fails.
- [x] High-density expressive effect fixture fails or downshifts.
- [x] Normal profile gallery passes.
