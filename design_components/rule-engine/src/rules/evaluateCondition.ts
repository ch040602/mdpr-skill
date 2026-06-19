import type { SlideFeatures } from '../../../../src-scaffolds/rule-engine-types';

export function evaluateCondition(condition: string, features: SlideFeatures): boolean {
  switch (condition) {
    case 'hasChart':
      return features.hasChart;
    case 'hasTable':
      return features.hasTable;
    case 'hasCode':
      return features.hasCode;
    case 'hasKpi':
      return features.hasKpi;
    case 'highDensity':
      return features.density === 'high' || features.informationDensity >= 4;
    case 'longCode':
      return features.codeLineCount > 24;
    case 'largeTable':
      return features.tableCellCount > 24;
    case 'textHeavy':
      return features.totalTextChars > 900;
    default:
      return false;
  }
}
