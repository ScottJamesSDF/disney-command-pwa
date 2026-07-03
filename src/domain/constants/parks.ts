import type { Area, ParkId } from '@/domain/entities/attraction'

export const MAGIC_KINGDOM_COORDS = { lat: 28.4177, lng: -81.5812 }

export const PARK_NAMES: Record<ParkId, string> = {
  magicKingdom: 'Magic Kingdom',
  epcot: 'EPCOT',
  hollywoodStudios: "Disney's Hollywood Studios",
  animalKingdom: "Disney's Animal Kingdom",
  disneyland: 'Disneyland Park',
  californiaAdventure: 'Disney California Adventure',
}

export const PARK_EMOJIS: Record<ParkId, string> = {
  magicKingdom: '🏰',
  epcot: '🌐',
  hollywoodStudios: '🎬',
  animalKingdom: '🌳',
  disneyland: '🏰',
  californiaAdventure: '🎢',
}

export const AREA_NAMES: Record<Area, string> = {
  mainStreetUSA: 'Main Street, U.S.A.',
  adventureland: 'Adventureland',
  frontierland: 'Frontierland',
  libertySquare: 'Liberty Square',
  fantasyland: 'Fantasyland',
  tomorrowland: 'Tomorrowland',
  worldCelebration: 'World Celebration',
  worldDiscovery: 'World Discovery',
  worldNature: 'World Nature',
  worldShowcase: 'World Showcase',
  hollywoodBoulevard: 'Hollywood Boulevard',
  echoLake: 'Echo Lake',
  grandAvenue: 'Grand Avenue',
  starWarsGalaxysEdge: "Star Wars: Galaxy's Edge",
  toyStoryLand: 'Toy Story Land',
  sunsetBoulevard: 'Sunset Boulevard',
  discoveryIsland: 'Discovery Island',
  africaArea: 'Africa',
  asia: 'Asia',
  dinoLand: 'DinoLand U.S.A.',
  pandora: 'Pandora – The World of Avatar',
  newOrleansSquare: 'New Orleans Square',
  mickeysToontown: "Mickey's Toontown",
  critterCountry: 'Critter Country',
  buenaVistaStreet: 'Buena Vista Street',
  hollywoodLand: 'Hollywood Land',
  carsLand: 'Cars Land',
  pixarPier: 'Pixar Pier',
  grizzlyPeak: 'Grizzly Peak',
  avengersCampus: 'Avengers Campus',
  paradiseGardensPark: 'Paradise Gardens Park',
}
