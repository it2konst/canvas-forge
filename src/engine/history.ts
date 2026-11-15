export interface HistoryEntry {
  /** Memory the entry holds, used to keep the history within budget. */
  readonly bytes: number
}

export interface HistoryLimits {
  maxSteps: number
  maxBytes: number
}

/**
 * Undo and redo stacks with a step and memory budget. When over budget the
 * oldest steps are dropped; the newest step is always kept, even if it is
 * larger than the whole budget on its own.
 */
export class History<T extends HistoryEntry> {
  private done: T[] = []
  private undone: T[] = []
  private totalBytes = 0

  constructor(private readonly limits: HistoryLimits) {}

  get canUndo(): boolean {
    return this.done.length > 0
  }

  get canRedo(): boolean {
    return this.undone.length > 0
  }

  get bytes(): number {
    return this.totalBytes
  }

  get steps(): number {
    return this.done.length
  }

  push(entry: T): void {
    // A new action makes the redo branch unreachable.
    for (const dropped of this.undone) this.totalBytes -= dropped.bytes
    this.undone = []

    this.done.push(entry)
    this.totalBytes += entry.bytes

    while (
      this.done.length > 1 &&
      (this.done.length > this.limits.maxSteps || this.totalBytes > this.limits.maxBytes)
    ) {
      this.totalBytes -= this.done.shift()!.bytes
    }
  }

  /** Returns the step to revert, or undefined when there is nothing to undo. */
  undo(): T | undefined {
    const entry = this.done.pop()
    if (entry) this.undone.push(entry)
    return entry
  }

  /** Returns the step to apply again, or undefined when there is nothing to redo. */
  redo(): T | undefined {
    const entry = this.undone.pop()
    if (entry) this.done.push(entry)
    return entry
  }

  clear(): void {
    this.done = []
    this.undone = []
    this.totalBytes = 0
  }
}
