import { z } from 'zod'

export const AttractionTypeSchema = z.enum([
  'ride',
  'show',
  'character',
  'dining',
  'entertainment',
  'photo',
  'shop',
])
export type AttractionType = z.infer<typeof AttractionTypeSchema>

export const ParkIdSchema = z.enum([
  'magicKingdom',
  'epcot',
  'hollywoodStudios',
  'animalKingdom',
  'disneyland',
  'californiaAdventure',
])
export type ParkId = z.infer<typeof ParkIdSchema>

export const AreaSchema = z.enum([
  // Magic Kingdom
  'mainStreetUSA',
  'adventureland',
  'frontierland',
  'libertySquare',
  'fantasyland',
  'tomorrowland',
  // EPCOT
  'worldCelebration',
  'worldDiscovery',
  'worldNature',
  'worldShowcase',
  // Hollywood Studios
  'hollywoodBoulevard',
  'echoLake',
  'grandAvenue',
  'starWarsGalaxysEdge',
  'toyStoryLand',
  'sunsetBoulevard',
  // Animal Kingdom
  'discoveryIsland',
  'africaArea',
  'asia',
  'dinoLand',
  'pandora',
  // Disneyland only (mainStreetUSA/adventureland/frontierland/fantasyland/tomorrowland/
  // starWarsGalaxysEdge are shared with Magic Kingdom/Hollywood Studios — same land concept,
  // `park` on Attraction already disambiguates which physical park an attraction belongs to)
  'newOrleansSquare',
  'mickeysToontown',
  'critterCountry',
  // California Adventure
  'buenaVistaStreet',
  'hollywoodLand',
  'carsLand',
  'pixarPier',
  'grizzlyPeak',
  'avengersCampus',
  'paradiseGardensPark',
])
export type Area = z.infer<typeof AreaSchema>

export const AttractionSchema = z.object({
  id: z.string(),
  name: z.string(),
  park: ParkIdSchema,
  area: AreaSchema,
  type: AttractionTypeSchema,
  description: z.string(),
  averageWaitMinutes: z.number().int().nonnegative(),
  currentWaitMinutes: z.number().int().nonnegative(),
  hasLightningLane: z.boolean(),
  lightningLaneAvailable: z.boolean(),
  lightningLaneReturnTime: z.string().datetime().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  mapX: z.number().min(0).max(1),
  mapY: z.number().min(0).max(1),
  durationMinutes: z.number().int().positive(),
  isOpen: z.boolean(),
  tags: z.array(z.string()),
  thrillLevel: z.number().int().min(1).max(5),
  heightRequirement: z.string().nullable(),
  isGalaxysEdge: z.boolean().default(false),
  photoTip: z.string().nullable(),
  walkFromHubMinutes: z.number().int().nonnegative(),
})
export type Attraction = z.infer<typeof AttractionSchema>

export function isHighWait(attraction: Attraction): boolean {
  return attraction.currentWaitMinutes > 60
}

export function isMediumWait(attraction: Attraction): boolean {
  return attraction.currentWaitMinutes > 30 && attraction.currentWaitMinutes <= 60
}

export function isLowWait(attraction: Attraction): boolean {
  return attraction.currentWaitMinutes <= 30
}
