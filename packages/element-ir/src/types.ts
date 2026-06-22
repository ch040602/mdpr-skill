export type SlideIntent =
  | "cover"
  | "section"
  | "agenda"
  | "content"
  | "data"
  | "comparison"
  | "process"
  | "timeline"
  | "diagram"
  | "code"
  | "summary"
  | "appendix";

export type Density = "low" | "medium" | "high";

export type ElementType =
  | "title"
  | "subtitle"
  | "paragraph"
  | "bulletList"
  | "numberedList"
  | "quote"
  | "callout"
  | "table"
  | "chart"
  | "image"
  | "figure"
  | "code"
  | "equation"
  | "kpi"
  | "metric"
  | "timeline"
  | "process"
  | "comparison"
  | "prosCons"
  | "definition"
  | "warning"
  | "success"
  | "reference"
  | "footnote"
  | "caption";

export type ElementRole =
  | "primary"
  | "secondary"
  | "supporting"
  | "evidence"
  | "annotation"
  | "metadata"
  | "action";

export interface SlideElementIR {
  version: "1.0";
  deck: DeckMeta;
  slides: SlideNode[];
}

export interface DeckMeta {
  id?: string;
  title?: string;
  ratio: "16:9" | "4:3";
  language?: string;
}

export interface SlideNode {
  id: string;
  intent: SlideIntent;
  density: Density;
  elements: ElementNode[];
  groups?: ElementGroup[];
  readingOrder: string[];
}

export interface ElementNode<TContent = unknown> {
  id: string;
  type: ElementType;
  role: ElementRole;
  importance: 1 | 2 | 3 | 4 | 5;
  content: TContent;
  contentMetrics: ContentMetrics;
  constraints?: ElementConstraints;
  source?: ElementSource;
}

export interface ContentMetrics {
  textChars?: number;
  lineCount?: number;
  itemCount?: number;
  rowCount?: number;
  columnCount?: number;
  tableCellCount?: number;
  numericDensity?: number;
  imageAspectRatio?: number;
  codeLineCount?: number;
}

export interface ElementConstraints {
  mustStayTogether?: boolean;
  canCollapse?: boolean;
  canSummarize?: boolean;
  preferredAspectRatio?: number;
  minReadableSize?: number;
}

export interface ElementSource {
  markdownRange?: [number, number];
  headingPath?: string[];
}

export interface ElementGroup {
  id: string;
  role: "hero" | "metricSet" | "evidenceSet" | "steps" | "comparisonPair" | "chartContext" | "references";
  elementIds: string[];
  relation: "sequence" | "parallel" | "contrast" | "causeEffect" | "support" | "detail";
}
