import type { SlideNode } from '../../../../src-scaffolds/element-ir-types';

export function selectElementVariants(slide: SlideNode): Record<string, string> {
  return Object.fromEntries(slide.elements.map((element) => [element.id, defaultVariantFor(element.type, slide.density)]));
}

export type CardListRelation =
  | 'plain'
  | 'sequence'
  | 'ranking'
  | 'comparison'
  | 'proof'
  | 'constraint'
  | 'checklist'
  | 'flow';

export interface CardDecorationInput {
  hasImage?: boolean;
  hasKeyNumber?: boolean;
  importance?: 1 | 2 | 3 | 4 | 5;
  textChars?: number;
  itemCount?: number;
  relation?: CardListRelation;
  density?: 'low' | 'medium' | 'high';
}

export interface CardDecorationStyle {
  id: string;
  score(input: Required<CardDecorationInput>): number;
}

const cardDecorationStyles: CardDecorationStyle[] = [
  { id: 'plain-safe-card', score: (i) => (i.density === 'high' || i.textChars > 180 ? 120 : 0) },
  { id: 'image-sidecar-card', score: (i) => (i.hasImage && i.textChars > 70 ? 105 : 0) },
  { id: 'floating-label-pin', score: (i) => (i.hasImage && i.textChars <= 70 ? 98 : 0) },
  { id: 'caption-underlay', score: (i) => (i.hasImage && i.textChars > 120 ? 92 : 0) },
  { id: 'metric-lead-card', score: (i) => (i.hasKeyNumber && i.importance >= 5 ? 112 : 0) },
  { id: 'rank-ribbon', score: (i) => (i.hasKeyNumber && i.relation === 'ranking' ? 104 : 0) },
  { id: 'bottom-meter', score: (i) => (i.hasKeyNumber && ['proof', 'flow'].includes(i.relation) ? 88 : 0) },
  { id: 'proof-chip-inline', score: (i) => (i.relation === 'proof' && i.importance >= 4 ? 102 : 0) },
  { id: 'bracket-callout', score: (i) => (['proof', 'constraint'].includes(i.relation) && i.textChars <= 120 ? 96 : 0) },
  { id: 'constraint-stack-card', score: (i) => (i.relation === 'constraint' ? 110 : 0) },
  { id: 'paired-contrast-edge', score: (i) => (i.relation === 'comparison' && i.itemCount <= 2 ? 94 : 0) },
  { id: 'split-tone-row', score: (i) => (i.relation === 'comparison' ? 84 : 0) },
  { id: 'table-summary-card', score: (i) => (i.relation === 'comparison' && i.textChars > 130 ? 72 : 0) },
  { id: 'number-tab', score: (i) => (i.relation === 'sequence' && i.textChars <= 90 ? 100 : 0) },
  { id: 'horizontal-step-rail', score: (i) => (i.relation === 'sequence' && i.itemCount <= 5 && i.textChars <= 90 ? 92 : 0) },
  { id: 'vertical-step-rail', score: (i) => (i.relation === 'sequence' && i.textChars > 90 ? 90 : 0) },
  { id: 'connector-dot-card', score: (i) => (i.relation === 'flow' ? 88 : 0) },
  { id: 'checklist-grid-card', score: (i) => (i.relation === 'checklist' && i.itemCount >= 4 ? 90 : 0) },
  { id: 'dot-marker-row', score: (i) => (i.relation === 'plain' && i.density !== 'high' ? 78 : 0) },
  { id: 'left-accent-rail', score: (i) => (i.relation === 'plain' && i.importance >= 3 ? 76 : 0) },
  { id: 'top-hairline-rule', score: (i) => (i.relation === 'plain' && i.importance <= 2 ? 70 : 0) },
  { id: 'corner-chip', score: (i) => (i.importance >= 4 && i.textChars <= 80 ? 82 : 0) },
  { id: 'side-notch', score: (i) => (i.importance >= 4 && i.textChars > 80 ? 80 : 0) },
  { id: 'soft-shadow-lift', score: (i) => (i.density === 'low' && i.importance >= 4 ? 68 : 0) },
  { id: 'micro-icon-marker', score: (i) => (!i.hasImage && i.density === 'low' && i.textChars < 110 ? 64 : 0) },
  { id: 'double-rule-header', score: (i) => (i.itemCount >= 3 && i.itemCount <= 6 ? 58 : 0) },
  { id: 'inset-label-bar', score: (i) => (i.textChars <= 70 && i.importance >= 3 ? 54 : 0) },
  { id: 'quote-rule-card', score: (i) => (i.textChars > 90 && i.itemCount <= 1 ? 52 : 0) },
  { id: 'label-overline-card', score: (i) => (i.textChars <= 100 ? 48 : 0) },
  { id: 'subtle-band-card', score: (i) => (i.density === 'medium' ? 46 : 0) },
  { id: 'thin-outline-card', score: (i) => (i.density !== 'low' ? 44 : 0) },
  { id: 'arc-corner-emphasis', score: (i) => (i.hasKeyNumber && i.relation === 'proof' ? 42 : 0) },
  { id: 'target-ring-badge', score: (i) => (i.hasKeyNumber && i.relation === 'constraint' ? 40 : 0) },
];

export function selectCardDecorationStyle(input: CardDecorationInput): string {
  const normalized: Required<CardDecorationInput> = {
    hasImage: input.hasImage ?? false,
    hasKeyNumber: input.hasKeyNumber ?? false,
    importance: input.importance ?? 3,
    textChars: input.textChars ?? 80,
    itemCount: input.itemCount ?? 1,
    relation: input.relation ?? 'plain',
    density: input.density ?? 'medium',
  };

  return [...cardDecorationStyles]
    .map((style) => ({ id: style.id, score: style.score(normalized) }))
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))[0]?.id ?? 'plain-safe-card';
}

export function listCardDecorationStyleIds(): string[] {
  return cardDecorationStyles.map((style) => style.id);
}

function defaultVariantFor(type: string, density: string): string {
  const compact = density === 'high' ? '.compact' : '';
  const map: Record<string, string> = {
    title: `title${compact || '.hero'}`,
    paragraph: `paragraph${compact || '.body'}`,
    bulletList: `list${compact || '.checklist'}`,
    numberedList: `list${compact || '.stepCards'}`,
    kpi: `kpi${compact || '.heroNumber'}`,
    metric: `kpi${compact || '.inlineMetric'}`,
    chart: `chart${compact || '.cardWithContext'}`,
    table: `table${compact || '.compactGrid'}`,
    code: `code${compact || '.window'}`,
    callout: `callout${compact || '.insight'}`,
    quote: `quote${compact || '.editorial'}`,
    image: `image${compact || '.cardFrame'}`,
  };
  return map[type] ?? `paragraph${compact || '.body'}`;
}
