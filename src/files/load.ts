import { MAX_SIDE } from '@/engine/resize'
import type { Size } from '@/engine/view'

/** Formats browsers can decode; SVG is rasterised at its own size. */
export const OPEN_ACCEPT =
  'image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif,image/svg+xml'

/** Larger files are refused before decoding to keep memory in check. */
export const MAX_FILE_BYTES = 50 * 1024 * 1024

export type LoadErrorCode = 'type' | 'size' | 'decode'

export class LoadError extends Error {
  constructor(readonly code: LoadErrorCode) {
    super(code)
  }
}

export interface LoadedPicture {
  picture: CanvasImageSource
  width: number
  height: number
  /** True when the picture was larger than MAX_SIDE and was scaled down. */
  scaled: boolean
  /** File name without extension, for saving later. */
  name: string
  release(): void
}

const EXTENSIONS = /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || EXTENSIONS.test(file.name)
}

export const baseName = (fileName: string) => fileName.replace(/\.[^./\\]+$/, '') || fileName

/** Scales a size down (never up) so neither side exceeds `max`. */
export function fitWithin(size: Size, max = MAX_SIDE): Size {
  const factor = Math.min(1, max / size.width, max / size.height)
  return {
    width: Math.max(1, Math.round(size.width * factor)),
    height: Math.max(1, Math.round(size.height * factor)),
  }
}

/**
 * Decodes an image file. createImageBitmap is fast and honours EXIF
 * rotation; an <img> from a blob: URL is the fallback, which also covers
 * SVG. Either way the file never leaves the device and scripts inside an
 * SVG never run.
 */
async function decode(
  file: Blob,
): Promise<{ picture: CanvasImageSource; size: Size; release(): void }> {
  try {
    const bitmap = await createImageBitmap(file)
    return {
      picture: bitmap,
      size: { width: bitmap.width, height: bitmap.height },
      release: () => bitmap.close(),
    }
  } catch {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    try {
      await img.decode()
    } catch {
      URL.revokeObjectURL(url)
      throw new LoadError('decode')
    }
    // SVGs without a size report 0; give them a sensible default.
    const size = { width: img.naturalWidth || 1280, height: img.naturalHeight || 800 }
    return { picture: img, size, release: () => URL.revokeObjectURL(url) }
  }
}

export async function loadPicture(file: File): Promise<LoadedPicture> {
  if (!isImageFile(file)) throw new LoadError('type')
  if (file.size > MAX_FILE_BYTES) throw new LoadError('size')
  const { picture, size, release } = await decode(file)
  if (!size.width || !size.height) {
    release()
    throw new LoadError('decode')
  }
  const fitted = fitWithin(size)
  return {
    picture,
    ...fitted,
    scaled: fitted.width !== size.width || fitted.height !== size.height,
    name: baseName(file.name || 'image'),
    release,
  }
}
