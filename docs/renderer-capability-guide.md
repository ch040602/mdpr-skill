# Renderer Capability Guide

PPTX renders editable text, shapes, tables, and charts. HTML emits semantic structure, CSS variables, data attributes, and optional motion classes. PDF uses the HTML print path with static effect fallbacks.

Generated visual assets are asset-level inputs, not an alternate renderer.
`mdpr-generated-assets-v1` records provider id, model, prompt hash, source input
hashes, size, quality, background, transparency policy, output path, and
provider capability metadata. Validation rejects secrets and full-slide
renderer requests; MDPR still owns placement, theme binding, and PPTX objects.
