import type { WeatherRepository } from '@/application/repositories/WeatherRepository'
import {
  WeatherSnapshotSchema,
  type WeatherCondition,
  type WeatherSnapshot,
} from '@/domain/entities/weather'
import type { DisneyCommandDB } from '../local/db'

/**
 * Maps WMO weather codes (https://open-meteo.com/en/docs) to our simplified
 * condition enum.
 */
function mapWeatherCode(code: number): WeatherCondition {
  if (code === 0 || code === 1) return 'clear'
  if (code === 2 || code === 3 || (code >= 45 && code <= 48)) return 'cloudy'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if (code >= 95 && code <= 99) return 'storm'
  return 'other'
}

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number
    apparent_temperature: number
    precipitation_probability: number
    weather_code: number
    wind_speed_10m: number
  }
}

/**
 * Free, no-API-key weather data source (https://open-meteo.com). Falls back
 * to the last successfully cached reading (marked `isStale: true`) if the
 * live request fails, so the Dashboard always has something to render.
 */
export class OpenMeteoWeatherRepository implements WeatherRepository {
  private readonly db: DisneyCommandDB

  constructor(db: DisneyCommandDB) {
    this.db = db
  }

  async getCurrentWeather(lat: number, lng: number): Promise<WeatherSnapshot> {
    try {
      const snapshot = await this.fetchLive(lat, lng)
      await this.db.weatherCache.put({ key: cacheKey(lat, lng), ...snapshot })
      return snapshot
    } catch {
      const cached = await this.db.weatherCache.get(cacheKey(lat, lng))
      if (!cached) {
        throw new Error('Weather is unavailable and no cached reading exists.')
      }
      return WeatherSnapshotSchema.parse({ ...cached, isStale: true })
    }
  }

  private async fetchLive(lat: number, lng: number): Promise<WeatherSnapshot> {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(lat))
    url.searchParams.set('longitude', String(lng))
    url.searchParams.set(
      'current',
      'temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m',
    )
    url.searchParams.set('temperature_unit', 'fahrenheit')
    url.searchParams.set('wind_speed_unit', 'mph')

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Open-Meteo request failed with status ${response.status}`)
    }

    const data = (await response.json()) as OpenMeteoResponse

    return WeatherSnapshotSchema.parse({
      temperatureF: data.current.temperature_2m,
      feelsLikeF: data.current.apparent_temperature,
      condition: mapWeatherCode(data.current.weather_code),
      precipitationChance: data.current.precipitation_probability,
      windMph: data.current.wind_speed_10m,
      fetchedAt: new Date().toISOString(),
      isStale: false,
    })
  }
}
