import { describe, expect, it } from 'vitest'
import { parseHex, toHex } from '../color'
import { sampleHex } from '../pixels'

describe('parseHex', () => {
  it('reads every hex form', () => {
    expect(parseHex('#3F48CC')).toEqual([0x3f, 0x48, 0xcc, 255])
    expect(parseHex('3f48cc')).toEqual([0x3f, 0x48, 0xcc, 255])
    expect(parseHex('#f80')).toEqual([0xff, 0x88, 0x00, 255])
    expect(parseHex('#f808')).toEqual([0xff, 0x88, 0x00, 0x88])
    expect(parseHex('#11223344')).toEqual([0x11, 0x22, 0x33, 0x44])
  })

  it('rejects anything else', () => {
    expect(() => parseHex('red')).toThrow()
    expect(() => parseHex('#12345')).toThrow()
    expect(() => parseHex('rgb(0, 0, 0)')).toThrow()
  })
})

describe('toHex', () => {
  it('writes upper-case #RRGGBB and round-trips', () => {
    expect(toHex(0, 162, 232)).toBe('#00A2E8')
    const [r, g, b] = parseHex('#B97A57')
    expect(toHex(r, g, b)).toBe('#B97A57')
  })
})

describe('sampleHex', () => {
  const image = {
    width: 2,
    height: 1,
    data: new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]),
  }

  it('reads the pixel under a fractional point', () => {
    expect(sampleHex(image, 0.9, 0.5)).toBe('#FF0000')
    expect(sampleHex(image, 1.2, 0)).toBe('#0000FF')
  })

  it('returns null outside the image', () => {
    expect(sampleHex(image, -0.1, 0)).toBeNull()
    expect(sampleHex(image, 2, 0)).toBeNull()
    expect(sampleHex(image, 0, 1)).toBeNull()
  })
})
