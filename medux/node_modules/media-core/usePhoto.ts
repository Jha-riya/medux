import { useEffect } from 'react';
import type { MediaEventType, MediaEventPayload } from 'media-core';
import { useMediaClient } from './MediaProvider';

/**
 * Subscribes to SDK activity events for the lifetime of the component.
 * This runs independently of media-core's built-in console logger —
 * the app can track activity (e.g. send to analytics) without touching
 * or disabling the default logging.
 */
export function useMediaEvent<T = unknown>(
  type: MediaEventType,
  listener: (payload: MediaEventPayload<T>) => void
) {
  const client = useMediaClient();

  useEffect(() => {
    const unsubscribe = client.events.on<T>(type, listener);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, type]);
}
