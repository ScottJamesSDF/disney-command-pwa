import { describe, expect, it } from 'vitest'
import { buildAttractionCommand } from '../commandEngine'
import { detectContingencies, findMustDoAlternatives } from '../decisionEngine'
import {
  CURRENT_TIME,
  makeAttraction,
  makeFamily,
  makeFamilyMember,
  makeParkDay,
  makePlannedAttraction,
} from './fixtures'

describe('detectContingencies — ride closed', () => {
  it('fires with same-area alternatives sorted ascending by wait when the current attraction closes', () => {
    const attraction = makeAttraction({ id: 'attraction_a', area: 'fantasyland', isOpen: true })
    const command = buildAttractionCommand(attraction, CURRENT_TIME, 'normal')

    const closedNow = makeAttraction({ id: 'attraction_a', area: 'fantasyland', isOpen: false })
    const altFar = makeAttraction({ id: 'alt_far', area: 'fantasyland', currentWaitMinutes: 50 })
    const altNear = makeAttraction({ id: 'alt_near', area: 'fantasyland', currentWaitMinutes: 10 })
    const otherArea = makeAttraction({ id: 'other_area', area: 'tomorrowland', currentWaitMinutes: 5 })

    const contingencies = detectContingencies({
      currentCommand: command,
      parkDay: makeParkDay({ plannedAttractions: [] }),
      family: makeFamily([makeFamilyMember({ energyLevel: 'high' })]),
      liveAttractions: [closedNow, altFar, altNear, otherArea],
      currentTime: CURRENT_TIME,
    })

    const rideClosed = contingencies.find((c) => c.type === 'rideClosed')
    expect(rideClosed).toBeDefined()
    expect(rideClosed?.alternatives.map((a) => a.attraction?.id)).toEqual(['alt_near', 'alt_far'])
  })
})

describe('detectContingencies — wait spike', () => {
  it('fires when the wait is both 1.5x the average and over 30 minutes', () => {
    const attraction = makeAttraction({
      id: 'attraction_a',
      area: 'fantasyland',
      averageWaitMinutes: 20,
      currentWaitMinutes: 35,
      isOpen: true,
    })
    const command = buildAttractionCommand(attraction, CURRENT_TIME, 'normal')

    const contingencies = detectContingencies({
      currentCommand: command,
      parkDay: makeParkDay({ plannedAttractions: [] }),
      family: makeFamily([makeFamilyMember({ energyLevel: 'high' })]),
      liveAttractions: [attraction],
      currentTime: CURRENT_TIME,
    })

    expect(contingencies.some((c) => c.type === 'waitSpike')).toBe(true)
  })

  it('does not fire when the wait spikes proportionally but stays under 30 minutes', () => {
    const attraction = makeAttraction({
      id: 'attraction_a',
      area: 'fantasyland',
      averageWaitMinutes: 10,
      currentWaitMinutes: 20,
      isOpen: true,
    })
    const command = buildAttractionCommand(attraction, CURRENT_TIME, 'normal')

    const contingencies = detectContingencies({
      currentCommand: command,
      parkDay: makeParkDay({ plannedAttractions: [] }),
      family: makeFamily([makeFamilyMember({ energyLevel: 'high' })]),
      liveAttractions: [attraction],
      currentTime: CURRENT_TIME,
    })

    expect(contingencies.some((c) => c.type === 'waitSpike')).toBe(false)
  })

  it('does not fire when the wait is over 30 minutes but not proportionally spiked', () => {
    const attraction = makeAttraction({
      id: 'attraction_a',
      area: 'fantasyland',
      averageWaitMinutes: 40,
      currentWaitMinutes: 45,
      isOpen: true,
    })
    const command = buildAttractionCommand(attraction, CURRENT_TIME, 'normal')

    const contingencies = detectContingencies({
      currentCommand: command,
      parkDay: makeParkDay({ plannedAttractions: [] }),
      family: makeFamily([makeFamilyMember({ energyLevel: 'high' })]),
      liveAttractions: [attraction],
      currentTime: CURRENT_TIME,
    })

    expect(contingencies.some((c) => c.type === 'waitSpike')).toBe(false)
  })
})

