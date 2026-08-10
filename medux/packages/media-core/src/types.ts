// ---- Pexels API shapes ----

export interface PexelsPhotoSrc {
  original: string;
  large2x: string;
  large: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
}

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string | null;
  src: PexelsPhotoSrc;
  liked: boolean;
  alt: string;
}

export interface PexelsVideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number | null;
  height: number | null;
  link: string;
}

export interface PexelsVideoPicture {
  id: number;
  picture: string;
  nr: number;
}

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: { id: number; name: string; url: string };
  video_files: PexelsVideoFile[];
  video_pictures: PexelsVideoPicture[];
}

export interface PaginatedPhotos {
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  total_results: number;
  next_page?: string;
  prev_page?: string;
}

export interface PaginatedVideos {
  page: number;
  per_page: number;
  videos: PexelsVideo[];
  total_results: number;
  next_page?: string;
  prev_page?: string;
}

// ---- Request params ----

export interface SearchPhotosParams {
  query: string;
  page?: number;
  per_page?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'large' | 'medium' | 'small';
  color?: string;
  locale?: string;
}

export interface SearchVideosParams {
  query: string;
  page?: number;
  per_page?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'large' | 'medium' | 'small';
  locale?: string;
}

export interface ListParams {
  page?: number;
  per_page?: number;
}

// ---- SDK config / errors ----

export interface MediaCoreConfig {
  apiKey: string;
  /** Override for testing; defaults to https://api.pexels.com */
  baseUrl?: string;
  /** How long cached responses stay fresh. Default 60s. */
  cacheTtlMs?: number;
  /** Auto-log events to console. Default true. */
  enableDefaultLogging?: boolean;
}

export class MediaCoreError extends Error {
  constructor(
    message: string,
    public status?: number,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'MediaCoreError';
  }
}
