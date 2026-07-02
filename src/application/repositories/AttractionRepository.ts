import type { Attraction, ParkId } from '@/domain/entities/attraction'

export interface AttractionRepository {
  getLiveAttractions(park: ParkId): Promise<Attraction[]>
}
