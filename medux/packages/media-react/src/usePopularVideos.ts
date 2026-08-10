import { useEffect, useState } from 'react';
import type { PaginatedVideos } from 'media-core';
import { useMediaClient } from './MediaProvider';

export interface UsePopularVideosResult {
  videos: PaginatedVideos['videos'];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  page: number;
  loadMore: () => void;
}

/**
 * Fetches the Pexels popular videos feed.
 * Accumulates pages as `loadMore()` is called.
 *
 * @example
 * const { videos, loading, hasMore, loadMore } = usePopularVideos(10);
 */
export function usePopularVideos(pageSize = 10): UsePopularVideosResult {
  const client = useMediaClient();
  const [videos, setVideos] = useState<PaginatedVideos['videos']>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    client
      .popularVideos({ page: 1, per_page: pageSize })
      .then((res) => {
        setVideos(res.videos);
        setTotalResults(res.total_results);
        setPage(1);
        setInitialised(true);
      })
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, [client, pageSize]);

  const loadMore = () => {
    if (loading || !initialised) return;
    const nextPage = page + 1;
    setLoading(true);
    setError(null);
    client
      .popularVideos({ page: nextPage, per_page: pageSize })
      .then((res) => {
        setVideos((prev) => [...prev, ...res.videos]);
        setTotalResults(res.total_results);
        setPage(nextPage);
      })
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  };

  return {
    videos,
    loading,
    error,
    hasMore: videos.length < totalResults,
    page,
    loadMore,
  };
}
