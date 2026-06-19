import type { Box } from './primitives/types';

export type InfographicIntent = 'auto' | 'cycle' | 'sequence' | 'list';

export interface InfographicItem {
  id: string;
  textChars: number;
  importance: 1 | 2 | 3 | 4 | 5;
  sourceOrder?: number;
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
