import type { ContentMetrics } from '../../element-ir/src/types.js';

export function computeContentMetrics(block: { text?: string; items?: string[]; rows?: unknown[][]; kind?: string }): ContentMetrics {
  const text = block.text ?? '';
  const items = block.items ?? [];
  const rows = block.rows ?? [];
  return {
    textChars: text.length + items.join(' ').length,
    lineCount: text ? text.split(/\r?\n/).length : items.length,
    itemCount: items.length,
    rowCount: rows.length,
    columnCount: rows[0]?.length ?? 0,
    tableCellCount: undefined,
    numericDensity: countNumbers(text) / Math.max(1, text.length),
    codeLineCount: block.kind === 'code' ? text.split(/\r?\n/).length : 0,
  };
}

function countNumbers(text: string): number {
  return (text.match(/\d/g) ?? []).length;
}
