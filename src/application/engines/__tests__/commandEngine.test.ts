import { describe, expect, it } from 'vitest'
import {
  checkFamilyEnergy,
  checkHydration,
  checkImminentDining,
  checkImminentEntertainment,
  checkLightningLaneWindow,
  findBestAvailableAttraction,
  generateCommandQueue,
  generateUpcomingCommands,
  getNextPlannedAttraction,
} from '../commandEngine'
import {
  CURRENT_TIME,
  isoHoursFrom,
  isoMinutesFrom,
  makeAttraction,
  makeDiningReservation,
  makeEntertainmentEvent,
  makeFamily,
  makeFamilyMember,
  makeParkDay,
  makePlannedAttraction,
} from './fixtures'

describe('checkLightningLaneWindow', () => {
  it('returns a critical rideNow command when the LL window is already open', () => {
    const attraction = makeAttraction({
      id: 'attraction_a',
      hasLightningLane: true,
      lightningLaneReturnTime: isoMinutesFrom(CURRENT_TIME, -2),
    })
    const parkDay = makeParkDay({
      plannedAttractions: [makePlannedAttraction({ attractionId: 'attraction_a' })],
    })

    const result = checkLightningLaneWindow(parkDay, [attraction], CURRENT_TIME)

    expect(result?.type).toBe('rideNow')
    expect(result?.priority).toBe('critical')
    expect(result?.waitMinutes).toBe(5)
  })

  it('returns a high-priority walk command when the LL window opens within 10 minutes', () => {
    const attraction = makeAttraction({
      id: 'attraction_a',
      hasLightningLane: true,
      lightningLaneReturnTime: isoMinutesFrom(CURRENT_TIME, 8),
    })
    const parkDay = makeParkDay({
      plannedAttractions: [makePlannedAttraction({ attractionId: 'attraction_a' })],
    })

    const result = checkLightningLaneWindow(parkDay, [attraction], CURRENT_TIME)

    expect(result?.type).toBe('walkToAttraction')
    expect(result?.priority).toBe('high')
  })

  it('returns null when the LL window is more than 10 minutes away', () => {
    const attraction = makeAttraction({
      id: 'attraction_a',
      hasLightningLane: true,
      lightningLaneReturnTime: isoMinutesFrom(CURRENT_TIME, 30),
    })
    const parkDay = makeParkDay({
      plannedAttractions: [makePlannedAttraction({ attractionId: 'attraction_a' })],
    })

    expect(checkLightningLaneWindow(parkDay, [attraction], CURRENT_TIME)).toBeNull()
  })
})

describe('checkImminentDining', () => {
  it('returns a critical command for a reservation within -15..0 minutes', () => {
    const parkDay = makeParkDay({
      diningReservations: [
        makeDiningReservation({ reservationTime: isoMinutesFrom(CURRENT_TIME, -10) }),
      ],
    })
    const result = checkImminentDining(parkDay, CURRENT_TIME)
    expect(result?.type).toBe('headToDining')
    expect(result?.priority).toBe('critical')
  })

  it('returns a high-priority command for a reservation within 0..20 minutes', () => {
    const parkDay = makeParkDay({
      diningReservations: [
        makeDiningReservation({ reservationTime: isoMinutesFrom(CURRENT_TIME, 15) }),
      ],
    })
    const result = checkImminentDining(parkDay, CURRENT_TIME)
    expect(result?.type).toBe('headToDining')
    expect(result?.priority).toBe('high')
  })

  it('returns null for a reservation further than 20 minutes away', () => {
    const parkDay = makeParkDay({
      diningReservations: [
        makeDiningReservation({ reservationTime: isoMinutesFrom(CURRENT_TIME, 45) }),
      ],
    })
    expect(checkImminentDining(parkDay, CURRENT_TIME)).toBeNull()
  })

  it('checks the earliest of multiple reservations first', () => {
    const parkDay = makeParkDay({
      diningReservations: [
        makeDiningReservation({
          restaurantName: 'Later Restaurant',
          reservationTime: isoMinutesFrom(CURRENT_TIME, 45),
        }),
        makeDiningReservation({
          restaurantName: 'Sooner Restaurant',
          reservationTime: isoMinutesFrom(CURRENT_TIME, 10),
        }),
      ],
    })
    const result = checkImminentDining(parkDay, CURRENT_TIME)
    expect(result?.locationName).toBe('Sooner Restaurant')
  })
})

