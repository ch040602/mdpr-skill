export interface Box { x: number; y: number; w: number; h: number }
export interface SafeArea { top: number; right: number; bottom: number; left: number }
export interface GridSpec { columns: number; rows: number; gap: number }
export interface RegionRule { id: string; role: string; box: Box; accepts: string[] }

export const DEFAULT_SAFE_AREA: SafeArea = { top: 0.08, right: 0.08, bottom: 0.08, left: 0.08 };
