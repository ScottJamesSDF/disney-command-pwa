import { describe, expect, it } from 'vitest'
import { generateItinerary } from '../generateItinerary'
import {
  makeAttraction,
  makeFamily,
  makeFamilyMember,
  makeParkDay,
} from '../../engines/__tests__/fixtures'

describe('generateItinerary', () => {
  it('caps selection at the pace-based budget for a short day', () => {
    const parkDay = makeParkDay({
      arrivalTime: { hour: 9, minute: 0 },
      parkCloseTime: { hour: 10, minute: 0 }, // 1 hour → round(1 * 2.5) = 3
    })
    const family = makeFamily([makeFamilyMember({ age: 30 })])
    const liveAttractions = Array.from({ length: 8 }, (_, i) =>
      makeAttraction({ id: `attraction_${i}`, isOpen: true, currentWaitMinutes: 10 }),
    )

    const result = generateItinerary({ parkDay, family, liveAttractions })

    expect(result).toHaveLength(3)
  })

  it('caps selection at the absolute max for a long day, not the uncapped pace number', () => {
    const parkDay = makeParkDay({
      arrivalTime: { hour: 9, minute: 0 },
      parkCloseTime: { hour: 22, minute: 0 }, // 13 hours → round(13 * 2.5) = 33, capped at 12
    })
    const family = makeFamily([makeFamilyMember({ age: 30 })])
    const liveAttractions = Array.from({ length: 20 }, (_, i) =>
      makeAttraction({ id: `attraction_${i}`, isOpen: true, currentWaitMinutes: 10 }),
    )

    const result = generateItinerary({ parkDay, family, liveAttractions })

    expect(result).toHaveLength(12)
  })

  it('excludes an attraction disliked by any member even when it would score highest', () => {
    const parkDay = makeParkDay()
    const family = makeFamily([
      makeFamilyMember({ age: 30, dislikedAttractions: ['disliked_one'] }),
    ])
    const liveAttractions = [
      makeAttraction({ id: 'disliked_one', currentWaitMinutes: 5, tags: ['must-do'] }),
      makeAttraction({ id: 'fine_one', currentWaitMinutes: 10 }),
    ]

    const result = generateItinerary({ parkDay, family, liveAttractions })

    expect(result.map((r) => r.attractionId)).not.toContain('disliked_one')
    expect(result.map((r) => r.attractionId)).toContain('fine_one')
  })

  it('boosts a favorited attraction ahead of a higher-raw-score, unfavorited one', () => {
    const parkDay = makeParkDay({
      arrivalTime: { hour: 9, minute: 0 },
      parkCloseTime: { hour: 22, minute: 0 }, // long enough budget that both fit
    })
    const family = makeFamily([
      makeFamilyMember({ age: 30, favoriteAttractions: ['favorite_low_score'] }),
    ])
    const liveAttractions = [
      // Higher raw score (wait <=30 bucket, +25) but not favorited.
      makeAttraction({ id: 'high_raw_score', currentWaitMinutes: 20 }),
      // Lower raw score (wait >45, +0) but favorited — the +35 bonus (35 > 25) should push it ahead.
      makeAttraction({ id: 'favorite_low_score', currentWaitMinutes: 50 }),
    ]

    const result = generateItinerary({ parkDay, family, liveAttractions })
    const ids = result.map((r) => r.attractionId)

    expect(ids.indexOf('favorite_low_score')).toBeLessThan(ids.indexOf('high_raw_score'))
  })

  it('excludes attraction ids already planned on other days of the trip', () => {
    const parkDay = makeParkDay()
    const family = makeFamily([makeFamilyMember({ age: 30 })])
    const liveAttractions = [
      makeAttraction({ id: 'used_elsewhere', currentWaitMinutes: 5, tags: ['must-do'] }),
      makeAttraction({ id: 'still_available', currentWaitMinutes: 10 }),
    ]

    const result = generateItinerary({
      parkDay,
      family,
      liveAttractions,
      excludedAttractionIds: new Set(['used_elsewhere']),
    })

    expect(result.map((r) => r.attractionId)).not.toContain('used_elsewhere')
    expect(result.map((r) => r.attractionId)).toContain('still_available')
  })

  it('excludes closed attractions and dining-type attractions', () => {
    const parkDay = makeParkDay()
    const family = makeFamily([makeFamilyMember({ age: 30 })])
    const liveAttractions = [
      makeAttraction({ id: 'closed_one', isOpen: false }),
      makeAttraction({ id: 'dining_one', type: 'dining' }),
      makeAttraction({ id: 'open_ride', isOpen: true, type: 'ride' }),
    ]

    const result = generateItinerary({ parkDay, family, liveAttractions })
    const ids = result.map((r) => r.attractionId)

    expect(ids).not.toContain('closed_one')
    expect(ids).not.toContain('dining_one')
    expect(ids).toContain('open_ride')
  })

  it('returns an empty array (not a crash) when there are no live attractions', () => {
    const result = generateItinerary({
      parkDay: makeParkDay(),
      family: makeFamily(),
      liveAttractions: [],
    })

    expect(result).toEqual([])
  })

  it('works without excludedAttractionIds passed at all', () => {
    const result = generateItinerary({
      parkDay: makeParkDay(),
      family: makeFamily(),
      liveAttractions: [makeAttraction()],
    })

    expect(result).toHaveLength(1)
  })

  it('produces correctly-shaped PlannedAttraction output', () => {
    const parkDay = makeParkDay()
    const family = makeFamily([makeFamilyMember({ age: 30 })])
    const liveAttractions = [
      makeAttraction({
        id: 'll_ready',
        name: 'LL Ready Ride',
        hasLightningLane: true,
        lightningLaneAvailable: true,
      }),
      makeAttraction({
        id: 'll_not_available',
        name: 'LL Unavailable Ride',
        hasLightningLane: true,
        lightningLaneAvailable: false,
      }),
    ]

    const result = generateItinerary({ parkDay, family, liveAttractions })

    result.forEach((planned, index) => {
      expect(planned.plannedOrder).toBe(index)
      expect(planned.isCompleted).toBe(false)
      expect(planned.completedAt).toBeNull()
      expect(planned.isSkipped).toBe(false)
    })

    const llReady = result.find((r) => r.attractionId === 'll_ready')
    const llUnavailable = result.find((r) => r.attractionId === 'll_not_available')
    expect(llReady?.usedLightningLane).toBe(true)
    expect(llUnavailable?.usedLightningLane).toBe(false)
  })
})