describe('checkImminentEntertainment', () => {
  it('returns an immediate watchShow command within -5..5 minutes of recommended arrival', () => {
    const parkDay = makeParkDay({
      entertainment: [
        makeEntertainmentEvent({
          showTime: isoMinutesFrom(CURRENT_TIME, 5),
          recommendedArrivalMinutesBefore: 3,
        }),
      ],
    })
    const result = checkImminentEntertainment(parkDay, CURRENT_TIME)
    expect(result?.type).toBe('watchShow')
    expect(result?.headline).toMatch(/NOW/)
  })

  it('returns a head-to watchShow command within 5..20 minutes of recommended arrival', () => {
    const parkDay = makeParkDay({
      entertainment: [
        makeEntertainmentEvent({
          showTime: isoMinutesFrom(CURRENT_TIME, 30),
          recommendedArrivalMinutesBefore: 20,
        }),
      ],
    })
    const result = checkImminentEntertainment(parkDay, CURRENT_TIME)
    expect(result?.type).toBe('watchShow')
    expect(result?.headline).toMatch(/^Head to/)
  })

  it('checks the earliest of multiple events first', () => {
    const parkDay = makeParkDay({
      entertainment: [
        makeEntertainmentEvent({
          name: 'Later Show',
          showTime: isoMinutesFrom(CURRENT_TIME, 60),
          recommendedArrivalMinutesBefore: 5,
        }),
        makeEntertainmentEvent({
          name: 'Sooner Show',
          showTime: isoMinutesFrom(CURRENT_TIME, 8),
          recommendedArrivalMinutesBefore: 3,
        }),
      ],
    })
    const result = checkImminentEntertainment(parkDay, CURRENT_TIME)
    expect(result?.headline).toContain('Sooner Show')
  })
})

describe('checkFamilyEnergy', () => {
  it('returns a high-priority restArea command when the group is exhausted', () => {
    const family = makeFamily([makeFamilyMember({ energyLevel: 'exhausted' })])
    const result = checkFamilyEnergy(family, CURRENT_TIME)
    expect(result?.type).toBe('restArea')
    expect(result?.priority).toBe('high')
  })

  it('returns a normal hydrationReminder when energy is low and a member needs hydration', () => {
    const family = makeFamily([
      makeFamilyMember({
        energyLevel: 'low',
        lastHydrationReminder: isoMinutesFrom(CURRENT_TIME, -90),
        lastRestBreak: isoMinutesFrom(CURRENT_TIME, -10),
      }),
    ])
    const result = checkFamilyEnergy(family, CURRENT_TIME)
    expect(result?.type).toBe('hydrationReminder')
    expect(result?.priority).toBe('normal')
  })

  it('returns a normal restArea command when a member needs a scheduled rest break', () => {
    const family = makeFamily([
      makeFamilyMember({
        energyLevel: 'high',
        lastRestBreak: isoHoursFrom(CURRENT_TIME, -3),
        lastHydrationReminder: isoMinutesFrom(CURRENT_TIME, -10),
      }),
    ])
    const result = checkFamilyEnergy(family, CURRENT_TIME)
    expect(result?.type).toBe('restArea')
    expect(result?.priority).toBe('normal')
    expect(result?.metadata.reason).toBe('scheduled_rest')
  })

  it('returns null when energy is fine and no breaks are due', () => {
    const family = makeFamily([
      makeFamilyMember({
        energyLevel: 'high',
        lastRestBreak: isoMinutesFrom(CURRENT_TIME, -10),
        lastHydrationReminder: isoMinutesFrom(CURRENT_TIME, -10),
      }),
    ])
    expect(checkFamilyEnergy(family, CURRENT_TIME)).toBeNull()
  })
})

