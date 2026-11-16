/**
 * Minimal stand-in for CanvasRenderingContext2D that records the calls the
 * tools make. Node has no canvas, and the tools only need these members.
 */
export function createMockContext() {
  const calls: { name: string; args: number[]; style: string; lineWidth: number }[] = []
  const ctx = {
    fillStyle: '' as string,
    strokeStyle: '' as string,
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    calls,
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
  })
}

export const asContext = (mock: ReturnType<typeof createMockContext>) =>
  mock as unknown as CanvasRenderingContext2D

/** For tools that never restore pixels. */
export const noEnv = { restore: () => {} }
