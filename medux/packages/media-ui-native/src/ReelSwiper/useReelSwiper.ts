import { useCallback, useRef, useState } from 'react';

export interface UseReelSwiperOptions<T> {
  items: T[];
  onActiveChange?: (index: number, item: T) => void;
}

export interface ViewabilityConfig {
  itemVisiblePercentThreshold: number;
}

export interface ViewToken<T> {
  item: T;
  index: number | null;
  isViewable: boolean;
}

export interface UseReelSwiperResult<T> {
  activeIndex: number;
  activeItem: T | null;
  /** Spread onto FlatList. */
  getFlatListProps: () => {
    pagingEnabled: boolean;
    showsVerticalScrollIndicator: boolean;
    decelerationRate: 'fast';
    viewabilityConfig: ViewabilityConfig;
    onViewableItemsChanged: (info: { viewableItems: ViewToken<T>[] }) => void;
  };
}

/**
 * Headless hook for a vertical reel swiper backed by React Native FlatList.
 *
 * @example
 * const { getFlatListProps, activeIndex } = useReelSwiper({ items: videos, onActiveChange });
 * return (
 *   <FlatList
 *     {...getFlatListProps()}
 *     data={videos}
 *     keyExtractor={(v) => String(v.id)}
 *     renderItem={({ item, index }) => (
 *       <View style={{ height: screenHeight }}>
 *         <Video source={{ uri: item.video_files[0].link }} />
 *       </View>
 *     )}
 *   />
 * );
 */
export function useReelSwiper<T>(options: UseReelSwiperOptions<T>): UseReelSwiperResult<T> {
  const { items, onActiveChange } = options;
  const [activeIndex, setActiveIndex] = useState(0);
  const onActiveChangeRef = useRef(onActiveChange);
  onActiveChangeRef.current = onActiveChange;

  const viewabilityConfig: ViewabilityConfig = {
    itemVisiblePercentThreshold: 60,
  };

  // Must be stable — RN warns if this changes between renders.
  const onViewableItemsChangedRef = useRef(
    (info: { viewableItems: ViewToken<T>[] }) => {
      const first = info.viewableItems[0];
      if (first && first.index !== null) {
        setActiveIndex(first.index);
        onActiveChangeRef.current?.(first.index, first.item);
      }
    }
  );

  const getFlatListProps = useCallback(
    () => ({
      pagingEnabled: true,
      showsVerticalScrollIndicator: false,
      decelerationRate: 'fast' as const,
      viewabilityConfig,
      onViewableItemsChanged: onViewableItemsChangedRef.current,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return {
    activeIndex,
    activeItem: items[activeIndex] ?? null,
    getFlatListProps,
  };
}
