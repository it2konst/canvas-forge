export type FontId = 'sans' | 'serif' | 'mono'

export interface FontChoice {
  id: FontId
  /** Shown in the font picker, in the font itself. */
  label: string
  family: string
}

/** The app's own fonts are self-hosted, so text looks the same everywhere. */
export const FONTS: readonly FontChoice[] = [
  { id: 'sans', label: 'Onest', family: '"Onest Variable", system-ui, sans-serif' },
  { id: 'serif', label: 'Serif', family: 'Georgia, "Times New Roman", serif' },
  {
    id: 'mono',
    label: 'JetBrains Mono',
    family: '"JetBrains Mono Variable", ui-monospace, monospace',
  },
]

export const fontById = (id: FontId): FontChoice => FONTS.find((f) => f.id === id)!
