import { roundBrushStroke } from '@/engine/tools/brush'
import { hardSquareStroke } from '@/engine/tools/hard'
import { shapeStroke, type ShapeSettings } from '@/engine/tools/shapes'
import type { StrokeFactory } from '@/engine/tools/types'
import type { ToolId } from './catalog'

/** Engine implementations of the tools that paint by dragging. */
const PAINTERS: Partial<Record<ToolId, StrokeFactory<ShapeSettings>>> = {
  pencil: hardSquareStroke,
  brush: roundBrushStroke,
  // Like in Paint, the eraser paints with the other colour (colour 2 by default).
  eraser: hardSquareStroke,
  line: shapeStroke('line'),
  rectangle: shapeStroke('rectangle'),
  ellipse: shapeStroke('ellipse'),
}

export const strokeFactoryFor = (tool: ToolId): StrokeFactory<ShapeSettings> | undefined =>
  PAINTERS[tool]

/** Tools that act on a click rather than a drag. */
const CLICK_TOOLS: ReadonlySet<ToolId> = new Set<ToolId>(['fill', 'picker', 'text'])

/** Tools that already work. The rest are shown, but disabled until they land. */
export const isToolReady = (tool: ToolId): boolean => tool in PAINTERS || CLICK_TOOLS.has(tool)

/** Tools whose cursor shows their size as an outline. */
export const hasSizeCursor = (tool: ToolId): boolean =>
  tool === 'pencil' || tool === 'brush' || tool === 'eraser'
