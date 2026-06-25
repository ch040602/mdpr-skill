# Phase 15 - Agent Hints

## Goal

Use agent reasoning only as semantic hints when needed, while design decisions remain rule-based.

## Tasks

- [x] Add `AgentHint` schema.
- [x] Implement allowed fields whitelist.
- [x] Implement forbidden fields blacklist.
- [x] Implement hint merge policy.
- [x] Implement confidence/validation policy.
- [x] Test agent-disabled mode.
- [x] Test malicious/invalid hints.
- [x] Show hint usage in inspect output.

## Acceptance

- [x] Agent hints cannot directly specify recipe or variant.
- [x] Agent hints cannot specify box, color, or effect.
- [x] Builds succeed when the agent is disabled.
- [x] Agent hint output affects only validated semantic features.
