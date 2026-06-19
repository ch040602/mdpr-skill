export interface DesignComponentsCliOptions {
  styleEngine?: 'legacy' | 'design-components';
  styleSelect?: 'rule-based';
  profile?: string;
  styleGallery?: string[];
  rulebook?: string;
}

export function mergeStyleConfig(base: DesignComponentsCliOptions, file: DesignComponentsCliOptions, cli: DesignComponentsCliOptions): DesignComponentsCliOptions {
  return { ...base, ...file, ...cli };
}
