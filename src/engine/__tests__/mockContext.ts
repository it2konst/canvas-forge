/**
 * Minimal stand-in for CanvasRenderingContext2D that records the calls the
 * tools make. Node has no canvas, and the tools only need these members.
 */
export function createMockContext() {
  const calls: { name: string; args: number[]; style: string; lineWidth: number }[] = []
  const texts: { text: string; x: number; y: number }[] = []
  const ctx = {
    fillStyle: '' as string,
    strokeStyle: '' as string,
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    calls,
    texts,
  }
  const record =
    (name: string, styleKey: 'fillStyle' | 'strokeStyle') =>
    (...args: number[]) =>
      calls.push({ name, args, style: ctx[styleKey], lineWidth: ctx.lineWidth })
  return Object.assign(ctx, {
    fillRect: record('fillRect', 'fillStyle'),
    fill: record('fill', 'fillStyle'),
    stroke: record('stroke', 'strokeStyle'),
    arc: record('arc', 'fillStyle'),
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    ellipse: () => {},
    strokeRect: record('strokeRect', 'strokeStyle'),
    fillText: (text: string, x: number, y: number) => texts.push({ text, x, y }),
    // 10 px per character, with typical font metrics for a 20 px font.
    measureText: (text: string) => ({
      width: text.length * 10,
      fontBoundingBoxAscent: 18,
      fontBoundingBoxDescent: 5,
    }),
  })
}

export const asContext = (mock: ReturnType<typeof createMockContext>) =>
  mock as unknown as CanvasRenderingContext2D

/** For tools that never restore pixels. */
export const noEnv = { restore: () => {} }
