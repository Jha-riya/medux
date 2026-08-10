import { useEffect, useRef } from 'react';
import type { MediaEventType, MediaEventPayload } from 'media-core';
import { useMediaClient } from './MediaProvider';

/**
 * Subscribes to SDK activity events for the lifetime of the component.
 *
 * The listener ref trick ensures we always call the latest version of the
 * listener without re-subscribing on every render (which would cause
 * a subscribe/unsubscribe loop if the consumer passes an inline function).
 *
 * This runs independently of media-core's built-in console logger —
 * the app can track activity (e.g. analytics) without touching or
 * disabling the default logging.
 *
 * @example
 * useMediaEvent('download', ({ item, timestamp }) => {
 *   analytics.track('media_download', { id: item.id, at: timestamp });
 * });
 */
export function useMediaEvent<T = unknown>(
  type: MediaEventType,
  listener: (payload: MediaEventPayload<T>) => void
) {
  const client = useMediaClient();

  // Keep a stable ref to the latest listener so we don't re-subscribe on
  // every render while still calling the freshest callback.
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    const stableListener = (payload: MediaEventPayload<T>) =>
      listenerRef.current(payload);

    const unsubscribe = client.events.on<T>(type, stableListener);
    return unsubscribe;
  }, [client, type]);
}