describe('checkHydration', () => {
  it('returns a low-priority hydration reminder when only hydration is due', () => {
    const family = makeFamily([
      makeFamilyMember({
        energyLevel: 'high',
        lastHydrationReminder: isoMinutesFrom(CURRENT_TIME, -90),
        lastRestBreak: isoMinutesFrom(CURRENT_TIME, -10),
      }),
    ])
    const result = checkHydration(family, CURRENT_TIME)
    expect(result?.type).toBe('hydrationReminder')
    expect(result?.priority).toBe('low')
  })
})

describe('getNextPlannedAttraction', () => {
  it('uses an effective wait of 5 when Lightning Lane is available', () => {
    const attraction = makeAttraction({
      id: 'attraction_a',
      hasLightningLane: true,
      lightningLaneAvailable: true,
      currentWaitMinutes: 60,
    })
    const parkDay = makeParkDay({
      plannedAttractions: [makePlannedAttraction({ attractionId: 'attraction_a' })],
    })
    const result = getNextPlannedAttraction(parkDay, [attraction], CURRENT_TIME)
    expect(result?.waitMinutes).toBe(5)
    expect(result?.lightningLaneReady).toBe(true)
  })

  it('uses the live current wait when Lightning Lane is not available', () => {
    const attraction = makeAttraction({
      id: 'attraction_a',
      hasLightningLane: false,
      currentWaitMinutes: 45,
    })
    const parkDay = makeParkDay({
      plannedAttractions: [makePlannedAttraction({ attractionId: 'attraction_a' })],
    })
    const result = getNextPlannedAttraction(parkDay, [attraction], CURRENT_TIME)
    expect(result?.waitMinutes).toBe(45)
    expect(result?.lightningLaneReady).toBe(false)
  })

  it('uses "book Lightning Lane" subtext copy for waits over 60 minutes', () => {
    const attraction = makeAttraction({
      id: 'attraction_a',
      hasLightningLane: false,
      currentWaitMinutes: 75,
    })
    const parkDay = makeParkDay({
      plannedAttractions: [makePlannedAttraction({ attractionId: 'attraction_a' })],
    })
    const result = getNextPlannedAttraction(parkDay, [attraction], CURRENT_TIME)
    expect(result?.subtext).toMatch(/before you walk over/)
  })

  it('skips closed attractions and returns the next open one', () => {
    const closed = makeAttraction({ id: 'attraction_a', isOpen: false })
    const open = makeAttraction({ id: 'attraction_b', isOpen: true })
    const parkDay = makeParkDay({
      plannedAttractions: [
        makePlannedAttraction({ attractionId: 'attraction_a', plannedOrder: 0 }),
        makePlannedAttraction({ attractionId: 'attraction_b', plannedOrder: 1 }),
      ],
    })
    const result = getNextPlannedAttraction(parkDay, [closed, open], CURRENT_TIME)
    expect(result?.attraction?.id).toBe('attraction_b')
  })
})

