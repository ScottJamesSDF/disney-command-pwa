import type { Attraction, ParkId } from '@/domain/entities/attraction'

export interface AttractionRepository {
  getLiveAttractions(park: ParkId): Promise<Attraction[]>
  /** All attractions across every park — used to build catalog pickers (e.g. favorite/disliked lists). */
  getAllAttractions(): Promise<Attraction[]>
  /** Upserts by id — covers repositioning, toggling isOpen, and creating brand-new attractions. */
  saveAttraction(attraction: Attraction): Promise<void>
}
