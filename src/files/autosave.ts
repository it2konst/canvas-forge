/**
 * The current image, kept in the browser's IndexedDB so work survives a
 * closed tab or a reload. It never leaves the device.
 */
export interface DraftLayer {
  name: string
  visible: boolean
  opacity: number
  image: Blob
}

export interface Draft {
  version: 2
  layers: DraftLayer[]
  active: number
  width: number
  height: number
  name: string | null
  savedAt: number
}

/** Drafts written before layers existed held a single image. */
interface LegacyDraft {
  image: Blob
  width: number
  height: number
  name: string | null
  savedAt: number
}

const DB_NAME = 'canvas-forge'
const STORE = 'drafts'
const KEY = 'current'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const request = action(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(request.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export const saveDraft = (draft: Draft) => run('readwrite', (s) => s.put(draft, KEY))

/** Brings a stored draft of any version to the current shape; null if it is unusable. */
export function upgradeDraft(raw: unknown, backgroundName: string): Draft | null {
  if (!raw || typeof raw !== 'object') return null
  const draft = raw as Partial<Draft> & Partial<LegacyDraft>
  if (draft.version === 2) {
    const ok = Array.isArray(draft.layers) && draft.layers.every((l) => l.image instanceof Blob)
    return ok && draft.layers!.length ? (draft as Draft) : null
  }
  if (draft.image instanceof Blob) {
    const { image, width = 0, height = 0, name = null, savedAt = 0 } = draft
    return {
      version: 2,
      layers: [{ name: backgroundName, visible: true, opacity: 1, image }],
      active: 0,
      width,
      height,
      name,
      savedAt,
    }
  }
  return null
}

/** The saved draft, upgraded to layers if it is older; null when there is none. */
export async function loadDraft(backgroundName: string): Promise<Draft | null> {
  return upgradeDraft(await run('readonly', (s) => s.get(KEY)), backgroundName)
}

export const clearDraft = () => run('readwrite', (s) => s.delete(KEY))
