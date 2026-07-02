import { describe, expect, it } from 'vitest'
import { isDislikedByAnyMember, isFavoritedByAnyMember } from '../familyRules'
import { makeFamily, makeFamilyMember } from '@/application/engines/__tests__/fixtures'

describe('isFavoritedByAnyMember', () => {
  it('returns true when one of several members has the id favorited', () => {
    const family = makeFamily([
      makeFamilyMember({ favoriteAttractions: [] }),
      makeFamilyMember({ favoriteAttractions: ['attraction_a'] }),
    ])
    expect(isFavoritedByAnyMember('attraction_a', family)).toBe(true)
  })

  it('returns false when no member has the id favorited', () => {
    const family = makeFamily([makeFamilyMember({ favoriteAttractions: ['attraction_b'] })])
    expect(isFavoritedByAnyMember('attraction_a', family)).toBe(false)
  })

  it('returns false for an empty members array', () => {
    expect(isFavoritedByAnyMember('attraction_a', makeFamily([]))).toBe(false)
  })
})

describe('isDislikedByAnyMember', () => {
  it('returns true when one of several members has the id disliked', () => {
    const family = makeFamily([
      makeFamilyMember({ dislikedAttractions: [] }),
      makeFamilyMember({ dislikedAttractions: ['attraction_a'] }),
    ])
    expect(isDislikedByAnyMember('attraction_a', family)).toBe(true)
  })

  it('returns false when no member has the id disliked', () => {
    const family = makeFamily([makeFamilyMember({ dislikedAttractions: ['attraction_b'] })])
    expect(isDislikedByAnyMember('attraction_a', family)).toBe(false)
  })

  it('returns false for an empty members array', () => {
    expect(isDislikedByAnyMember('attraction_a', makeFamily([]))).toBe(false)
  })
})
