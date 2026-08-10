import { RequestCache } from './cache';
import { MediaEventEmitter } from './events';
import {
  MediaCoreConfig,
  MediaCoreError,
  PaginatedPhotos,
  PaginatedVideos,
  PexelsPhoto,
  PexelsVideo,
  SearchPhotosParams,
  SearchVideosParams,
  ListParams,
} from './types';

const DEFAULT_BASE_URL = 'https://api.pexels.com';

export class PexelsClient {
  private apiKey: string;
  private baseUrl: string;
  private cache: RequestCache;
  private unsubscribeDefaultLogger?: (() => void)[];

  /** Public event bus — consumers can subscribe independently of the SDK's own logging. */
  readonly events = new MediaEventEmitter();

  constructor(config: MediaCoreConfig) {
    if (!config.apiKey) {
      throw new MediaCoreError('MediaCoreConfig.apiKey is required');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.cache = new RequestCache(config.cacheTtlMs ?? 60_000);

    if (config.enableDefaultLogging ?? true) {
      const offDownload = this.events.on('download', (p) =>
        console.log('[media-core] download', p.item)
      );
      const offView = this.events.on('view', (p) =>
        console.log('[media-core] view', p.item)
      );
      this.unsubscribeDefaultLogger = [offDownload, offView];
    }
  }

  /** Turn off the SDK's built-in console logging, e.g. once the app wires its own listeners. */
  disableDefaultLogging(): void {
    this.unsubscribeDefaultLogger?.forEach((off) => off());
    this.unsubscribeDefaultLogger = undefined;
  }

  // ---- Photos ----

  async searchPhotos(params: SearchPhotosParams): Promise<PaginatedPhotos> {
    return this.get<PaginatedPhotos>('/v1/search', params as Record<string, unknown>);
  }

  async curatedPhotos(params: ListParams = {}): Promise<PaginatedPhotos> {
    return this.get<PaginatedPhotos>('/v1/curated', params as Record<string, unknown>);
  }

  async getPhoto(id: number): Promise<PexelsPhoto> {
    const photo = await this.get<PexelsPhoto>(`/v1/photos/${id}`);
    this.events.emit('view', photo);
    return photo;
  }

  // ---- Videos ----

  async searchVideos(params: SearchVideosParams): Promise<PaginatedVideos> {
    return this.get<PaginatedVideos>('/videos/search', params as Record<string, unknown>);
  }

  async popularVideos(params: ListParams = {}): Promise<PaginatedVideos> {
    return this.get<PaginatedVideos>('/videos/popular', params as Record<string, unknown>);
  }

  async getVideo(id: number): Promise<PexelsVideo> {
    const video = await this.get<PexelsVideo>(`/videos/videos/${id}`);
    this.events.emit('view', video);
    return video;
  }

  // ---- Activity tracking ----
  // Pexels can't tell us when a user actually saves a file, so the
  // wrapper/app calls this explicitly when a real download happens.
  trackDownload(item: PexelsPhoto | PexelsVideo): void {
    this.events.emit('download', item);
  }

  // ---- Internal ----

  private async get<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
    const url = new URL(path, this.baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    const cacheKey = url.toString();

    return this.cache.wrap(cacheKey, async () => {
      let response: Response;
      try {
        response = await fetch(url.toString(), {
          headers: { Authorization: this.apiKey },
        });
      } catch (err) {
        throw new MediaCoreError('Network request to Pexels failed', undefined, err);
      }

      if (!response.ok) {
        throw new MediaCoreError(
          `Pexels API error: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      return (await response.json()) as T;
    });
  }
}
