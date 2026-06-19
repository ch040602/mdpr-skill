import type { Box } from './primitives/types';

export type InfographicIntent = 'auto' | 'cycle' | 'sequence' | 'list';
export type GraphDataShape = 'none' | 'ratio' | 'trend' | 'score' | 'comparison' | 'multiStage' | 'goal';

export interface InfographicItem {
  id: string;
  textChars: number;
  importance: 1 | 2 | 3 | 4 | 5;
  sourceOrder?: number;
  needsImage?: boolean;
  hasImage?: boolean;
}

export interface InfographicPlanSlot {
  id: string;
  box: Box;
  emphasis: 'lead' | 'high' | 'normal' | 'muted';
  textScale: 'display' | 'title' | 'body' | 'caption';
  colorRole: 'flow' | 'accent' | 'contrast' | 'support';
}

export interface InfographicPlan {
  family: 'cycle-loop' | 'ordered-rail' | 'ranked-stack';
  reason: string;
  slots: InfographicPlanSlot[];
}

export interface GraphDiagramInput {
  dataShape: GraphDataShape;
  textChars: number;
  itemCount: number;
  maxImportance: 1 | 2 | 3 | 4 | 5;
  hasChart?: boolean;
  hasImage?: boolean;
  needsImage?: boolean;
}

export interface GraphDiagramPlan {
  family:
    | 'arc-ring-chart'
    | 'gauge-dial-chart'
    | 'line-graph-background'
    | 'connected-chart-strip'
    | 'target-ring-frame'
    | 'pictorial-metaphor-chart'
    | 'native-chart-frame';
  alignment: 'center-focus-radial' | 'left-story-right-proof' | 'horizontal-small-multiples' | 'quadrant-fold';
  reason: string;
  emphasis: 'lead-chart' | 'foreground-proof' | 'image-anchor' | 'balanced';
}

const byImportance = (a: InfographicItem, b: InfographicItem): number => {
  if (b.importance !== a.importance) return b.importance - a.importance;
  return (a.sourceOrder ?? 0) - (b.sourceOrder ?? 0);
};

function averageTextChars(items: InfographicItem[]): number {
  if (!items.length) return 0;
  return items.reduce((sum, item) => sum + item.textChars, 0) / items.length;
}

function slotEmphasis(item: InfographicItem, leadId: string): InfographicPlanSlot['emphasis'] {
  if (item.id === leadId) return 'lead';
  if (item.importance >= 4) return 'high';
  if (item.importance <= 2) return 'muted';
  return 'normal';
}

function textScale(item: InfographicItem, emphasis: InfographicPlanSlot['emphasis']): InfographicPlanSlot['textScale'] {
  if (emphasis === 'lead' && item.textChars <= 64) return 'display';
  if (emphasis === 'lead') return 'title';
  if (item.textChars > 72) return 'caption';
  return emphasis === 'high' ? 'title' : 'body';
}

function colorRole(emphasis: InfographicPlanSlot['emphasis']): InfographicPlanSlot['colorRole'] {
  if (emphasis === 'lead') return 'contrast';
  if (emphasis === 'high') return 'accent';
  if (emphasis === 'muted') return 'support';
  return 'flow';
}

function selectFamily(intent: InfographicIntent, items: InfographicItem[]): InfographicPlan['family'] {
  const avgChars = averageTextChars(items);
  if (intent === 'cycle' && items.length >= 3 && items.length <= 6 && avgChars <= 56) return 'cycle-loop';
  if (intent === 'sequence' && items.length <= 7) return 'ordered-rail';
  if (intent === 'list') return 'ranked-stack';
  if (avgChars > 64 || items.length > 6) return 'ranked-stack';
  if (items.length >= 3 && items.length <= 5 && items.every((item) => item.textChars <= 72)) return 'cycle-loop';
  return 'ordered-rail';
}

function planCycle(items: InfographicItem[], leadId: string): InfographicPlanSlot[] {
  const cx = 0.5;
  const cy = 0.54;
  const rx = 0.32;
  const ry = 0.24;
  const sorted = [...items].sort((a, b) => (a.sourceOrder ?? 0) - (b.sourceOrder ?? 0));
  return sorted.map((item, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / sorted.length;
    const emphasis = slotEmphasis(item, leadId);
    const size = emphasis === 'lead' ? 0.19 : emphasis === 'high' ? 0.16 : 0.14;
    return {
      id: item.id,
      box: { x: cx + Math.cos(angle) * rx - size / 2, y: cy + Math.sin(angle) * ry - size / 2, w: size, h: size },
      emphasis,
      textScale: textScale(item, emphasis),
      colorRole: colorRole(emphasis),
    };
  });
}

