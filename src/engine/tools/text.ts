import type { Point, Rect } from '../geometry'

export interface TextStyle {
  /** CSS font-family list. */
  family: string
  /** Font size in image pixels. */
  size: number
  color: string
}

/** Line height as a multiple of the font size; the on-screen editor uses the same. */
export const TEXT_LINE_HEIGHT = 1.2

export const fontShorthand = (style: Pick<TextStyle, 'family' | 'size'>) =>
  `${style.size}px ${style.family}`

/**
 * Draws multi-line text with its top-left corner at `at`. Each line is
 * placed the way CSS lays out a line box (the font's ascent and descent
 * centred in the line height), so the result lines up with the text the
 * user typed in the on-screen editor.
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  at: Point,
  text: string,
  style: TextStyle,
): Rect | null {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  if (!lines.some((line) => line.trim())) return null

  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.font = fontShorthand(style)
  ctx.fillStyle = style.color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  const lineHeight = style.size * TEXT_LINE_HEIGHT
  const metrics = ctx.measureText('Hg')
  const ascent = metrics.fontBoundingBoxAscent ?? style.size * 0.8
  const descent = metrics.fontBoundingBoxDescent ?? style.size * 0.2
  const baseline = (lineHeight - (ascent + descent)) / 2 + ascent

  let width = 0
  lines.forEach((line, i) => {
    ctx.fillText(line, at.x, at.y + i * lineHeight + baseline)
    width = Math.max(width, ctx.measureText(line).width)
  })

  // Generous padding: italic and decorative glyphs can overhang their box.
  const pad = Math.ceil(style.size * 0.25) + 2
  return {
    x: Math.floor(at.x) - pad,
    y: Math.floor(at.y) - pad,
    width: Math.ceil(width) + pad * 2,
    height: Math.ceil(lines.length * lineHeight) + pad * 2,
  }
}
