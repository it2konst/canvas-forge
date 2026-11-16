import { describe, expect, it } from 'vitest'
import type { RGBA } from '../color'
import { floodFill } from '../fill'

const WHITE: RGBA = [255, 255, 255, 255]
const BLACK: RGBA = [0, 0, 0, 255]
const RED: RGBA = [255, 0, 0, 255]

/** Builds an image from rows of characters: '.' white, '#' black, 'g' light grey. */
function image(rows: string[]) {
  const height = rows.length
  const width = rows[0]!.length
  const data = new Uint8ClampedArray(width * height * 4)
  const colors: Record<string, RGBA> = { '.': WHITE, '#': BLACK, g: [235, 235, 235, 255] }
  rows.forEach((row, y) => [...row].forEach((ch, x) => data.set(colors[ch]!, (y * width + x) * 4)))
  return { width, height, data }
}

/** Renders back to characters; 'r' marks red (filled) pixels. */
function render(img: ReturnType<typeof image>) {
  const rows: string[] = []
  for (let y = 0; y < img.height; y++) {
    let row = ''
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4
      const [r, g] = [img.data[i], img.data[i + 1]]
      row += r === 255 && g === 0 ? 'r' : r === 0 ? '#' : r === 255 ? '.' : 'g'
    }
    rows.push(row)
  }
  return rows
}

describe('floodFill', () => {
  it('fills the enclosed area and nothing outside the wall', () => {
    const img = image(['.....', '.###.', '.#.#.', '.###.', '.....'])
    const area = floodFill(img, 2, 2, RED, 0)
    expect(render(img)).toEqual(['.....', '.###.', '.#r#.', '.###.', '.....'])
    expect(area).toEqual({ x: 2, y: 2, width: 1, height: 1 })
  })

  it('does not leak through diagonal gaps (4-connected)', () => {
    const img = image(['.#..', '#...', '....'])
    floodFill(img, 0, 0, RED, 0)
    expect(render(img)).toEqual(['r#..', '#...', '....'])
  })

  it('fills around obstacles and reports the whole changed area', () => {
    const img = image(['......', '.##...', '...##.', '......'])
    const area = floodFill(img, 0, 0, RED, 0)
    expect(render(img)).toEqual(['rrrrrr', 'r##rrr', 'rrr##r', 'rrrrrr'])
    expect(area).toEqual({ x: 0, y: 0, width: 6, height: 4 })
  })

  it('takes similar colours only when tolerance allows', () => {
    const strict = image(['..g..'])
    floodFill(strict, 0, 0, RED, 0)
    expect(render(strict)).toEqual(['rrg..'])

    const tolerant = image(['..g..'])
    floodFill(tolerant, 0, 0, RED, 10)
    expect(render(tolerant)).toEqual(['rrrrr'])
  })

  it('returns null when nothing changes', () => {
    expect(floodFill(image(['...']), 1, 0, WHITE, 0)).toBeNull()
    expect(floodFill(image(['...']), 1, 0, WHITE, 50)).toBeNull()
  })

  it('returns null for points outside the image', () => {
    expect(floodFill(image(['...']), -1, 0, RED, 0)).toBeNull()
    expect(floodFill(image(['...']), 3, 0, RED, 0)).toBeNull()
  })

  it('handles a large image without recursion limits', () => {
    const width = 1500
    const height = 1000
    const img = { width, height, data: new Uint8ClampedArray(width * height * 4).fill(255) }
    const area = floodFill(img, 750, 500, BLACK, 0)
    expect(area).toEqual({ x: 0, y: 0, width, height })
    expect(img.data[(height * width - 1) * 4]).toBe(0)
  })
})
