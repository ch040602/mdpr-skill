# MDPR Eval-core Verification

This deck verifies that mdpr-skill can call the real MDPR runtime while keeping
layout, rendering, and validation decisions inside MDPR.

## Baseline and Guided Build

- Baseline: MDPR parses Markdown and renders editable PowerPoint.
- Guided: mdpr-skill provides weak semantic hints only.
- Boundary: hints cannot set final coordinates, colors, z-order, typography, or renderer object IDs.

## Evidence Table

The table below states the verification claim and the expected runtime evidence
for this MDPR build.

| Check | Expected |
| --- | --- |
| Source hash | Matches hint manifest |
| Agent hints | Accepted without forbidden fields |
| Output | Editable PPTX and HTML |
| Validation | No overflow or coherence errors |

## Runtime Flow

Claim: MDPR preserves source semantics and leaves final rendering decisions
inside MDPR.

- Markdown source enters MDPR.
- MDPR creates the plan and layout.
- mdpr-skill hints may add weak semantics.
- MDPR renders PPTX and HTML outputs.
