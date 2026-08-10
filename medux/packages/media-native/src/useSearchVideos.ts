import { useCallback, useEffect, useRef, useState } from 'react';
import type { PexelsVideo, SearchVideosParams } from 'media-core';
import { useMediaClient } from './MediaProvider';

export interface UseSearchVideosResult {
  videos: PexelsVideo[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
}

export function useSearchVideos(query: string, pageSize = 10): UseSearchVideosResult {
  const client = useMediaClient();
  const [videos, setVideos] = useState<PexelsVideo[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    if (!query) {
      setVideos([]);
      setTotalResults(0);
      return;
    }

    const thisRequest = ++requestId.current;
    setLoading(true);
    setError(null);

    const params: SearchVideosParams = { query, page: 1, per_page: pageSize };
    client
      .searchVideos(params)
      .then((res) => {
        if (requestId.current !== thisRequest) return;
        setVideos(res.videos);
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
      .searchVideos({ query, page: nextPage, per_page: pageSize })
      .then((res) => {
        setVideos((prev) => [...prev, ...res.videos]);
        setTotalResults(res.total_results);
        setPage(nextPage);
      })
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, [client, query, page, pageSize, loading]);

  return { videos, loading, error, hasMore: videos.length < totalResults, loadMore };
}
