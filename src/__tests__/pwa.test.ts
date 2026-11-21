import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { OPEN_ACCEPT } from '@/files/load'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (path: string) => readFileSync(`${root}${path}`, 'utf8')
const manifest = JSON.parse(read('public/manifest.webmanifest'))
const html = read('index.html')

describe('web app manifest', () => {
  it('has what browsers need to offer installing', () => {
    expect(manifest.name).toBeTruthy()
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    expect(manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true)
  })

  it('points only at icons that exist', () => {
    for (const icon of manifest.icons) {
      expect(existsSync(`${root}public${icon.src}`), icon.src).toBe(true)
    }
  })

  it('handles exactly the image types the editor can open', () => {
    const handled = Object.keys(manifest.file_handlers[0].accept).sort()
    expect(handled).toEqual(OPEN_ACCEPT.split(',').sort())
  })
})

describe('index.html', () => {
  it('links the manifest and the touch icon', () => {
    expect(html).toContain('rel="manifest" href="/manifest.webmanifest"')
    expect(html).toContain('rel="apple-touch-icon"')
  })

  it('has a complete link preview with an image that exists', () => {
    for (const tag of ['og:title', 'og:description', 'og:image', 'og:url', 'twitter:card']) {
      expect(html, tag).toContain(tag)
    }
    expect(existsSync(`${root}public/og-image.png`)).toBe(true)
  })
})
