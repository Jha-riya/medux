export type MediaEventType = 'download' | 'view';

export interface MediaEventPayload<T = unknown> {
  type: MediaEventType;
  item: T;
  timestamp: number;
}

export type MediaEventListener<T = unknown> = (
  payload: MediaEventPayload<T>
) => void;

/** Minimal pub/sub emitter — no external deps, works anywhere JS runs. */
export class MediaEventEmitter {
  private listeners = new Map<MediaEventType, Set<MediaEventListener>>();

  on<T = unknown>(type: MediaEventType, listener: MediaEventListener<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener as MediaEventListener);
    // return an unsubscribe function so callers don't need to hold onto `this`
    return () => this.off(type, listener);
  }

  off<T = unknown>(type: MediaEventType, listener: MediaEventListener<T>): void {
    this.listeners.get(type)?.delete(listener as MediaEventListener);
  }

  emit<T = unknown>(type: MediaEventType, item: T): void {
    const payload: MediaEventPayload<T> = { type, item, timestamp: Date.now() };
    this.listeners.get(type)?.forEach((listener) => listener(payload));
  }
}
