import type { Area } from '@/domain/entities/attraction'

const NEUTRAL_LAND_COLOR = 'bg-muted-foreground/60'

/**
 * Fixed, never-cycled land -> categorical-slot assignment (dataviz skill rule: hues are assigned
 * in a stable order, not generated per dataset). Disneyland has 9 lands but the validated palette
 * only has 8 slots — Main Street, U.S.A. (a 2-attraction transit corridor, not a touring land)
 * folds into the neutral color instead of getting a 9th generated hue.
 */
const AREA_COLORS: Partial<Record<Area, string>> = {
  // Disneyland
  adventureland: 'bg-map-land-1',
  frontierland: 'bg-map-land-2',
  fantasyland: 'bg-map-land-3',
  tomorrowland: 'bg-map-land-4',
  starWarsGalaxysEdge: 'bg-map-land-5',
  newOrleansSquare: 'bg-map-land-6',
  mickeysToontown: 'bg-map-land-7',
  bayouCountry: 'bg-map-land-8',
  // California Adventure
  hollywoodLand: 'bg-map-land-1',
  carsLand: 'bg-map-land-2',
  sanFransokyoSquare: 'bg-map-land-3',
  pixarPier: 'bg-map-land-4',
  grizzlyPeak: 'bg-map-land-5',
  avengersCampus: 'bg-map-land-6',
  paradiseGardensPark: 'bg-map-land-7',
}

export function getAreaColorClass(area: Area): string {
  return AREA_COLORS[area] ?? NEUTRAL_LAND_COLOR
}
