import type { SlideNode } from '../../../../src-scaffolds/element-ir-types';

export function selectElementVariants(slide: SlideNode): Record<string, string> {
  return Object.fromEntries(slide.elements.map((element) => [element.id, defaultVariantFor(element.type, slide.density)]));
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
