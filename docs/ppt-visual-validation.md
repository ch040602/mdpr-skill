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

Environment note:

LibreOffice/PowerPoint rendering is not installed in this environment, so the visual proof is generated as a deterministic PNG from parsed PPTX XML geometry and colors. The PPTX itself is inspected directly for shape z-order.
