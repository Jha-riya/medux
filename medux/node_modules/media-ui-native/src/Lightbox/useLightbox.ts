import { useCallback, useState, useRef } from 'react';

export interface LightboxItem {
  id: string | number;
  type: 'photo' | 'video';
  src: string;
  poster?: string;
  alt?: string;
  credit?: string;
}

export interface UseLightboxOptions {
  items: LightboxItem[];
  initialIndex?: number;
  onClose: () => void;
}

export interface UseLightboxResult {
  currentItem: LightboxItem | null;
  currentIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
  /** Call when back button/gesture is pressed. */
  onRequestClose: () => void;
  /** Navigate to previous item. */
  goToPrev: () => void;
  /** Navigate to next item. */
  goToNext: () => void;
  /** Props to spread onto RN Modal. */
  getModalProps: () => {
    visible: boolean;
    transparent: boolean;
    animationType: 'fade' | 'slide' | 'none';
    onRequestClose: () => void;
    accessibilityViewIsModal: boolean;
  };
}

/**
 * Headless hook for a React Native media lightbox.
 * Consumers render their own Modal, Image, Video, and navigation buttons.
 *
 * @example
 * const lb = useLightbox({ items, initialIndex: 0, onClose });
 * return (
 *   <Modal {...lb.getModalProps()}>
 *     <Pressable onPress={lb.onRequestClose} style={styles.backdrop}>
 *       {lb.currentItem?.type === 'photo' && <Image source={{ uri: lb.currentItem.src }} />}
 *     </Pressable>
 *   </Modal>
 * );
 */
export function useLightbox(options: UseLightboxOptions): UseLightboxResult {
  const { items, initialIndex = 0, onClose } = options;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const safeIndex = Math.min(Math.max(currentIndex, 0), Math.max(items.length - 1, 0));

  const goToPrev = useCallback(() => setCurrentIndex((i) => Math.max(i - 1, 0)), []);
  const goToNext = useCallback(
    () => setCurrentIndex((i) => Math.min(i + 1, items.length - 1)),
    [items.length]
  );

  const handleRequestClose = useCallback(() => onCloseRef.current(), []);

  const getModalProps = useCallback(
    () => ({
      visible: true,
      transparent: true,
      animationType: 'fade' as const,
      onRequestClose: handleRequestClose,
      accessibilityViewIsModal: true,
    }),
    [handleRequestClose]
  );

  return {
    currentItem: items[safeIndex] ?? null,
    currentIndex: safeIndex,
    hasPrev: safeIndex > 0,
    hasNext: safeIndex < items.length - 1,
    onRequestClose: handleRequestClose,
    goToPrev,
    goToNext,
    getModalProps,
  };
}
