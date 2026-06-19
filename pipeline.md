# MDPR Deterministic Presentation Pipeline

MDPR owns the presentation runtime. The LLM is optional and only provides short semantic tags when needed; it does not reason through layout, choose coordinates, colors, variants, effects, or z-order. MDPR makes those decisions deterministically and emits renderer-neutral output that can be rendered to editable PPTX, HTML, and PDF.

Optional agent tags are hints only. Deterministic rules own layout, style, z-order, theme colors, proof objects, icon slots, and renderer-specific output.

The generated pipeline overview uses this file as its content source. The image generator reads the `pipeline-image` block below, applies the project layout rules, builds a one-slide PowerPoint deck from editable shapes, text boxes, and role-aware arrows, and exports the final PNG through Microsoft PowerPoint.

The selected theme is `sage-editorial`: a warm editorial palette that combines flow colors, section accents, validation contrast, and quiet support surfaces. Point elements such as `visual validation` use a different proof-callout pattern, not only a stronger hue.

<!-- pipeline-image
{
  "theme": "sage-editorial",
  "title": "MDPR Deterministic Presentation Pipeline",
  "subtitle": "Markdown becomes coherent PPTX/HTML/PDF through MDPR rules; mdpr-skill can add compact reasoning hints but never owns final design.",
  "seed": "visual-diversification-seeds/proof-point-callout",
  "regions": {
    "content": {
      "title": "1. Content Contract",
      "subtitle": "semantic structure only",
      "cards": {
        "markdown": {
          "title": "Markdown",
          "lines": ["headings, tables", "charts and images"]
        },
        "splitter": {
          "title": "MDPR Splitter",
          "lines": ["Pandoc or simple AST", "slide/object split"]
        }
      }
    },
    "reasoning": {
      "title": "2. Agent Hints",
      "subtitle": "small optional tags",
      "cards": {
        "ir": {
          "title": "Slide Element IR",
          "lines": ["semantic blocks", "graph kept whole"]
        },
        "result": {
          "title": "Hint Packet",
          "lines": ["intent + importance"],
          "badge": "hints only",
          "limit": "no coordinates or styles"
        }
      }
    },
    "rules": {
      "title": "3. MDPR Design Rules",
      "subtitle": "final visual choices",
      "engine": {
        "title": "Rule Engine Boundary",
        "line": "recipes, colors, z-order"
      },
      "cards": {
        "features": {
          "title": "Features",
          "lines": ["density", "size risk"]
        },
        "recipes": {
          "title": "Recipes",
          "lines": ["profile", "variant"]
        },
        "theme": {
          "title": "Theme",
          "lines": ["harmony", "PPT accents"]
        },
        "compose": {
          "title": "Compose",
          "lines": ["regions", "overflow"]
        },
        "objects": {
          "title": "Objects",
          "lines": ["charts", "icons"]
        },
        "decorate": {
          "title": "Decorate",
          "lines": ["type", "effects"]
        }
      }
    },
    "outputs": {
      "title": "4. Outputs",
      "subtitle": "PPTX, HTML, PDF",
      "cards": {
        "styledIr": {
          "title": "Styled Deck IR",
          "lines": ["renderer-neutral", "coherent contract"]
        },
        "renderers": {
          "title": "Renderers",
          "lines": ["editable PPTX", "HTML / PDF"]
        }
      },
      "validation": "visual validation"
    }
  },
  "coherence": {
    "title": "Coherence checks",
    "line": "One graph per slide; text is bounded; icons are centered; arrows keep role-level style."
  }
}
-->
