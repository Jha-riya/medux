import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';
import { PexelsClient, type MediaCoreConfig } from 'media-core';

const MediaClientContext = createContext<PexelsClient | null>(null);

export interface MediaProviderProps {
  config: MediaCoreConfig;
  children: ReactNode;
}

/**
 * Wraps the app in a media-core PexelsClient instance.
 * This is the ONLY place media-react constructs the client —
 * hooks below just read it from context.
 */
export function MediaProvider({ config, children }: MediaProviderProps) {
  // memoized so we don't recreate the client (and its cache) on every render
  const client = useMemo(() => new PexelsClient(config), [config.apiKey]);
  return createElement(MediaClientContext.Provider, { value: client }, children);
}

/** Internal — components in this package use this; consumers should prefer the named hooks below. */
export function useMediaClient(): PexelsClient {
  const client = useContext(MediaClientContext);
  if (!client) {
    throw new Error('useMediaClient must be used within a <MediaProvider>');
  }
  return client;
}
