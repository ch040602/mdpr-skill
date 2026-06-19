# MDPR Skill Release Check

## Scope

- MDPR owns the runtime.
- mdpr-skill is a thin Codex skill wrapper around MDPR.
- The skill may prepare compact semantic hints and review artifacts.
- The skill does not choose coordinates, colors, typography, shapes, z-order, arrows, or renderer objects.

## Verified Conditions

- Editable PPTX output uses PowerPoint text, shapes, tables, charts, and connectors.
- Pipeline teaser PPTX contains no embedded SVG or flattened picture.
- Text boxes use middle alignment for cards, callouts, table cells, row labels, badges, and marker glyphs.
- Circle, rounded badge, number marker, alphabet marker, and icon marker glyphs are horizontally and vertically centered in their container.
- Adjacent marker text aligns to marker midpoint on the vertical axis.
- Graphs and diagrams stay on a single slide.
- Straight connectors are used when endpoints share an axis.
- Elbow connectors use 90 degree segments when endpoints are offset.
- Same-role arrows share color, weight, and dash style.
- Theme colors follow Adobe Color Wheel harmony rules.
- PowerPoint document theme colors are populated from MDPR theme slots.
- Table text is vertically centered with readable margins.
- Long spaces and hard tabs are normalized before rendering.
- Minimum readable PPTX text size is enforced.
- Text-only slides may use one small monotone icon aside.
- Icons do not fill empty space as large decoration.
- PPT BIZCAM-derived object rules are structural references only.
- Original downloaded PPT files remain in `.cache`, not in the repository.

## Generated Evidence

- Pipeline teaser: `docs/assets/pipeline-overview.pptx`
- Pipeline report: `docs/assets/pipeline-overview-report.json`
- Final pipeline artifact: `artifacts/final-pipeline-overview/mdpr-pipeline-final.pptx`
- MDPR vs skill report: `artifacts/mdpr-vs-skill/mdpr-vs-skill-report.json`
- PPT BIZCAM recursive report: `artifacts/pptbizcam-analysis/pptbizcam-recursive-object-rules.json`
- Object catalog deck: `artifacts/intro-decks/element-catalog/deck.pptx`

## Result

- The release check is written as bullet-style Markdown.
- The rendered release deck must keep all visible text at or above the readable font floor.
- The rendered release deck must pass PowerPoint export validation.
