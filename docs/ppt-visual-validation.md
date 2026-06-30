# PPT Visual Validation

The validation harness creates an actual PowerPoint file and verifies draw order from the PPTX XML.

Artifacts:

- `artifacts/ppt/design_components_z_order_validation.pptx`
- `artifacts/ppt/design_components_z_order_validation.svg`
- `artifacts/ppt/design_components_z_order_validation.png`
- `artifacts/ppt/z_order_report.json`

Validation performed:

- Confirms slide shape order in `ppt/slides/slide1.xml`.
- Confirms the expected topmost object at overlapping points through PNG pixel samples.
- Parses `slide1.xml` back out of the generated PPTX and renders the visual proof from parsed geometry and colors.
- For long-running codex-ppt-compatible review loops, validates
  `mdpr-job-state-v1` with `mdpr-skill codex-ppt job-state validate --state`
  or MDPR's mirrored `mdpresent job-state validate <state.json|build-dir>
  --json` command before treating recorded slide work as complete.

Job-state validation requires:

- statuses are one of `pending`, `dispatched`, `recorded`, `blocked`, or
  `accepted`;
- `recorded` and `accepted` tasks include artifact/report evidence;
- `blocked` tasks include a blocker reason;
- the boundary keeps renderer internals and chat-only completion out of the
  state artifact.

Environment note:

LibreOffice/PowerPoint rendering is not installed in this environment, so the visual proof is generated as a deterministic PNG from parsed PPTX XML geometry and colors. The PPTX itself is inspected directly for shape z-order.
