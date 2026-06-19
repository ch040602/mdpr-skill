export function renderStyledElementToPptxObject(element: { id: string; variantId: string; box: unknown }) {
  return {
    id: element.id,
    editable: true,
    kind: element.variantId.startsWith('table.') ? 'table' : element.variantId.startsWith('chart.') ? 'chart' : 'shape',
    box: element.box,
  };
}
