export function buildMotionCss(enabled: boolean): string {
  if (!enabled) return '@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}';
  return '.motion-static-subtle{transition:opacity 180ms ease}';
}
