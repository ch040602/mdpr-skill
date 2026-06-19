# MDPR Design Components Pipeline

MDPR owns the content contract. The LLM may add semantic reasoning hints, but it does not choose coordinates, colors, variants, effects, or z-order. The Design Components rule layer makes those decisions deterministically and emits renderer-neutral output that can be rendered to editable PPTX, HTML, and PDF.

The generated pipeline overview uses this file as its content source. The image generator reads the `pipeline-image` block below, applies the project layout rules, embeds the SVG into a one-slide PowerPoint deck, and exports the final PNG through Microsoft PowerPoint.

The selected theme is `sage-editorial`: a clean slate, sage, and amber palette chosen to avoid a simple blue-dominant technical diagram while keeping the responsibility areas easy to scan.

<!-- pipeline-image
{
  "theme": "sage-editorial",
  "title": "MDPR Design Components Pipeline",
  "subtitle": "MDPR splits content. LLM reasoning supplies hints. Deterministic rules own layout, style, z-order, and editable rendering.",
  "regions": {
    "content": {
      "title": "1. Content Contract",
      "subtitle": "semantic structure only",
      "cards": {
        "markdown": {
          "title": "Markdown",
          "lines": ["text, tables, code", "images and notes"]
        },
        "splitter": {
          "title": "MDPR Splitter",
          "lines": ["slide and object split", "no visual choices"]
        }
      }
    },
    "reasoning": {
      "title": "2. LLM Reasoning",
      "subtitle": "optional intent hints",
      "cards": {
        "ir": {
          "title": "Slide Element IR",
          "lines": ["content-only contract"]
        },
        "result": {
          "title": "Reasoning Result",
          "lines": ["intent, grouping"],
          "badge": "hints only",
          "limit": "no coordinates or styles"
        }
      }
    },
    "rules": {
      "title": "3. Deterministic Design",
      "subtitle": "final visual choices",
      "engine": {
        "title": "Rule Engine Boundary",
        "line": "recipes, variants, z-order"
      },
      "cards": {
        "features": {
          "title": "Features",
          "lines": ["density, mix", "size risk"]
        },
        "recipes": {
          "title": "Recipes",
          "lines": ["profile match", "variant"]
        },
        "compose": {
          "title": "Compose",
          "lines": ["regions, fit", "overflow"]
        },
        "decorate": {
          "title": "Decorate",
          "lines": ["type, radius", "effects"]
        }
      }
    },
    "outputs": {
      "title": "4. Outputs",
      "subtitle": "PPTX, HTML, PDF",
      "cards": {
        "styledIr": {
          "title": "Styled Deck IR",
          "lines": ["renderer-neutral", "visual contract"]
        },
        "renderers": {
          "title": "Renderers",
          "lines": ["editable PPTX", "HTML and PDF"]
        }
      },
      "validation": "visual validation"
    }
  },
  "coherence": {
    "title": "Coherence checks",
    "line": "Hierarchy-scaled type, centered icon labels, bounded text, consistent spacing, aligned starts, and readable minimum sizes.",
    "badge": "font scale by role"
  }
}
-->
