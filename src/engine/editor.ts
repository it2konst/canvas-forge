import { RasterDocument } from './document'

type Listener = () => void

/**
 * The drawing engine behind the UI. Plain TypeScript, no Vue: the store
 * holds one instance and mirrors the few flags the interface needs.
 */
export class Editor {
  doc: RasterDocument
  private renderListeners = new Set<Listener>()

  constructor(width: number, height: number) {
    this.doc = new RasterDocument(width, height)
  }

  /** Called whenever pixels change and the screen must be repainted. */
  onRender(listener: Listener): () => void {
    this.renderListeners.add(listener)
    return () => this.renderListeners.delete(listener)
  }

  protected requestRender(): void {
    for (const listener of this.renderListeners) listener()
  }
}
