import type { StrokeFactory } from '@/engine/tools/types'
import type { ToolId } from './catalog'

/** Engine implementations of the tools that paint by dragging. Filled in as tools land. */
const PAINTERS: Partial<Record<ToolId, StrokeFactory>> = {}

export const strokeFactoryFor = (tool: ToolId): StrokeFactory | undefined => PAINTERS[tool]