describe('detectContingencies — behind schedule', () => {
  it('fires must-do alternatives when actual completion trails expected by more than 0.2', () => {
    // Arrival 9:00, close 22:00 (13h = 780min window). currentTime is 14:00 → 5h elapsed → ~38% expected.
    const parkDay = makeParkDay({
      arrivalTime: { hour: 9, minute: 0 },
      parkCloseTime: { hour: 22, minute: 0 },
      plannedAttractions: [
        makePlannedAttraction({ attractionId: 'a', isCompleted: false }),
        makePlannedAttraction({ attractionId: 'b', isCompleted: false }),
        makePlannedAttraction({ attractionId: 'c', isCompleted: false }),
        makePlannedAttraction({ attractionId: 'd', isCompleted: false }),
      ],
    })
    const mustDo = makeAttraction({ id: 'must_do_open', tags: ['must-do'], isOpen: true })
    const command = buildAttractionCommand(mustDo, CURRENT_TIME, 'normal')

    const contingencies = detectContingencies({
      currentCommand: command,
      parkDay,
      family: makeFamily([makeFamilyMember({ energyLevel: 'high' })]),
      liveAttractions: [mustDo],
      currentTime: CURRENT_TIME,
    })

    expect(contingencies.some((c) => c.type === 'familyBehindSchedule')).toBe(true)
  })

  it('does not fire when completion is roughly on pace', () => {
    const parkDay = makeParkDay({
      arrivalTime: { hour: 9, minute: 0 },
      parkCloseTime: { hour: 22, minute: 0 },
      plannedAttractions: [
        makePlannedAttraction({ attractionId: 'a', isCompleted: true }),
        makePlannedAttraction({ attractionId: 'b', isCompleted: true }),
        makePlannedAttraction({ attractionId: 'c', isCompleted: false }),
      ],
    })
    const attraction = makeAttraction({ id: 'attraction_a', isOpen: true })
    const command = buildAttractionCommand(attraction, CURRENT_TIME, 'normal')

    const contingencies = detectContingencies({
      currentCommand: command,
      parkDay,
      family: makeFamily([makeFamilyMember({ energyLevel: 'high' })]),
      liveAttractions: [attraction],
      currentTime: CURRENT_TIME,
    })

    expect(contingencies.some((c) => c.type === 'familyBehindSchedule')).toBe(false)
  })
})

describe('findMustDoAlternatives', () => {
  it('ranks Lightning-Lane-available attractions ahead of wait-sorted ones', () => {
    const parkDay = makeParkDay({ plannedAttractions: [] })
    const highWaitNoLL = makeAttraction({
      id: 'high_wait_no_ll',
      tags: ['must-do'],
      isOpen: true,
      lightningLaneAvailable: false,
      currentWaitMinutes: 50,
    })
    const lowWaitWithLL = makeAttraction({
      id: 'low_wait_with_ll',
      tags: ['must-do'],
      isOpen: true,
      lightningLaneAvailable: true,
      currentWaitMinutes: 40,
    })
    const lowestWaitNoLL = makeAttraction({
      id: 'lowest_wait_no_ll',
      tags: ['must-do'],
      isOpen: true,
      lightningLaneAvailable: false,
      currentWaitMinutes: 5,
    })

    const alternatives = findMustDoAlternatives(
      parkDay,
      [highWaitNoLL, lowWaitWithLL, lowestWaitNoLL],
      CURRENT_TIME,
    )

    expect(alternatives.map((a) => a.attraction?.id)).toEqual([
      'low_wait_with_ll',
      'lowest_wait_no_ll',
      'high_wait_no_ll',
    ])
  })
})

describe('detectContingencies — exhausted family', () => {
  it('fires a critical rest break plus a snack-break alternative', () => {
    const attraction = makeAttraction({ id: 'attraction_a', isOpen: true })
    const command = buildAttractionCommand(attraction, CURRENT_TIME, 'normal')
    const family = makeFamily([makeFamilyMember({ energyLevel: 'exhausted' })])

    const contingencies = detectContingencies({
      currentCommand: command,
      parkDay: makeParkDay({ plannedAttractions: [] }),
      family,
      liveAttractions: [attraction],
      currentTime: CURRENT_TIME,
    })

    const kidsTired = contingencies.find((c) => c.type === 'kidsTired')
    expect(kidsTired).toBeDefined()
    expect(kidsTired?.alternatives.map((a) => a.type)).toEqual(['restArea', 'snackBreak'])
    expect(kidsTired?.alternatives[0].priority).toBe('critical')
  })
})
