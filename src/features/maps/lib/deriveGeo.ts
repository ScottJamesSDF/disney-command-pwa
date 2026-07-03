import type { ParkId } from '@/domain/entities/attraction'

interface HubAnchor {
  mapX: number
  mapY: number
  lat: number
  lng: number
}

// Same hub reference points and scale constants used when the catalog's mapX/mapY/latitude/
// longitude/walkFromHubMinutes were originally authored — kept here so repositioning a pin (or
// adding a new one) never leaves those derived fields silently out of sync with its map position.
const HUBS: Partial<Record<ParkId, HubAnchor>> = {
  disneyland: { mapX: 0.5, mapY: 0.58, lat: 33.8121, lng: -117.919 },
  californiaAdventure: { mapX: 0.5, mapY: 0.85, lat: 33.8078, lng: -117.9198 },
}
const LAT_SCALE = 0.0045 // degrees latitude per map-unit (north positive)
const LNG_SCALE = 0.0054 // degrees longitude per map-unit (east positive)
const MINUTES_PER_UNIT = 26 // walkFromHubMinutes per map-unit distance from hub

export interface DerivedGeo {
  latitude: number
  longitude: number
  walkFromHubMinutes: number
}

export function deriveGeo(park: ParkId, mapX: number, mapY: number): DerivedGeo {
  const hub = HUBS[park] ?? { mapX: 0.5, mapY: 0.5, lat: 0, lng: 0 }
  const dx = mapX - hub.mapX
  const dy = hub.mapY - mapY // north positive
  const dist = Math.sqrt(dx * dx + dy * dy)
  return {
    latitude: Math.round((hub.lat + dy * LAT_SCALE) * 10_000) / 10_000,
    longitude: Math.round((hub.lng + dx * LNG_SCALE) * 10_000) / 10_000,
    walkFromHubMinutes: Math.max(1, Math.round(dist * MINUTES_PER_UNIT)),
  }
}
