import type { Box } from './primitives/types';

export function detectBoxCollisions(boxes: Box[]): Array<[number, number]> {
  const collisions: Array<[number, number]> = [];
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      if (overlaps(boxes[i], boxes[j])) collisions.push([i, j]);
    }
  }
  return collisions;
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
