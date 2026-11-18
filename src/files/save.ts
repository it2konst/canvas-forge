export type ExportFormat = 'png' | 'jpeg' | 'webp'

export interface FormatInfo {
  mime: string
  extension: string
  /** Lossy formats take a quality setting. */
  lossy: boolean
  /** Formats without an alpha channel are flattened onto a background. */
  alpha: boolean
}

export const FORMATS: Record<ExportFormat, FormatInfo> = {
  png: { mime: 'image/png', extension: 'png', lossy: false, alpha: true },
  jpeg: { mime: 'image/jpeg', extension: 'jpg', lossy: true, alpha: false },
  webp: { mime: 'image/webp', extension: 'webp', lossy: true, alpha: true },
}

/** Characters no common file system accepts, plus control characters. */
const FORBIDDEN = /[<>:"/\\|?*\u0000-\u001f]/g

/** Makes any text usable as a file name (without extension). */
export function sanitizeName(name: string): string {
  return name.replace(FORBIDDEN, '').replace(/\s+/g, ' ').trim().replace(/^\.+/, '').slice(0, 120)
}

const pad = (n: number) => String(n).padStart(2, '0')

/** canvas-forge-2026-11-18-1058, used when the image has no name yet. */
export function defaultName(now = new Date()): string {
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  return `canvas-forge-${date}-${pad(now.getHours())}${pad(now.getMinutes())}`
}

export function fileNameFor(base: string | null, format: ExportFormat, now = new Date()): string {
  const clean = sanitizeName(base ?? '')
  return `${clean || defaultName(now)}.${FORMATS[format].extension}`
}

/** 1 536 B -> "1.5 KB" in the given locale. */
export function formatBytes(bytes: number, locale: string): string {
  const units = locale.startsWith('ru') ? ['Б', 'КБ', 'МБ'] : ['B', 'KB', 'MB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1
  return `${value.toLocaleString(locale, { maximumFractionDigits: digits })} ${units[unit]}`
}

let webpSupport: boolean | undefined

/** Safari before 17 silently writes PNG when asked for WebP. */
export function canEncodeWebp(): boolean {
  if (webpSupport === undefined) {
    const probe = document.createElement('canvas')
    probe.width = probe.height = 1
    webpSupport = probe.toDataURL('image/webp').startsWith('data:image/webp')
  }
  return webpSupport
}

/**
 * Encodes the image. JPEG has no transparency, so the picture is first
 * flattened onto `background`; otherwise transparent areas turn black.
 */
export function encode(
  source: HTMLCanvasElement,
  format: ExportFormat,
  quality: number,
  background = '#FFFFFF',
): Promise<Blob> {
  const info = FORMATS[format]
  let canvas = source
  if (!info.alpha) {
    canvas = document.createElement('canvas')
    canvas.width = source.width
    canvas.height = source.height
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(source, 0, 0)
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Encoding failed'))),
      info.mime,
      info.lossy ? quality : undefined,
    ),
  )
}

/** Hands a file to the browser's downloads; nothing is uploaded anywhere. */
export function download(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
  // Give the download a moment to start before freeing the memory.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
