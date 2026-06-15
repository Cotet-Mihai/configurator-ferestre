import type { GlassCount, ActivePane } from './types';

export interface DimensionLimits {
  minW: number;
  maxW: number;
  minH: number;
  maxH: number;
}

export function getDimensionLimits(
  glassCount: GlassCount | null,
  opens: boolean | null,
  activePane: ActivePane | null,
): DimensionLimits {
  if (glassCount === 2) {
    if (!opens) {
      // fix + fix
      return { minW: 100, maxW: 300, minH: 40, maxH: 210 };
    }
    if (activePane === 'both') {
      // mobil + mobil
      return { minW: 100, maxW: 210, minH: 50, maxH: 210 };
    }
    // fix + mobil
    return { minW: 100, maxW: 210, minH: 50, maxH: 210 };
  }

  // 1 geam
  if (!opens) {
    // fix
    return { minW: 50, maxW: 150, minH: 40, maxH: 210 };
  }
  // mobil (cu deschidere sau oscilobatant)
  return { minW: 50, maxW: 105, minH: 50, maxH: 210 };
}
