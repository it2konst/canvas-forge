import { describe, expect, it } from 'vitest'
import { roundBrushStroke } from '../tools/brush'
import { hardSquareStroke } from '../tools/hard'
import { unionRect, type Rect } from '../geometry'
import { asContext, createMockContext, noEnv } from './mockContext'

const at = (x: number, y: number, pressure = 1) => ({ x, y, pressure })

describe('hard square stroke (pencil, eraser)', () => {
  it('stamps one square per pixel, centred on the cursor pixel', () => {
    const mock = createMockContext()
    const stroke = hardSquareStroke(asContext(mock), { color: '#ff0000', size: 3 }, noEnv)
    const area = stroke.add(at(10.7, 20.2))
    expect(mock.calls).toEqual([
      { name: 'fillRect', args: [9, 19, 3, 3], style: '#ff0000', lineWidth: 1 },
    ])
    expect(area).toEqual({ x: 9, y: 19, width: 3, height: 3 })
  })

  it('fills the whole line between samples, with no gaps', () => {
    const mock = createMockContext()
    const stroke = hardSquareStroke(asContext(mock), { color: '#000', size: 1 }, noEnv)
    stroke.add(at(0, 0))
    const area = stroke.add(at(5, 0))
    const xs = mock.calls.map((c) => c.args[0])
    // The first pixel is stamped again as the start of the line; that is harmless.
    expect(new Set(xs)).toEqual(new Set([0, 1, 2, 3, 4, 5]))
    expect(area).toEqual({ x: 0, y: 0, width: 6, height: 1 })
  })

  it('ignores samples that stay on the same pixel', () => {
    const mock = createMockContext()
    const stroke = hardSquareStroke(asContext(mock), { color: '#000', size: 1 }, noEnv)
    stroke.add(at(3.1, 3.1))
    expect(stroke.add(at(3.9, 3.4))).toBeNull()
    expect(mock.calls).toHaveLength(1)
  })

  it('rounds the size to whole pixels and never goes below one', () => {
    const mock = createMockContext()
    hardSquareStroke(asContext(mock), { color: '#000', size: 0.2 }, noEnv).add(at(0, 0))
    expect(mock.calls[0]!.args.slice(2)).toEqual([1, 1])
  })
})

describe('round brush stroke', () => {
  it('leaves a round dot on a click', () => {
    const mock = createMockContext()
    const stroke = roundBrushStroke(asContext(mock), { color: '#00f', size: 10 }, noEnv)
    const area = stroke.add(at(50, 50))
    expect(mock.calls.map((c) => c.name)).toEqual(['arc', 'fill'])
    expect(mock.calls[0]!.args.slice(0, 3)).toEqual([50, 50, 5])
    expect(stroke.finish()).toBeNull()
    expect(area).toEqual({ x: 44, y: 44, width: 12, height: 12 })
  })

  it('reports an area that covers the whole stroke', () => {
    const mock = createMockContext()
    const stroke = roundBrushStroke(asContext(mock), { color: '#00f', size: 4 }, noEnv)
    let area: Rect | null = null
    for (const p of [at(10, 10), at(20, 30), at(40, 30), at(60, 10)]) {
      const r = stroke.add(p)
      if (r) area = unionRect(area, r)
    }
    const end = stroke.finish()
    if (end) area = unionRect(area, end)
    // Every sample, padded by half the width, is inside the reported area.
    for (const p of [at(10, 10), at(60, 10), at(40, 30)]) {
      expect(area!.x).toBeLessThanOrEqual(p.x - 2)
      expect(area!.y).toBeLessThanOrEqual(p.y - 2)
      expect(area!.x + area!.width).toBeGreaterThanOrEqual(p.x + 2)
      expect(area!.y + area!.height).toBeGreaterThanOrEqual(p.y + 2)
    }
  })

  it('makes the line thinner as pen pressure drops', () => {
    const mock = createMockContext()
    const stroke = roundBrushStroke(asContext(mock), { color: '#00f', size: 20 }, noEnv)
    stroke.add(at(0, 0, 1))
    for (let i = 1; i <= 20; i++) stroke.add(at(i * 5, 0, 1 - i * 0.045))
    const widths = mock.calls.filter((c) => c.name === 'stroke').map((c) => c.lineWidth)
    expect(widths.at(-1)!).toBeLessThan(widths[0]!)
    for (let i = 1; i < widths.length; i++) expect(widths[i]!).toBeLessThanOrEqual(widths[i - 1]!)
  })

  it('merges tiny moves instead of drawing them', () => {
    const mock = createMockContext()
    const stroke = roundBrushStroke(asContext(mock), { color: '#00f', size: 4 }, noEnv)
    stroke.add(at(10, 10))
    expect(stroke.add(at(10.2, 10.1))).toBeNull()
  })
})
