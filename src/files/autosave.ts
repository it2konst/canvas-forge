/**
 * The current image, kept in the browser's IndexedDB so work survives a
 * closed tab or a reload. It never leaves the device.
 */
export interface Draft {
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

export async function loadDraft(): Promise<Draft | null> {
  const draft = (await run('readonly', (s) => s.get(KEY))) as Draft | undefined
  return draft?.image instanceof Blob ? draft : null
}

export const clearDraft = () => run('readwrite', (s) => s.delete(KEY))