describe('findBestAvailableAttraction', () => {
  it('picks the highest-scored open, unresolved attraction', () => {
    const family = makeFamily([makeFamilyMember({ age: 30 })])
    const low = makeAttraction({ id: 'low_score', currentWaitMinutes: 55 })
    const high = makeAttraction({ id: 'high_score', currentWaitMinutes: 5, tags: ['must-do'] })
    const parkDay = makeParkDay({ plannedAttractions: [] })

    const result = findBestAvailableAttraction([low, high], parkDay, family, CURRENT_TIME)

    expect(result.attraction?.id).toBe('high_score')
  })

  it('returns a celebrate command when there are no open candidates', () => {
    const family = makeFamily([makeFamilyMember({ age: 30 })])
    const closed = makeAttraction({ id: 'closed_one', isOpen: false })
    const parkDay = makeParkDay({ plannedAttractions: [] })

    const result = findBestAvailableAttraction([closed], parkDay, family, CURRENT_TIME)

    expect(result.type).toBe('celebrate')
  })

  it('excludes attractions already completed or skipped', () => {
    const family = makeFamily([makeFamilyMember({ age: 30 })])
    const done = makeAttraction({ id: 'done_one', currentWaitMinutes: 5, tags: ['must-do'] })
    const remaining = makeAttraction({ id: 'remaining_one', currentWaitMinutes: 55 })
    const parkDay = makeParkDay({
      plannedAttractions: [
        makePlannedAttraction({ attractionId: 'done_one', isCompleted: true }),
      ],
    })

    const result = findBestAvailableAttraction([done, remaining], parkDay, family, CURRENT_TIME)

    expect(result.attraction?.id).toBe('remaining_one')
  })
})

describe('generateUpcomingCommands', () => {
  it('inserts a synthetic hydration break after every 2 rides', () => {
    const family = makeFamily([makeFamilyMember({ age: 30 })])
    const attractions = ['a', 'b', 'c', 'd'].map((id) => makeAttraction({ id, durationMinutes: 3 }))
    const parkDay = makeParkDay({
      plannedAttractions: attractions.map((a, i) =>
        makePlannedAttraction({ attractionId: a.id, plannedOrder: i }),
      ),
    })

    const upcoming = generateUpcomingCommands(parkDay, family, attractions, CURRENT_TIME, undefined)

    expect(upcoming[0].type).toBe('walkToAttraction')
    expect(upcoming[1].type).toBe('walkToAttraction')
    expect(upcoming[2].type).toBe('hydrationReminder')
  })
})

describe('generateCommandQueue — priority waterfall', () => {
  it('prioritizes an open Lightning Lane window over an imminent dining reservation', () => {
    const attraction = makeAttraction({
      id: 'attraction_a',
      hasLightningLane: true,
      lightningLaneReturnTime: isoMinutesFrom(CURRENT_TIME, -1),
    })
    const parkDay = makeParkDay({
      plannedAttractions: [makePlannedAttraction({ attractionId: 'attraction_a' })],
      diningReservations: [
        makeDiningReservation({ reservationTime: isoMinutesFrom(CURRENT_TIME, -5) }),
      ],
    })
    const family = makeFamily([makeFamilyMember({ energyLevel: 'exhausted' })])

    const queue = generateCommandQueue({
      parkDay,
      family,
      liveAttractions: [attraction],
      currentTime: CURRENT_TIME,
    })

    expect(queue.current.type).toBe('rideNow')
  })

  it('prioritizes exhausted family energy over a plain hydration reminder', () => {
    const family = makeFamily([
      makeFamilyMember({
        energyLevel: 'exhausted',
        lastHydrationReminder: isoMinutesFrom(CURRENT_TIME, -90),
      }),
    ])
    const parkDay = makeParkDay({ plannedAttractions: [] })

    const queue = generateCommandQueue({
      parkDay,
      family,
      liveAttractions: [],
      currentTime: CURRENT_TIME,
    })

    expect(queue.current.type).toBe('restArea')
    expect(queue.current.metadata.reason).toBe('energy_critical')
  })

  it('falls all the way through to the best-available attraction when nothing else fires', () => {
    const family = makeFamily([makeFamilyMember({ age: 30 })])
    const attraction = makeAttraction({ id: 'fallback_attraction', currentWaitMinutes: 10 })
    const parkDay = makeParkDay({ plannedAttractions: [] })

    const queue = generateCommandQueue({
      parkDay,
      family,
      liveAttractions: [attraction],
      currentTime: CURRENT_TIME,
    })

    expect(queue.current.attraction?.id).toBe('fallback_attraction')
    expect(queue.current.priority).toBe('normal')
  })
})
