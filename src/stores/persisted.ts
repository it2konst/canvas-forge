import { useLocalStorage } from '@vueuse/core'
import type { Ref } from 'vue'

/**
 * A setting kept in localStorage. Values read back are checked, so an
 * outdated or hand-edited entry falls back to the default instead of
 * breaking the editor.
 */
export function persisted<T extends string | number>(
  key: string,
  fallback: T,
  valid: (value: unknown) => value is T,
): Ref<T> {
  const numeric = typeof fallback === 'number'
  return useLocalStorage<T>(`cf:${key}`, fallback, {
    serializer: {
      read: (raw) => {
        const value = numeric ? Number(raw) : raw
        return valid(value) ? value : fallback
      },
      write: (value) => String(value),
    },
    writeDefaults: false,
  })
}

export const isHexColor = (v: unknown): v is string =>
  typeof v === 'string' && /^#[\da-f]{6}$/i.test(v)

export const isIntIn =
  (min: number, max: number) =>
  (v: unknown): v is number =>
    typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max

export const isOneOf =
  <T extends string>(options: readonly T[]) =>
  (v: unknown): v is T =>
    options.includes(v as T)
