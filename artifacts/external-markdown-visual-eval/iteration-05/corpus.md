# External Markdown Visual Evaluation

> One deterministic MDPR rule path converts 20+ downloaded Markdown documents into editable PPTX slides.

## Runtime Boundary

- **MDPR**
  Parses Markdown, keeps graphs whole, selects layouts, applies theme colors, renders PPTX, and validates overflow.
- **mdpr-skill**
  Collects evidence and may add review notes, but does not choose final coordinates, colors, typography, or object geometry.
- **Evaluation target**
  Compare generated slides against research/product teaser expectations: clear focal message, hierarchy, restrained contrast, and bounded text.

## Unified Pipeline

Downloaded Markdown => MDPR Parser => Slide Splitter => Layout Planner => PPTX Renderer => PNG Visual QA => Improvement Notes

## Teaser Rubric

| Criterion | Requirement | Failure Signal |
| --- | --- | --- |
| Focal message | One readable headline and primary object | no dominant title or all-text wall |
| Hierarchy | title >= section >= body; proof objects carry emphasis | tiny title or random accents |
| Coherence | same-rule layouts across every source | per-source manual styling |
| Boundaries | text and shapes stay inside slide and parent boxes | overflow or clipped rows |
| Teaser quality | resembles a paper/product teaser in density and polish | blank, generic, or palette-only output |

## Iteration Plan

- Current pass: iteration 5 of 5.
- All passes use the same MDPR parser, layout planner, PPTX renderer, and visual validation path.
- The corpus is one combined deck, not a set of hand-tuned per-file decks.

## Feedback Applied

- Convert long imported paragraphs into bounded executive bullets before MDPR layout.
- Keep source identity as section context, not as large decorative badges.
- Preserve tables, code fences, and pipeline syntax so MDPR can choose the right object family.

## Evidence Mix

```chart
labels: Sources, Headings, Tables, Code
Corpus: 24, 96, 18, 21
Useful: 20, 72, 12, 14
```

- The chart is generated from corpus-level structure rather than a custom drawing path.
- This adds a teaser-style proof object without per-source tuning.

## Project Pipeline Source

Markdown intake => Semantic tags => Deterministic MDPR rules => Editable PPTX => Rendered PNG validation

- Pipeline content is included as Markdown and rendered by MDPR's normal diagram path.
- No separate pipeline drawing code is used in this evaluation deck.

## Local Pipeline Notes

- MDPR owns the presentation runtime. The LLM is optional and only provides short semantic tags when needed; it does not reason through layout, choose coordinates, colors, variants, 
- Optional agent tags are hints only. Deterministic rules own layout, style, z-order, theme colors, proof objects, icon slots, and renderer-specific output.
- The generated pipeline overview uses this file as its content source. The image generator reads the pipeline-image block below, applies the project layout rules, builds a one-slide
- The selected theme is sage-editorial: a warm editorial palette that combines flow colors, section accents, validation contrast, and quiet support surfaces. Point elements such as v

## 01. React

> React is evaluated as a Markdown-to-PPTX coherence source.

- **Structure**
  9 headings, 0 table-like lines, 1 fenced code blocks.
- **Design target**
  Preserve hierarchy while avoiding repeated card-only continuation slides.

## 02. Vite

```chart
labels: Headings, Tables, Code
Source: 5, 5, 0
```

- **Source**
  `vite`
- **Proof use**
  Numeric structure is shown as a chart beside explanatory text.

## 03. Vue

- **Before**
  Imported Markdown often becomes a repeated list-card continuation.
- **After**
  The same source is routed through comparison, table, chart, or diagram layouts when the structure supports it.

## 04. Svelte

Markdown intake => Svelte structure => MDPR layout choice => PPTX visual QA


## 05. TypeScript

| Signal | Value | Use |
| --- | ---: | --- |
| Headings | 5 | section planning |
| Tables | 0 | table-aware layout |
| Code fences | 2 | code-focus layout |

## 06. Node.js

- **Source**
  `node` from `https://raw.githubusercontent.com/nodejs/node/main/README.md`
- **Structure**
  17 headings, 0 table-like lines, 3 fenced code blocks.
- Current and LTS releases
- Contributing to Node.js
- Current project team members
- TSC (Technical Steering Committee)

