import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { freshDb } from '@/test/dbTestUtils'
import type { DisneyCommandDB } from '../../local/db'
import { OpenMeteoWeatherRepository } from '../OpenMeteoWeatherRepository'

const LAT = 28.4177
const LNG = -81.5812

function mockFetchOnce(response: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: async () => response,
    }),
  )
}

describe('OpenMeteoWeatherRepository', () => {
  let db: DisneyCommandDB
  let repository: OpenMeteoWeatherRepository

  beforeEach(async () => {
    db = await freshDb()
    repository = new OpenMeteoWeatherRepository(db)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps a successful Open-Meteo response into a WeatherSnapshot and caches it', async () => {
    mockFetchOnce({
      current: {
        temperature_2m: 91.4,
        apparent_temperature: 97.2,
        precipitation_probability: 20,
        weather_code: 1,
        wind_speed_10m: 6.5,
      },
    })

    const snapshot = await repository.getCurrentWeather(LAT, LNG)

    expect(snapshot.temperatureF).toBe(91.4)
    expect(snapshot.condition).toBe('clear')
    expect(snapshot.isStale).toBe(false)

    const cached = await db.weatherCache.get(`${LAT.toFixed(4)},${LNG.toFixed(4)}`)
    expect(cached?.temperatureF).toBe(91.4)
  })

  it('falls back to the cached reading (marked stale) when the live request fails', async () => {
    mockFetchOnce(
      {
        current: {
          temperature_2m: 88,
          apparent_temperature: 92,
          precipitation_probability: 10,
          weather_code: 0,
          wind_speed_10m: 4,
        },
      },
      true,
    )
    await repository.getCurrentWeather(LAT, LNG)

    mockFetchOnce({}, false)
    const snapshot = await repository.getCurrentWeather(LAT, LNG)

    expect(snapshot.isStale).toBe(true)
    expect(snapshot.temperatureF).toBe(88)
  })

  it('throws when the request fails and there is no cached reading', async () => {
    mockFetchOnce({}, false)

    await expect(repository.getCurrentWeather(LAT, LNG)).rejects.toThrow()
  })
})
