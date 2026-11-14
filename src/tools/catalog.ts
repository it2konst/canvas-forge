import {
  iconBrush,
  iconEllipse,
  iconEraser,
  iconFill,
  iconHand,
  iconLine,
  iconPencil,
  iconPicker,
  iconRectangle,
  iconSelect,
  iconText,
} from '@/icons'

export type ToolId =
  | 'select'
  | 'hand'
  | 'pencil'
  | 'brush'
  | 'eraser'
  | 'fill'
  | 'picker'
  | 'text'
  | 'line'
  | 'rectangle'
  | 'ellipse'

export interface ToolDefinition {
  id: ToolId
  icon: string
  /** Single key that selects the tool, shown in its tooltip. */
  shortcut: string
}

/** Tools grouped the way they appear in the rail, with a divider between groups. */
export const TOOL_GROUPS: readonly (readonly ToolDefinition[])[] = [
  [
    { id: 'select', icon: iconSelect, shortcut: 'S' },
    { id: 'hand', icon: iconHand, shortcut: 'H' },
  ],
  [
    { id: 'pencil', icon: iconPencil, shortcut: 'P' },
    { id: 'brush', icon: iconBrush, shortcut: 'B' },
    { id: 'eraser', icon: iconEraser, shortcut: 'E' },
    { id: 'fill', icon: iconFill, shortcut: 'G' },
    { id: 'picker', icon: iconPicker, shortcut: 'I' },
    { id: 'text', icon: iconText, shortcut: 'T' },
  ],
  [
    { id: 'line', icon: iconLine, shortcut: 'L' },
    { id: 'rectangle', icon: iconRectangle, shortcut: 'R' },
    { id: 'ellipse', icon: iconEllipse, shortcut: 'O' },
  ],
]

export const TOOLS: readonly ToolDefinition[] = TOOL_GROUPS.flat()
