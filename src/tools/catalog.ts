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

/** Settings shown in the properties panel while the tool is active. */
export type ToolOption = 'size' | 'shapeStyle' | 'tolerance' | 'font' | 'pickerHint' | 'selection'

export interface ToolDefinition {
  id: ToolId
  icon: string
  /** Single key that selects the tool, shown in its tooltip. */
  shortcut: string
  options: readonly ToolOption[]
}

/** Tools grouped the way they appear in the rail, with a divider between groups. */
export const TOOL_GROUPS: readonly (readonly ToolDefinition[])[] = [
  [
    { id: 'select', icon: iconSelect, shortcut: 'S', options: ['selection'] },
    { id: 'hand', icon: iconHand, shortcut: 'H', options: [] },
  ],
  [
    { id: 'pencil', icon: iconPencil, shortcut: 'P', options: ['size'] },
    { id: 'brush', icon: iconBrush, shortcut: 'B', options: ['size'] },
    { id: 'eraser', icon: iconEraser, shortcut: 'E', options: ['size'] },
    { id: 'fill', icon: iconFill, shortcut: 'G', options: ['tolerance'] },
    { id: 'picker', icon: iconPicker, shortcut: 'I', options: ['pickerHint'] },
    { id: 'text', icon: iconText, shortcut: 'T', options: ['font'] },
  ],
  [
    { id: 'line', icon: iconLine, shortcut: 'L', options: ['size'] },
    { id: 'rectangle', icon: iconRectangle, shortcut: 'R', options: ['size', 'shapeStyle'] },
    { id: 'ellipse', icon: iconEllipse, shortcut: 'O', options: ['size', 'shapeStyle'] },
  ],
]

export const TOOLS: readonly ToolDefinition[] = TOOL_GROUPS.flat()

export const toolById = (id: ToolId): ToolDefinition => TOOLS.find((t) => t.id === id)!
