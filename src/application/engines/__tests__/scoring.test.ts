import { describe, expect, it } from 'vitest'
import { scoreAttraction } from '../scoring'
import { makeAttraction, makeFamily, makeFamilyMember } from './fixtures'

describe('scoreAttraction', () => {
  it('scores a low wait (<=15) as +40', () => {
    const family = makeFamily([makeFamilyMember({ age: 30 })])
    const attraction = makeAttraction({ currentWaitMinutes: 10 })
    expect(scoreAttraction(attraction, family)).toBe(40)
  })

  it('scores a medium wait (<=30) as +25', () => {
    const family = makeFamily([makeFamilyMember({ age: 30 })])
    const attraction = makeAttraction({ currentWaitMinutes: 25 })
    expect(scoreAttraction(attraction, family)).toBe(25)
  })

  it('scores a longer wait (<=45) as +10', () => {
    const family = makeFamily([makeFamilyMember({ age: 30 })])
    const attraction = makeAttraction({ currentWaitMinutes: 40 })
    expect(scoreAttraction(attraction, family)).toBe(10)
  })

  it('scores a wait over 45 minutes as +0 for the wait bucket', () => {
    const family = makeFamily([makeFamilyMember({ age: 30 })])
    const attraction = makeAttraction({ currentWaitMinutes: 50 })
    expect(scoreAttraction(attraction, family)).toBe(0)
  })

  it('adds +30 when Lightning Lane is available', () => {
    const family = makeFamily([makeFamilyMember({ age: 30 })])
    const attraction = makeAttraction({ currentWaitMinutes: 10, lightningLaneAvailable: true })
    expect(scoreAttraction(attraction, family)).toBe(70)
  })

  it('adds +20 for a must-do tag', () => {
    const family = makeFamily([makeFamilyMember({ age: 30 })])
    const attraction = makeAttraction({ currentWaitMinutes: 10, tags: ['must-do'] })
    expect(scoreAttraction(attraction, family)).toBe(60)
  })

  it('adds +15 for a low-thrill ride when the youngest member is under 8', () => {
    const family = makeFamily([makeFamilyMember({ age: 7 })])
    const attraction = makeAttraction({ currentWaitMinutes: 10, thrillLevel: 2 })
    expect(scoreAttraction(attraction, family)).toBe(55)
  })

  it('subtracts 20 for a high-thrill ride when the youngest member is under 8', () => {
    const family = makeFamily([makeFamilyMember({ age: 7 })])
    const attraction = makeAttraction({ currentWaitMinutes: 10, thrillLevel: 4 })
    expect(scoreAttraction(attraction, family)).toBe(20)
  })

  it('does not apply the young-child bonus/penalty when the youngest member is 8+', () => {
    const family = makeFamily([makeFamilyMember({ age: 8 })])
    const lowThrill = makeAttraction({ currentWaitMinutes: 10, thrillLevel: 2 })
    const highThrill = makeAttraction({ currentWaitMinutes: 10, thrillLevel: 4 })
    expect(scoreAttraction(lowThrill, family)).toBe(40)
    expect(scoreAttraction(highThrill, family)).toBe(40)
  })

  it('subtracts 30 for a height requirement when a member is under 100cm', () => {
    const family = makeFamily([makeFamilyMember({ age: 30, heightCm: 90 })])
    const attraction = makeAttraction({ currentWaitMinutes: 10, heightRequirement: '40" (102 cm)' })
    expect(scoreAttraction(attraction, family)).toBe(10)
  })

  it('does not apply the height penalty when all members are 100cm+', () => {
    const family = makeFamily([makeFamilyMember({ age: 30, heightCm: 110 })])
    const attraction = makeAttraction({ currentWaitMinutes: 10, heightRequirement: '40" (102 cm)' })
    expect(scoreAttraction(attraction, family)).toBe(40)
  })

  it('stacks bonuses additively', () => {
    const family = makeFamily([makeFamilyMember({ age: 30 })])
    const attraction = makeAttraction({
      currentWaitMinutes: 10,
      lightningLaneAvailable: true,
      tags: ['must-do'],
    })
    expect(scoreAttraction(attraction, family)).toBe(90)
  })
})
