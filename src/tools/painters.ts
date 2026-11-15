import { roundBrushStroke } from '@/engine/tools/brush'
import { hardSquareStroke } from '@/engine/tools/hard'
import type { StrokeFactory } from '@/engine/tools/types'
import type { ToolId } from './catalog'

/** Engine implementations of the tools that paint by dragging. */
const PAINTERS: Partial<Record<ToolId, StrokeFactory>> = {
  pencil: hardSquareStroke,
  brush: roundBrushStroke,
  // Like in Paint, the eraser paints with the other colour (colour 2 by default).
  eraser: hardSquareStroke,
}

export const strokeFactoryFor = (tool: ToolId): StrokeFactory | undefined => PAINTERS[tool]

/** Tools that already work. The rest are shown, but disabled until they land. */
export const isToolReady = (tool: ToolId): boolean => tool in PAINTERS
