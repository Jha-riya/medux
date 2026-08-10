import { useEffect, useState } from 'react';
import type { PexelsPhoto, PexelsVideo } from 'media-core';
import { useMediaClient } from './MediaProvider';

/** Fetches a single photo by id. Auto-emits a 'view' event via media-core. */
export function usePhoto(id: number | null) {
  const client = useMediaClient();
  const [photo, setPhoto] = useState<PexelsPhoto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (id === null) {
      setPhoto(null);
      return;
    }
    setLoading(true);
    setError(null);
    client
      .getPhoto(id)
      .then(setPhoto)
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, [client, id]);

  return { photo, loading, error };
}

/** Returns a stable function for the app to call when a user actually downloads an item. */
export function useTrackDownload() {
  const client = useMediaClient();
  return (item: PexelsPhoto | PexelsVideo) => client.trackDownload(item);
}
