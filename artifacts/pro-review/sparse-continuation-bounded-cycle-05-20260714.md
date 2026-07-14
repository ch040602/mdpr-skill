# Visual evidence Pro review — bounded cycle 5/5

## Provider evidence

- Status: `complete`
- Session: `01KXFH2BSER2K6Q0CYXG9E9DFS`
- Conversation: `https://chatgpt.com/c/6a54e470-a2bc-83e8-aa5a-5ae4916e88f2`
- Requested model: `pro`; effort flag omitted
- Verification: exact `Pro` composer pill on the post-completion ChatGPT
  surface; the legacy model selector reported unavailable
- Inputs: refreshed RDD structure/completeness context, cycle-4 rejection
  evidence, and the PowerPoint-exported Agenda slide

## Provider candidate and decision

Pro proposed splitting slash-delimited Agenda labels into multiple identically
styled runs inside the existing text shape. The proposal was explicitly
conditional on an A/B PowerPoint export proving that run segmentation removed
the repeated suffix.

`reject` — finding `RDD-F-378e9356e3`.

The causal premise failed before a runtime change was justified:

- raw slide XML contains each affected source string once;
- PowerPoint COM returns the exact item text once and reports item 10 as one
  laid-out line at 18pt;
- the PowerPoint PNG is indexed-palette evidence;
- a true-color render at a unique path shows items 10 and 13 once, without the
  alleged repeated suffix.

Changing MDPR text runs would therefore alter correct editable runtime output
to compensate for a review-display artifact.

## Accepted local TODO

`RDD-T-00000126` normalizes each comparison PNG to true-color RGB immediately
after the isolated PowerPoint export stabilizes. The conversion is atomic and
has a regression proving that palette input retains the same RGB pixel values.
It does not change the PPTX, text runs, font size, slide geometry, or source.

## Validation result

- PowerPoint export: 35/35 MDPR slides and 9/9 review slides
- Invalid slides: 0
- Minimum font: 16pt in both decks
- Named-container overflow: 0
- Tracked comparison previews: 8/8 RGB
- Comparison report: `ok:true`
