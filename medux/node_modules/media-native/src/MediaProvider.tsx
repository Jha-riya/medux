import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';
import { PexelsClient, type MediaCoreConfig } from 'media-core';

const MediaClientContext = createContext<PexelsClient | null>(null);

export interface MediaProviderProps {
  config: MediaCoreConfig;
  children: ReactNode;
}

/**
 * Wraps the React Native app in a media-core PexelsClient instance.
 * This is the ONLY place media-native constructs the client —
 * hooks read it from context.
 *
 * @example
 * <MediaProvider config={{ apiKey: PEXELS_API_KEY }}>
 *   <App />
 * </MediaProvider>
 */
export function MediaProvider({ config, children }: MediaProviderProps) {
  const client = useMemo(() => new PexelsClient(config), [config.apiKey]);
  return createElement(MediaClientContext.Provider, { value: client }, children);
}

/** Internal — hooks in this package use this; consumers should use the named hooks. */
export function useMediaClient(): PexelsClient {
  const client = useContext(MediaClientContext);
  if (!client) {
    throw new Error('useMediaClient must be used within a <MediaProvider>');
  }
  return client;
}
