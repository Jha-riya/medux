import { useEffect, useState } from 'react';
import type { PaginatedPhotos } from 'media-core';
import { useMediaClient } from './MediaProvider';

export interface UseCuratedPhotosResult {
  photos: PaginatedPhotos['photos'];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  page: number;
  loadMore: () => void;
}

export function useCuratedPhotos(pageSize = 20): UseCuratedPhotosResult {
  const client = useMediaClient();
  const [photos, setPhotos] = useState<PaginatedPhotos['photos']>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    setLoading(true);
    client
      .curatedPhotos({ page: 1, per_page: pageSize })
      .then((res) => {
        setPhotos(res.photos);
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
    client
      .curatedPhotos({ page: nextPage, per_page: pageSize })
      .then((res) => {
        setPhotos((prev) => [...prev, ...res.photos]);
        setTotalResults(res.total_results);
        setPage(nextPage);
      })
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  };

  return { photos, loading, error, hasMore: photos.length < totalResults, page, loadMore };
}
