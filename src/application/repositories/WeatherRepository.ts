import type { WeatherSnapshot } from '@/domain/entities/weather'

export interface WeatherRepository {
  getCurrentWeather(lat: number, lng: number): Promise<WeatherSnapshot>
}
