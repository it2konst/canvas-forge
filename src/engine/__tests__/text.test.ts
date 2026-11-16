import { describe, expect, it } from 'vitest'
import { drawText, fontShorthand, TEXT_LINE_HEIGHT } from '../tools/text'
import { asContext, createMockContext } from './mockContext'

const style = { family: 'sans-serif', size: 20, color: '#123456' }

describe('drawText', () => {
  it('draws every line one line height apart', () => {
    const mock = createMockContext()
    drawText(asContext(mock), { x: 10, y: 30 }, 'one\ntwo\r\nthree', style)
    const ys = mock.texts.map((t) => t.y)
    expect(mock.texts.map((t) => t.text)).toEqual(['one', 'two', 'three'])
    expect(ys[1]! - ys[0]!).toBeCloseTo(20 * TEXT_LINE_HEIGHT)
    expect(ys[2]! - ys[1]!).toBeCloseTo(20 * TEXT_LINE_HEIGHT)
    expect(mock.font).toBe(fontShorthand(style))
    expect(mock.fillStyle).toBe('#123456')
  })

  it('reports an area that covers all lines', () => {
    const mock = createMockContext()
    const area = drawText(asContext(mock), { x: 10, y: 30 }, 'wide line\nx', style)!
    expect(area.x).toBeLessThanOrEqual(10)
    expect(area.y).toBeLessThanOrEqual(30)
    // The mock measures 10 px per character.
    expect(area.x + area.width).toBeGreaterThanOrEqual(10 + 90)
    expect(area.y + area.height).toBeGreaterThanOrEqual(30 + 2 * 20 * TEXT_LINE_HEIGHT)
  })

  it('draws nothing for blank text', () => {
    const mock = createMockContext()
    expect(drawText(asContext(mock), { x: 0, y: 0 }, '  \n \n', style)).toBeNull()
    expect(mock.texts).toHaveLength(0)
  })
})
