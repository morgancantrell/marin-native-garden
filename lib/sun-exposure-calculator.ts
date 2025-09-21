export interface SunExposureData {
  hours: number;
  level: 'full-sun' | 'partial-sun' | 'shade';
  reason: string;
  seasonalAdjustment: number;
  totalHours: number;
}

// Marin County sun exposure zones based on local microclimates
const marinSunZones: Record<string, { baseHours: number; reason: string }> = {
  'mill valley': { baseHours: 5, reason: 'Redwood canopy and valley fog' },
  'tiburon': { baseHours: 7, reason: 'Hillside exposure with bay influence' },
  'belvedere': { baseHours: 7, reason: 'Elevated peninsula location' },
  'sausalito': { baseHours: 6, reason: 'Bay influence and hillside' },
  'san rafael': { baseHours: 6, reason: 'Valley location with mixed terrain' },
  'novato': { baseHours: 7, reason: 'Open valley with less fog' },
  'fairfax': { baseHours: 5, reason: 'Redwood forest and valley fog' },
  'corte madera': { baseHours: 6, reason: 'Mixed terrain and bay influence' },
  'larkspur': { baseHours: 5, reason: 'Redwood influence and valley' },
  'greenbrae': { baseHours: 6, reason: 'Hillside location with bay views' },
  'stinson beach': { baseHours: 5, reason: 'Coastal fog and marine layer' },
  'bolinas': { baseHours: 5, reason: 'Coastal fog and marine influence' },
  'point reyes': { baseHours: 6, reason: 'Coastal exposure with wind' },
  'inverness': { baseHours: 5, reason: 'Coastal fog and forest' },
  'muir beach': { baseHours: 5, reason: 'Coastal fog and marine layer' },
  'ross': { baseHours: 6, reason: 'Valley location with hillside influence' },
  'kentfield': { baseHours: 6, reason: 'Valley location with mixed terrain' },
  'san anselmo': { baseHours: 6, reason: 'Valley location with hillside influence' }
};

// Address-based heuristics for additional sun exposure clues
const addressHeuristics: Record<string, { adjustment: number; reason: string }> = {
  'north': { adjustment: -1, reason: 'North-facing slope' },
  'northside': { adjustment: -1, reason: 'North-facing slope' },
  'south': { adjustment: 1, reason: 'South-facing slope' },
  'southside': { adjustment: 1, reason: 'South-facing slope' },
  'valley': { adjustment: -0.5, reason: 'Valley location' },
  'canyon': { adjustment: -0.5, reason: 'Canyon location' },
  'ridge': { adjustment: 1, reason: 'Ridge location' },
  'hill': { adjustment: 0.5, reason: 'Hillside location' },
  'heights': { adjustment: 0.5, reason: 'Elevated location' },
  'beach': { adjustment: -0.5, reason: 'Coastal influence' },
  'coast': { adjustment: -0.5, reason: 'Coastal influence' },
  'bay': { adjustment: -0.5, reason: 'Bay influence' },
  'redwood': { adjustment: -1, reason: 'Redwood forest' },
  'forest': { adjustment: -1, reason: 'Forest area' },
  'oak': { adjustment: 0, reason: 'Oak woodland' },
  'meadow': { adjustment: 0.5, reason: 'Open meadow' },
  'field': { adjustment: 0.5, reason: 'Open field' }
};

// Seasonal adjustments for Marin County (accounts for fog patterns)
const seasonalAdjustments: Record<number, number> = {
  1: -0.5,   // January - peak fog season
  2: -0.5,   // February - fog season
  3: 0,      // March - transition
  4: 0.5,    // April - less fog
  5: 1,      // May - clear season begins
  6: 1.5,    // June - clear season
  7: 1.5,    // July - clear season
  8: 1,      // August - clear season
  9: 0.5,    // September - transition
  10: 0,     // October - fog returns
  11: -0.5,  // November - fog season
  12: -0.5   // December - fog season
};

export function calculateSunExposure(address: string, latitude?: number, longitude?: number): SunExposureData {
  const addressLower = address.toLowerCase();
  const currentMonth = new Date().getMonth() + 1;
  
  // Find matching city/area
  let baseData = { baseHours: 6, reason: 'Marin County average' };
  for (const [city, data] of Object.entries(marinSunZones)) {
    if (addressLower.includes(city)) {
      baseData = data;
      break;
    }
  }
  
  // Apply address-based heuristics
  let addressAdjustment = 0;
  let addressReason = '';
  for (const [keyword, heuristic] of Object.entries(addressHeuristics)) {
    if (addressLower.includes(keyword)) {
      addressAdjustment += heuristic.adjustment;
      if (!addressReason) addressReason = heuristic.reason;
    }
  }
  
  // Apply seasonal adjustment
  const seasonalAdjustment = seasonalAdjustments[currentMonth] || 0;
  
  // Calculate total hours
  const totalHours = Math.max(3, Math.min(10, baseData.baseHours + addressAdjustment + seasonalAdjustment));
  
  // Determine sun level
  let level: 'full-sun' | 'partial-sun' | 'shade';
  if (totalHours >= 7) {
    level = 'full-sun';
  } else if (totalHours >= 5) {
    level = 'partial-sun';
  } else {
    level = 'shade';
  }
  
  // Combine reasons
  const reasons = [baseData.reason];
  if (addressReason) reasons.push(addressReason);
  if (seasonalAdjustment !== 0) {
    const seasonName = seasonalAdjustment > 0 ? 'clear season' : 'fog season';
    reasons.push(`Marin County ${seasonName}`);
  }
  
  return {
    hours: Math.round(totalHours * 10) / 10,
    level,
    reason: reasons.join(', '),
    seasonalAdjustment,
    totalHours
  };
}

export function getSunRecommendation(sunData: SunExposureData): string {
  switch (sunData.level) {
    case 'full-sun':
      return 'Full sun plants: California Poppy, Yarrow, California Buckwheat, Blueblossom';
    case 'partial-sun':
      return 'Partial sun plants: Toyon, Coffeeberry, California Sagebrush, Sticky Monkeyflower';
    case 'shade':
      return 'Shade plants: Western Sword Fern, Woodland Strawberry, Redwood Sorrel, California Hazelnut';
    default:
      return 'Mixed sun/shade plants work best in your location';
  }
}

export function getSunColor(level: string): string {
  switch (level) {
    case 'full-sun':
      return '#ef4444'; // Red
    case 'partial-sun':
      return '#f59e0b'; // Amber
    case 'shade':
      return '#22c55e'; // Green
    default:
      return '#6b7280'; // Gray
  }
}
