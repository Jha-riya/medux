import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type RefCallback,
} from 'react';

export interface UseReelSwiperOptions<T> {
  items: T[];
  /** Called whenever the snapped/active item changes. */
  onActiveChange?: (index: number, item: T) => void;
  /**
   * IntersectionObserver threshold used to decide which item is "active".
   * Higher = item must be more visible to be considered active. Default 0.6.
   */
  activeThreshold?: number;
}

export interface UseReelSwiperResult<T> {
  /** Index of the currently visible / snapped item. */
  activeIndex: number;
  /** The currently active item, or null if items is empty. */
  activeItem: T | null;
  /** Spread onto the scroll container. */
  getContainerProps: () => HTMLAttributes<HTMLElement>;
  /** Spread onto each item wrapper. Pass the item's index. */
  getItemProps: (index: number) => HTMLAttributes<HTMLElement>;
  /** Callback ref — attach to each item element so the hook can observe them. */
  getItemRef: (index: number) => RefCallback<HTMLElement | null>;
}

/**
 * Headless hook for a vertical snap-scroll reel (TikTok / Reels style).
 *
 * Uses CSS scroll-snap (injected via inline style props) and IntersectionObserver
 * to detect the active item. Consumers supply all markup and CSS.
 *
 * @example
 * const { getContainerProps, getItemProps, getItemRef, activeIndex } = useReelSwiper({
 *   items: videos,
 *   onActiveChange: (i, video) => setActiveVideo(video),
 * });
 *
 * return (
 *   <div {...getContainerProps()} style={{ height: '100vh', ...getContainerProps().style }}>
 *     {videos.map((video, i) => (
 *       <div
 *         key={video.id}
 *         ref={getItemRef(i)}
 *         {...getItemProps(i)}
 *         style={{ height: '100vh', ...getItemProps(i).style }}
 *       >
 *         <video src={video.video_files[0].link} loop muted />
 *       </div>
 *     ))}
 *   </div>
 * );
 */
export function useReelSwiper<T>(options: UseReelSwiperOptions<T>): UseReelSwiperResult<T> {
  const { items, onActiveChange, activeThreshold = 0.6 } = options;

  const [activeIndex, setActiveIndex] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const itemRefsRef = useRef<Map<number, HTMLElement>>(new Map());
  const onActiveChangeRef = useRef(onActiveChange);
  onActiveChangeRef.current = onActiveChange;

  // Set up one shared IntersectionObserver for all items.
  useEffect(() => {
    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Find which index this element corresponds to.
            for (const [index, el] of itemRefsRef.current) {
              if (el === entry.target) {
                setActiveIndex(index);
                onActiveChangeRef.current?.(index, items[index]);
                break;
              }
            }
          }
        }
      },
      { threshold: activeThreshold }
    );

    // Observe all currently registered item elements.
    for (const el of itemRefsRef.current.values()) {
      observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, [items, activeThreshold]);

  // Callback ref factory — one per index, stable between renders.
  const getItemRef = useCallback(
    (index: number): RefCallback<HTMLElement | null> =>
      (node) => {
        if (node) {
          itemRefsRef.current.set(index, node);
          observerRef.current?.observe(node);
        } else {
          const el = itemRefsRef.current.get(index);
          if (el) observerRef.current?.unobserve(el);
          itemRefsRef.current.delete(index);
        }
      },
    []
  );

  const containerStyle: CSSProperties = {
    overflowY: 'scroll',
    scrollSnapType: 'y mandatory',
    // The consumer must set a fixed height (e.g. 100vh) for snapping to work.
  };

  const getContainerProps = useCallback(
    (): HTMLAttributes<HTMLElement> => ({
      style: containerStyle,
      role: 'feed',
      'aria-label': 'Media reel',
    } as HTMLAttributes<HTMLElement>),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const getItemProps = useCallback(
    (index: number): HTMLAttributes<HTMLElement> => ({
      role: 'article',
      'aria-posinset': index + 1,
      'aria-setsize': items.length,
      style: {
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
      },
    } as HTMLAttributes<HTMLElement>),
    [items.length]
  );

  return {
    activeIndex,
    activeItem: items[activeIndex] ?? null,
    getContainerProps,
    getItemProps,
    getItemRef,
  };
}
