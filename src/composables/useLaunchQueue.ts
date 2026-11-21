import { useImageFiles } from './useImageFiles'

/** The File Handling API, available in Chromium browsers for installed apps. */
interface LaunchParams {
  files: readonly FileSystemFileHandle[]
}
interface LaunchQueue {
  setConsumer(consumer: (params: LaunchParams) => void | Promise<void>): void
}

/**
 * When the installed app is chosen in "Open with" for an image (Chrome and
 * Edge on desktop), the operating system hands the file over here and it
 * opens like any other. With several files, the first one is used.
 */
export function useLaunchQueue() {
  const files = useImageFiles()
  const queue = (window as Window & { launchQueue?: LaunchQueue }).launchQueue
  if (!queue) return

  queue.setConsumer(async ({ files: handles }) => {
    const handle = handles[0]
    if (!handle) return
    try {
      await files.open(await handle.getFile())
    } catch {
      // The file may have been moved or permission withdrawn; nothing to open.
    }
  })
}
