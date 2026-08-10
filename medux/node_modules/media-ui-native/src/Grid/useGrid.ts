import { useCallback, useState } from 'react';

export interface UseGridOptions<T> {
  items: T[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  keyExtractor: (item: T, index: number) => string;
  /** How close to the end (0–1) before triggering load. Default 0.3 */
  endReachedThreshold?: number;
}

export interface UseGridResult<T> {
  /** Spread onto FlatList's props (data, keyExtractor, onEndReached, etc). */
  getFlatListProps: () => {
    data: T[];
    keyExtractor: (item: T, index: number) => string;
    onEndReached: () => void;
    onEndReachedThreshold: number;
    refreshing: boolean;
  };
  isEmpty: boolean;
}

/**
 * Headless hook for a media grid backed by React Native FlatList.
 *
 * @example
 * const { getFlatListProps, isEmpty } = useGrid({ items: photos, hasMore, loading, onLoadMore, keyExtractor: p => String(p.id) });
 * return (
 *   <FlatList
 *     {...getFlatListProps()}
 *     numColumns={2}
 *     renderItem={({ item }) => <PhotoCard photo={item} />}
 *   />
 * );
 */
export function useGrid<T>(options: UseGridOptions<T>): UseGridResult<T> {
  const { items, hasMore, loading, onLoadMore, keyExtractor, endReachedThreshold = 0.3 } = options;

  const handleEndReached = useCallback(() => {
    if (hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  const getFlatListProps = useCallback(
    () => ({
      data: items,
      keyExtractor,
      onEndReached: handleEndReached,
      onEndReachedThreshold: endReachedThreshold,
      refreshing: loading && items.length === 0,
    }),
    [items, keyExtractor, handleEndReached, endReachedThreshold, loading]
  );

  return {
    getFlatListProps,
    isEmpty: items.length === 0 && !loading,
  };
}
