/** Most layers a document may have; each one is a full-size canvas in memory. */
export const MAX_LAYERS = 20

/** Moves an item to a new index; out-of-range targets are clamped. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const result = [...list]
  const target = Math.max(0, Math.min(result.length - 1, to))
  const [item] = result.splice(from, 1)
  if (item !== undefined) result.splice(target, 0, item)
  return result
}

/** After a layer is removed, the one below it becomes active, as in most editors. */
export const indexAfterRemoval = (removed: number): number => Math.max(0, removed - 1)

/** The lowest "Base N" not taken yet, numbered from 1. */
export function nextNumberedName(base: (n: number) => string, taken: readonly string[]): string {
  const used = new Set(taken)
  for (let n = 1; ; n++) {
    const name = base(n)
    if (!used.has(name)) return name
  }
}

/** Opacity as stored (0..1) from a percentage, rounded and clamped. */
export const opacityFromPercent = (percent: number): number =>
  Math.min(1, Math.max(0, Math.round(percent) / 100))