### Code Sample

```bash
curl -fsLo "/path/to/nodejs-keyring.kbx" "https://github.com/nodejs/release-keys/raw/HEA
```

## 07. Express

> Express is evaluated as a Markdown-to-PPTX coherence source.

- **Structure**
  14 headings, 0 table-like lines, 11 fenced code blocks.
- **Design target**
  Preserve hierarchy while avoiding repeated card-only continuation slides.

## 08. FastAPI

```chart
labels: Headings, Tables, Code
Source: 28, 0, 12
```

- **Source**
  `fastapi`
- **Proof use**
  Numeric structure is shown as a chart beside explanatory text.

## 09. OpenAI Python API library

- **Before**
  Imported Markdown often becomes a repeated list-card continuation.
- **After**
  The same source is routed through comparison, table, chart, or diagram layouts when the structure supports it.

## 10. LangChain

Markdown intake => LangChain structure => MDPR layout choice => PPTX visual QA


## 11. Playwright

| Signal | Value | Use |
| --- | ---: | --- |
| Headings | 22 | section planning |
| Tables | 12 | table-aware layout |
| Code fences | 22 | code-focus layout |

## 12. Tailwind CSS

- **Source**
  `tailwindcss` from `https://raw.githubusercontent.com/tailwindlabs/tailwindcss/main/README.md`
- **Structure**
  3 headings, 0 table-like lines, 0 fenced code blocks.
- A utility-first CSS framework for rapidly building custom user interfaces.
- If you're interested in contributing to Tailwind CSS, please read our contributing docs **before submitting a pull request**.

## 13. Kubernetes (K8s)

> Kubernetes (K8s) is evaluated as a Markdown-to-PPTX coherence source.

- **Structure**
  8 headings, 0 table-like lines, 2 fenced code blocks.
- **Design target**
  Preserve hierarchy while avoiding repeated card-only continuation slides.

## 14. Rust

```chart
labels: Headings, Tables, Code
Source: 7, 0, 0
```

- **Source**
  `rust`
- **Proof use**
  Numeric structure is shown as a chart beside explanatory text.

## 15. PyTorch

- **Before**
  Imported Markdown often becomes a repeated list-card continuation.
- **After**
  The same source is routed through comparison, table, chart, or diagram layouts when the structure supports it.

## 16. TensorFlow

Markdown intake => TensorFlow structure => MDPR layout choice => PPTX visual QA


## 17. pandas: A Powerful Python Data Analysis Toolkit

| Signal | Value | Use |
| --- | ---: | --- |
| Headings | 15 | section planning |
| Tables | 5 | table-aware layout |
| Code fences | 5 | code-focus layout |

## 18. NumPy

- **Source**
  `numpy` from `https://raw.githubusercontent.com/numpy/numpy/main/README.md`
- **Structure**
  0 headings, 0 table-like lines, 0 fenced code blocks.
- ****Website**
  ** https://numpy.org
- ****Documentation**
  ** https://numpy.org/doc
- ****Mailing list**
  ** https://mail.python.org/mailman/listinfo/numpy-discussion
- ****Source code**
  ** https://github.com/numpy/numpy

## 19. Transformers

> Transformers is evaluated as a Markdown-to-PPTX coherence source.

- **Structure**
  13 headings, 0 table-like lines, 10 fenced code blocks.
- **Design target**
  Preserve hierarchy while avoiding repeated card-only continuation slides.

## 20. D3: Data-Driven Documents

```chart
labels: Headings, Tables, Code
Source: 2, 0, 0
```

- **Source**
  `d3`
- **Proof use**
  Numeric structure is shown as a chart beside explanatory text.

## 21. Apache ECharts

- **Before**
  Imported Markdown often becomes a repeated list-card continuation.
- **After**
  The same source is routed through comparison, table, chart, or diagram layouts when the structure supports it.

## 22. Plotly.py

Markdown intake => Plotly.py structure => MDPR layout choice => PPTX visual QA


## 23. The System Design Primer

| Signal | Value | Use |
| --- | ---: | --- |
| Headings | 112 | section planning |
| Tables | 132 | table-aware layout |
| Code fences | 9 | code-focus layout |
