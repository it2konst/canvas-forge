import { describe, expect, it } from 'vitest'
import { History } from '../history'

interface Step {
  id: string
  bytes: number
}

const step = (id: string, bytes = 10): Step => ({ id, bytes })
const history = (maxSteps: number, maxBytes: number) => new History<Step>({ maxSteps, maxBytes })

describe('History', () => {
  it('starts empty', () => {
    const h = history(10, 1000)
    expect(h.canUndo).toBe(false)
    expect(h.canRedo).toBe(false)
    expect(h.undo()).toBeUndefined()
    expect(h.redo()).toBeUndefined()
  })

  it('undoes and redoes in order', () => {
    const h = history(10, 1000)
    h.push(step('a'))
    h.push(step('b'))
    expect(h.undo()?.id).toBe('b')
    expect(h.undo()?.id).toBe('a')
    expect(h.canUndo).toBe(false)
    expect(h.redo()?.id).toBe('a')
    expect(h.redo()?.id).toBe('b')
    expect(h.canRedo).toBe(false)
  })

  it('drops the redo branch when a new step is pushed', () => {
    const h = history(10, 1000)
    h.push(step('a'))
    h.push(step('b', 50))
    h.undo()
    h.push(step('c'))
    expect(h.canRedo).toBe(false)
    expect(h.bytes).toBe(20)
    expect(h.undo()?.id).toBe('c')
    expect(h.undo()?.id).toBe('a')
  })

  it('keeps at most maxSteps, dropping the oldest', () => {
    const h = history(2, 1000)
    h.push(step('a'))
    h.push(step('b'))
    h.push(step('c'))
    expect(h.steps).toBe(2)
    expect(h.undo()?.id).toBe('c')
    expect(h.undo()?.id).toBe('b')
    expect(h.canUndo).toBe(false)
  })

  it('stays within the memory budget', () => {
    const h = history(100, 25)
    h.push(step('a'))
    h.push(step('b'))
    h.push(step('c'))
    expect(h.bytes).toBeLessThanOrEqual(25)
    expect(h.steps).toBe(2)
  })

  it('always keeps the newest step, even over budget', () => {
    const h = history(100, 25)
    h.push(step('a'))
    h.push(step('huge', 500))
    expect(h.steps).toBe(1)
    expect(h.undo()?.id).toBe('huge')
  })

  it('counts undone steps towards memory until they are dropped', () => {
    const h = history(10, 1000)
    h.push(step('a'))
    h.push(step('b'))
    h.undo()
    expect(h.bytes).toBe(20)
    h.clear()
    expect(h.bytes).toBe(0)
    expect(h.canUndo || h.canRedo).toBe(false)
  })
})