function planOrderedRail(items: InfographicItem[], leadId: string): InfographicPlanSlot[] {
  const ordered = [...items].sort((a, b) => (a.sourceOrder ?? 0) - (b.sourceOrder ?? 0));
  const span = 0.78;
  const startX = 0.11;
  const gap = ordered.length <= 1 ? 0 : span / (ordered.length - 1);
  return ordered.map((item, index) => {
    const emphasis = slotEmphasis(item, leadId);
    const w = emphasis === 'lead' ? 0.16 : 0.13;
    const h = item.textChars > 70 ? 0.18 : 0.15;
    const y = index % 2 === 0 ? 0.36 : 0.55;
    return {
      id: item.id,
      box: { x: startX + gap * index - w / 2, y, w, h },
      emphasis,
      textScale: textScale(item, emphasis),
      colorRole: colorRole(emphasis),
    };
  });
}

function planRankedStack(items: InfographicItem[], leadId: string): InfographicPlanSlot[] {
  const ranked = [...items].sort(byImportance);
  return ranked.map((item, index) => {
    const emphasis = slotEmphasis(item, leadId);
    if (index === 0) {
      return {
        id: item.id,
        box: { x: 0.08, y: 0.22, w: 0.38, h: 0.54 },
        emphasis: 'lead',
        textScale: textScale(item, 'lead'),
        colorRole: 'contrast',
      };
    }
    const rowH = item.textChars > 80 ? 0.15 : 0.12;
    return {
      id: item.id,
      box: { x: 0.52, y: 0.22 + (index - 1) * 0.14, w: 0.4, h: rowH },
      emphasis,
      textScale: textScale(item, emphasis),
      colorRole: colorRole(emphasis),
    };
  });
}

export function planInfographicLayout(intent: InfographicIntent, items: InfographicItem[]): InfographicPlan {
  const normalized = items.map((item, index) => ({ ...item, sourceOrder: item.sourceOrder ?? index }));
  const lead = [...normalized].sort(byImportance)[0];
  const family = selectFamily(intent, normalized);
  const leadId = lead?.id ?? '';
  const slots =
    family === 'cycle-loop'
      ? planCycle(normalized, leadId)
      : family === 'ordered-rail'
        ? planOrderedRail(normalized, leadId)
        : planRankedStack(normalized, leadId);
  return {
    family,
    reason: `${family} selected from intent=${intent}, count=${normalized.length}, avgTextChars=${Math.round(averageTextChars(normalized))}`,
    slots,
  };
}

export function planGraphDiagram(input: GraphDiagramInput): GraphDiagramPlan {
  const longText = input.textChars > 72;
  const needsPictorial = Boolean(input.needsImage || (input.hasImage && input.maxImportance >= 4));

  if (needsPictorial && input.hasChart) {
    return {
      family: 'pictorial-metaphor-chart',
      alignment: 'left-story-right-proof',
      emphasis: 'image-anchor',
      reason: 'pictorial-metaphor-chart selected because chart content needs an image or metaphor anchor',
    };
  }
  if (input.dataShape === 'trend' && longText) {
    return {
      family: 'line-graph-background',
      alignment: 'left-story-right-proof',
      emphasis: 'foreground-proof',
      reason: 'line-graph-background selected because trend labels are too long for dense foreground charting',
    };
  }
  if (input.dataShape === 'score') {
    return {
      family: 'gauge-dial-chart',
      alignment: 'center-focus-radial',
      emphasis: input.maxImportance >= 4 ? 'lead-chart' : 'balanced',
      reason: 'gauge-dial-chart selected for score/range status data',
    };
  }
  if (input.dataShape === 'ratio' && input.itemCount <= 4 && !longText) {
    return {
      family: 'arc-ring-chart',
      alignment: 'center-focus-radial',
      emphasis: 'lead-chart',
      reason: 'arc-ring-chart selected for short ratio/progress labels',
    };
  }
  if (input.dataShape === 'goal' && input.itemCount <= 5) {
    return {
      family: 'target-ring-frame',
      alignment: 'center-focus-radial',
      emphasis: 'lead-chart',
      reason: 'target-ring-frame selected for goal or benchmark framing',
    };
  }
  if (input.dataShape === 'multiStage' || input.itemCount > 4) {
    return {
      family: 'connected-chart-strip',
      alignment: 'horizontal-small-multiples',
      emphasis: input.maxImportance >= 5 ? 'lead-chart' : 'balanced',
      reason: 'connected-chart-strip selected for multi-stage or many-item chart comparison',
    };
  }
  return {
    family: 'native-chart-frame',
    alignment: input.dataShape === 'comparison' ? 'quadrant-fold' : 'left-story-right-proof',
    emphasis: input.maxImportance >= 4 ? 'lead-chart' : 'balanced',
    reason: 'native-chart-frame selected as the editable fallback when no specialized chart family wins',
  };
}
