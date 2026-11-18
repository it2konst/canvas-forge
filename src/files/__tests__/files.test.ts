import { describe, expect, it } from 'vitest'
import { LoadError, MAX_FILE_BYTES, baseName, fitWithin, isImageFile, loadPicture } from '../load'
import { defaultName, fileNameFor, formatBytes, sanitizeName } from '../save'

const file = (name: string, type: string, size = 10) => ({ name, type, size }) as unknown as File

describe('isImageFile', () => {
  it('accepts image types and known extensions', () => {
    expect(isImageFile(file('a.bin', 'image/png'))).toBe(true)
    expect(isImageFile(file('photo.JPG', ''))).toBe(true)
    expect(isImageFile(file('icon.svg', ''))).toBe(true)
  })

  it('rejects everything else', () => {
    expect(isImageFile(file('notes.txt', 'text/plain'))).toBe(false)
    expect(isImageFile(file('archive.zip', ''))).toBe(false)
  })
})

describe('loadPicture', () => {
  it('refuses non-images and huge files before decoding', async () => {
    await expect(loadPicture(file('notes.txt', 'text/plain'))).rejects.toMatchObject({
      code: 'type',
    })
    await expect(
      loadPicture(file('big.png', 'image/png', MAX_FILE_BYTES + 1)),
    ).rejects.toBeInstanceOf(LoadError)
  })
})

describe('baseName', () => {
  it('drops the last extension only', () => {
    expect(baseName('holiday.photo.jpg')).toBe('holiday.photo')
    expect(baseName('sketch')).toBe('sketch')
    expect(baseName('.hidden')).toBe('.hidden')
  })
})

describe('fitWithin', () => {
  it('scales large images down, keeping proportions', () => {
    expect(fitWithin({ width: 16384, height: 4096 }, 8192)).toEqual({ width: 8192, height: 2048 })
  })

  it('never scales up', () => {
    expect(fitWithin({ width: 300, height: 200 }, 8192)).toEqual({ width: 300, height: 200 })
  })
})

describe('sanitizeName', () => {
  it('removes characters file systems reject', () => {
    expect(sanitizeName('my: pic?/v2*')).toBe('my picv2')
    expect(sanitizeName('  lots   of   space ')).toBe('lots of space')
    expect(sanitizeName('...dots')).toBe('dots')
  })

  it('limits the length', () => {
    expect(sanitizeName('x'.repeat(300))).toHaveLength(120)
  })
})

describe('file names', () => {
  const now = new Date(2026, 10, 18, 9, 5)

  it('falls back to a dated name', () => {
    expect(defaultName(now)).toBe('canvas-forge-2026-11-18-0905')
    expect(fileNameFor(null, 'png', now)).toBe('canvas-forge-2026-11-18-0905.png')
    expect(fileNameFor('???', 'webp', now)).toBe('canvas-forge-2026-11-18-0905.webp')
  })

  it('uses the right extension for each format', () => {
    expect(fileNameFor('cat', 'jpeg')).toBe('cat.jpg')
    expect(fileNameFor('cat', 'png')).toBe('cat.png')
    expect(fileNameFor('cat', 'webp')).toBe('cat.webp')
  })
})

describe('formatBytes', () => {
  it('picks a unit and the locale', () => {
    expect(formatBytes(512, 'en')).toBe('512 B')
    expect(formatBytes(1536, 'en')).toBe('1.5 KB')
    expect(formatBytes(1536, 'ru')).toBe('1,5 КБ')
    expect(formatBytes(5 * 1024 * 1024, 'en')).toBe('5 MB')
    expect(formatBytes(250 * 1024, 'en')).toBe('250 KB')
  })
})
