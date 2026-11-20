import { describe, expect, it } from 'vitest'
import { indexAfterRemoval, moveItem, nextNumberedName, opacityFromPercent } from '../layers'
import { hardSquareStroke } from '../tools/hard'
import { asContext, createMockContext, noEnv } from './mockContext'

describe('moveItem', () => {
  it('moves up and down without losing items', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 1, 3)).toEqual(['a', 'c', 'd', 'b'])
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c'])
  })

  it('clamps the target and leaves the input alone', () => {
    const list = ['a', 'b', 'c']
    expect(moveItem(list, 0, 99)).toEqual(['b', 'c', 'a'])
    expect(moveItem(list, 2, -5)).toEqual(['c', 'a', 'b'])
    expect(list).toEqual(['a', 'b', 'c'])
  })
})

describe('indexAfterRemoval', () => {
  it('activates the layer below, or the bottom one', () => {
    expect(indexAfterRemoval(3)).toBe(2)
    expect(indexAfterRemoval(0)).toBe(0)
  })
})

describe('nextNumberedName', () => {
  const name = (n: number) => `Layer ${n}`

  it('takes the lowest free number', () => {
    expect(nextNumberedName(name, ['Background'])).toBe('Layer 1')
    expect(nextNumberedName(name, ['Layer 1', 'Layer 3'])).toBe('Layer 2')
    expect(nextNumberedName(name, ['Layer 1', 'Layer 2'])).toBe('Layer 3')
  })
})

describe('opacityFromPercent', () => {
  it('rounds and clamps to 0..1', () => {
    expect(opacityFromPercent(50)).toBe(0.5)
    expect(opacityFromPercent(33.4)).toBe(0.33)
    expect(opacityFromPercent(-10)).toBe(0)
    expect(opacityFromPercent(150)).toBe(1)
  })
})

describe('eraser on upper layers', () => {
  it('cuts pixels away instead of painting', () => {
    const mock = createMockContext()
    hardSquareStroke(asContext(mock), { color: '#fff', size: 4, erase: true }, noEnv).add({
      x: 10,
      y: 10,
      pressure: 1,
    })
    expect(mock.calls[0]!.op).toBe('destination-out')
    // The context is left ready for normal drawing.
    expect(mock.globalCompositeOperation).toBe('source-over')
  })

  it('paints normally on the background layer', () => {
    const mock = createMockContext()
    hardSquareStroke(asContext(mock), { color: '#fff', size: 4 }, noEnv).add({
      x: 10,
      y: 10,
      pressure: 1,
    })
    expect(mock.calls[0]!.op).toBe('source-over')
    expect(mock.calls[0]!.style).toBe('#fff')
  })
})
