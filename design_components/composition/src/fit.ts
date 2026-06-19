import type { Box } from './primitives/types';

export function isInsideSafeArea(box: Box, safe = { top: 0.08, right: 0.08, bottom: 0.08, left: 0.08 }): boolean {
  return box.x >= safe.left && box.y >= safe.top && box.x + box.w <= 1 - safe.right && box.y + box.h <= 1 - safe.bottom;
}

export function downshiftForDensity(box: Box, density: 'low' | 'medium' | 'high'): Box {
  if (density !== 'high') return box;
  return { ...box, x: box.x + 0.01, y: box.y + 0.01, w: Math.max(0.1, box.w - 0.02), h: Math.max(0.1, box.h - 0.02) };
}
