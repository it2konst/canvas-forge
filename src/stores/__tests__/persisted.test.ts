import { describe, expect, it } from 'vitest'
import { isHexColor, isIntIn, isOneOf } from '../persisted'

describe('stored setting checks', () => {
  it('accepts only #RRGGBB colours', () => {
    expect(isHexColor('#3F48cc')).toBe(true)
    expect(isHexColor('#fff')).toBe(false)
    expect(isHexColor('red')).toBe(false)
    expect(isHexColor(42)).toBe(false)
  })

  it('accepts whole numbers in range', () => {
    const size = isIntIn(1, 100)
    expect(size(1)).toBe(true)
    expect(size(100)).toBe(true)
    expect(size(0)).toBe(false)
    expect(size(9999)).toBe(false)
    expect(size(2.5)).toBe(false)
    expect(size(Number.NaN)).toBe(false)
  })

  it('accepts only listed options', () => {
    const style = isOneOf(['outline', 'fill', 'both'] as const)
    expect(style('fill')).toBe(true)
    expect(style('dotted')).toBe(false)
    expect(style(null)).toBe(false)
  })
})
