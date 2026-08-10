import { useEffect, useRef } from 'react';
import type { MediaEventType, MediaEventPayload } from 'media-core';
import { useMediaClient } from './MediaProvider';

/**
 * Subscribes to SDK activity events for the lifetime of the component.
 * Uses a ref to avoid stale closures without re-subscribing on each render.
 */
export function useMediaEvent<T = unknown>(
  type: MediaEventType,
  listener: (payload: MediaEventPayload<T>) => void
) {
  const client = useMediaClient();
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    const stableListener = (payload: MediaEventPayload<T>) =>
      listenerRef.current(payload);
    const unsubscribe = client.events.on<T>(type, stableListener);
    return unsubscribe;
  }, [client, type]);
}
