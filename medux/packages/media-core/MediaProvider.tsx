import { useCallback, useEffect, useRef, useState } from 'react';
import type { PexelsPhoto, SearchPhotosParams } from 'media-core';
import { useMediaClient } from './MediaProvider';

export interface UseSearchPhotosResult {
  photos: PexelsPhoto[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * Searches Pexels photos and accumulates pages as loadMore() is called.
 * Resets automatically when the query changes.
 */
export function useSearchPhotos(query: string, pageSize = 20): UseSearchPhotosResult {
  const client = useMediaClient();
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    if (!query) {
      setPhotos([]);
      setTotalResults(0);
      return;
    }

    const thisRequest = ++requestId.current;
    setLoading(true);
    setError(null);

    const params: SearchPhotosParams = { query, page: 1, per_page: pageSize };
    client
      .searchPhotos(params)
      .then((res) => {
        if (requestId.current !== thisRequest) return; // stale response, query changed since
        setPhotos(res.photos);
        setTotalResults(res.total_results);
        setPage(1);
      })
      .catch((err) => {
        if (requestId.current !== thisRequest) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (requestId.current === thisRequest) setLoading(false);
      });
  }, [client, query, pageSize]);

  const loadMore = useCallback(() => {
    if (loading || !query) return;
    const nextPage = page + 1;
    setLoading(true);
    setError(null);

    client
      .searchPhotos({ query, page: nextPage, per_page: pageSize })
      .then((res) => {
        setPhotos((prev) => [...prev, ...res.photos]);
        setTotalResults(res.total_results);
        setPage(nextPage);
      })
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, [client, query, page, pageSize, loading]);

  return {
    photos,
    loading,
    error,
    hasMore: photos.length < totalResults,
    loadMore,
  };
}
