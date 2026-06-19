# Design Components Port Coverage

- Source: external-design-source
- Ref: `32c1d336f63ecfb181946b9f5f2713eb4fc97369`
- Status: complete

## Counts

- Docs: 10
- CSS files: 3
- Token files: 6
- Skins: 7
- Motion seeds: 5
- Motion keywords: 22
- UI components: 32
- Pattern components: 16

## Mapping Policy

Every Design Components source element is mapped to a renderer-neutral MDPR adaptation category; React runtime behavior is converted to static PPTX/PDF plans or semantic HTML.

## Missing

- None

## UI Components

- `accordion` -> static-ui-pattern
- `alert` -> static-ui-pattern
- `avatar` -> identity
- `badge` -> label
- `button` -> action
- `card` -> surface
- `checkbox` -> toggle-control
- `confirm-modal` -> static-ui-pattern
- `data-display` -> static-ui-pattern
- `dialog` -> modal-surface
- `drawer` -> bottom-panel
- `dropdown-menu` -> static-ui-pattern
- `form` -> static-ui-pattern
- `input` -> form-field
- `label` -> static-ui-pattern
- `motion` -> static-ui-pattern
- `popover` -> static-ui-pattern
- `progress` -> progress-indicator
- `radio-group` -> static-ui-pattern
- `scroll-area` -> static-ui-pattern
- `segmented-control` -> static-ui-pattern
- `select` -> option-picker
- `separator` -> static-ui-pattern
- `sheet` -> side-panel
- `skeleton` -> loading-placeholder
- `switch` -> toggle-control
- `table` -> table
- `tabs` -> segmented-navigation
- `textarea` -> form-field
- `toggle` -> toggle-control
- `toggle-group` -> segmented-control
- `tooltip` -> static-ui-pattern

## Pattern Components

- `bottom-nav` -> bottom.nav
- `briefing-carousel` -> briefing.carousel
- `chart-card` -> chart.card
- `donut-chart-card` -> donut.chart.card
- `empty-state` -> empty.state
- `hero-card` -> hero.card
- `insight-card` -> insight.card
- `list-item` -> list.item
- `news-card` -> news.card
- `page-shell` -> page.shell
- `progress-bar` -> progress.bar
- `ranked-list` -> ranked.list
- `section-card` -> section.card
- `stat-card` -> stat.card
- `top-bar` -> top.bar
- `value-display` -> value.display

## Motion Keywords

- `blob-morph` -> PPTX/PDF static fallback + optional HTML motion keyword
- `confetti-pop` -> PPTX/PDF static fallback + optional HTML motion keyword
- `glow-pulse` -> PPTX/PDF static fallback + optional HTML motion keyword
- `gradient-sweep` -> PPTX/PDF static fallback + optional HTML motion keyword
- `magnetic` -> PPTX/PDF static fallback + optional HTML motion keyword
- `pop-in` -> PPTX/PDF static fallback + optional HTML motion keyword
- `press-squish` -> PPTX/PDF static fallback + optional HTML motion keyword
- `pulse-beat` -> PPTX/PDF static fallback + optional HTML motion keyword
- `reveal-blur` -> PPTX/PDF static fallback + optional HTML motion keyword
- `reveal-rise` -> PPTX/PDF static fallback + optional HTML motion keyword
- `reveal-unfold` -> PPTX/PDF static fallback + optional HTML motion keyword
- `shimmer` -> PPTX/PDF static fallback + optional HTML motion keyword
- `spotlight` -> PPTX/PDF static fallback + optional HTML motion keyword
- `stagger-cascade` -> PPTX/PDF static fallback + optional HTML motion keyword
- `tap-ripple` -> PPTX/PDF static fallback + optional HTML motion keyword
- `text-scramble` -> PPTX/PDF static fallback + optional HTML motion keyword
- `tilt-3d` -> PPTX/PDF static fallback + optional HTML motion keyword
- `toggle-curtain` -> PPTX/PDF static fallback + optional HTML motion keyword
- `toggle-flip` -> PPTX/PDF static fallback + optional HTML motion keyword
- `toggle-morph` -> PPTX/PDF static fallback + optional HTML motion keyword
- `toggle-slide` -> PPTX/PDF static fallback + optional HTML motion keyword
- `wiggle` -> PPTX/PDF static fallback + optional HTML motion keyword
