interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Caches resolved responses for `ttlMs`, and de-dupes concurrent
 * requests for the same key so two simultaneous calls to the same
 * endpoint only hit the network once.
 */
export class RequestCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();

  constructor(private ttlMs: number = 60_000) {}

  async wrap<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.store.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const promise = fetcher()
      .then((value) => {
        this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
        this.inFlight.delete(key);
        return value;
      })
      .catch((err) => {
        this.inFlight.delete(key);
        throw err;
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  clear(): void {
    this.store.clear();
    this.inFlight.clear();
  }
}
