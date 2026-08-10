import {
  useCallback,
  useEffect,
  useRef,
  type HTMLAttributes,
  type RefCallback,
} from 'react';

export interface UseGridOptions<T> {
  /** The current array of items to display. */
  items: T[];
  /** Whether there are more items to load. */
  hasMore: boolean;
  /** Whether a load is in progress. */
  loading: boolean;
  /** Called when the sentinel element enters the viewport. */
  onLoadMore: () => void;
  /** Extracts a stable key for each item. */
  keyExtractor: (item: T, index: number) => string;
}

export interface UseGridResult<T> {
  /** Spread onto the grid container element. */
  getContainerProps: () => HTMLAttributes<HTMLElement>;
  /** Spread onto each individual grid item element. */
  getItemProps: (item: T, index: number) => HTMLAttributes<HTMLElement> & { key: string };
  /**
   * Attach this ref to the sentinel element (a div at the bottom of the list).
   * The hook will observe it and call onLoadMore when it enters the viewport.
   */
  sentinelRef: RefCallback<HTMLElement | null>;
  /** Spread onto the sentinel element. */
  getSentinelProps: () => HTMLAttributes<HTMLElement>;
  /** Whether the grid has zero items and is not loading. */
  isEmpty: boolean;
}

/**
 * Headless hook for an infinite-scroll grid.
 *
 * The hook uses IntersectionObserver on a sentinel element to trigger
 * `onLoadMore` automatically. Consumers own all markup and CSS.
 *
 * @example
 * const { getContainerProps, getItemProps, sentinelRef, getSentinelProps } = useGrid({
 *   items: photos,
 *   hasMore,
 *   loading,
 *   onLoadMore: loadMore,
 *   keyExtractor: (p) => String(p.id),
 * });
 *
 * return (
 *   <div {...getContainerProps()} className="my-grid">
 *     {photos.map((photo, i) => (
 *       <div {...getItemProps(photo, i)} className="my-grid__item">
 *         <img src={photo.src.medium} alt={photo.alt} />
 *       </div>
 *     ))}
 *     <div ref={sentinelRef} {...getSentinelProps()} />
 *   </div>
 * );
 */
export function useGrid<T>(options: UseGridOptions<T>): UseGridResult<T> {
  const { items, hasMore, loading, onLoadMore, keyExtractor } = options;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  // sentinelRef is a callback ref so we get told immediately when the
  // sentinel element mounts or unmounts.
  const sentinelRef: RefCallback<HTMLElement | null> = useCallback(
    (node) => {
      // Tear down previous observer whenever the node changes.
      observerRef.current?.disconnect();

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            onLoadMoreRef.current();
          }
        },
        { threshold: 0.1 }
      );

      observerRef.current.observe(node);
    },
    [] // stable — never recreated
  );

  // Stop observing when hasMore becomes false or loading starts.
  useEffect(() => {
    if (!hasMore || loading) {
      observerRef.current?.disconnect();
    }
  }, [hasMore, loading]);

  // Cleanup on unmount.
  useEffect(() => () => observerRef.current?.disconnect(), []);

  const getContainerProps = useCallback(
    (): HTMLAttributes<HTMLElement> => ({
      role: 'list',
      'aria-busy': loading,
    } as HTMLAttributes<HTMLElement>),
    [loading]
  );

  const getItemProps = useCallback(
    (item: T, index: number): HTMLAttributes<HTMLElement> & { key: string } => ({
      key: keyExtractor(item, index),
      role: 'listitem',
    }),
    [keyExtractor]
  );

  const getSentinelProps = useCallback(
    (): HTMLAttributes<HTMLElement> => ({
      'aria-hidden': true,
      style: { height: '1px', width: '100%' },
    } as HTMLAttributes<HTMLElement>),
    []
  );

  return {
    getContainerProps,
    getItemProps,
    sentinelRef,
    getSentinelProps,
    isEmpty: items.length === 0 && !loading,
  };
}
