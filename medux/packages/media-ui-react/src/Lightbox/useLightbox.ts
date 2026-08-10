import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type RefObject,
} from 'react';
import { useFocusTrap } from './useFocusTrap';

export interface LightboxItem {
  /** Unique identifier for this item. */
  id: string | number;
  /** 'photo' renders an <img>, 'video' renders a <video>. */
  type: 'photo' | 'video';
  /** Primary media URL. */
  src: string;
  /** Fallback poster image for videos. */
  poster?: string;
  /** Alt text / accessible label. */
  alt?: string;
  /** Attribution string, e.g. photographer name. */
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
  /** Spread onto the backdrop/overlay element. */
  getOverlayProps: () => HTMLAttributes<HTMLDivElement>;
  /** Spread onto the dialog content container. */
  getContentProps: () => HTMLAttributes<HTMLDivElement>;
  /** Spread onto the close button. */
  getCloseButtonProps: () => ButtonHTMLAttributes<HTMLButtonElement>;
  /** Spread onto the previous-item button. */
  getPrevButtonProps: () => ButtonHTMLAttributes<HTMLButtonElement>;
  /** Spread onto the next-item button. */
  getNextButtonProps: () => ButtonHTMLAttributes<HTMLButtonElement>;
  /** Ref to attach to the content container (needed for focus trap). */
  contentRef: RefObject<HTMLDivElement | null>;
}

/**
 * Headless hook for a media lightbox / modal.
 *
 * Handles: keyboard navigation (ArrowLeft/Right, Escape), focus trapping,
 * backdrop-click-to-close, and correct ARIA attributes.
 * Consumers supply all markup and CSS.
 *
 * @example
 * const lb = useLightbox({ items, initialIndex: 0, onClose });
 * return (
 *   <div {...lb.getOverlayProps()} className="overlay">
 *     <div ref={lb.contentRef} {...lb.getContentProps()} className="dialog">
 *       <button {...lb.getCloseButtonProps()}>✕</button>
 *       {lb.currentItem?.type === 'photo'
 *         ? <img src={lb.currentItem.src} alt={lb.currentItem.alt} />
 *         : <video src={lb.currentItem?.src} autoPlay loop />}
 *       <button {...lb.getPrevButtonProps()}>‹</button>
 *       <button {...lb.getNextButtonProps()}>›</button>
 *     </div>
 *   </div>
 * );
 */
export function useLightbox(options: UseLightboxOptions): UseLightboxResult {
  const { items, initialIndex = 0, onClose } = options;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const contentRef = useRef<HTMLDivElement>(null);

  // Keep index in bounds if items array changes.
  const safeIndex = Math.min(Math.max(currentIndex, 0), Math.max(items.length - 1, 0));
  const currentItem = items[safeIndex] ?? null;

  // Activate focus trap while the lightbox is open.
  useFocusTrap(contentRef, true);

  // Keyboard navigation.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((i) => Math.min(i + 1, items.length - 1));
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items.length]);

  const getOverlayProps = useCallback(
    (): HTMLAttributes<HTMLDivElement> => ({
      role: 'presentation',
      style: {
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
      },
      onClick: (e) => {
        // Close only when clicking the backdrop itself, not the content.
        if (e.target === e.currentTarget) onCloseRef.current();
      },
    }),
    []
  );

  const getContentProps = useCallback(
    (): HTMLAttributes<HTMLDivElement> => ({
      role: 'dialog',
      'aria-modal': true,
      'aria-label': currentItem?.alt ?? 'Media lightbox',
      tabIndex: -1,
      onClick: (e) => e.stopPropagation(),
    } as HTMLAttributes<HTMLDivElement>),
    [currentItem?.alt]
  );

  const getCloseButtonProps = useCallback(
    (): ButtonHTMLAttributes<HTMLButtonElement> => ({
      type: 'button',
      'aria-label': 'Close lightbox',
      onClick: () => onCloseRef.current(),
    } as ButtonHTMLAttributes<HTMLButtonElement>),
    []
  );

  const getPrevButtonProps = useCallback(
    (): ButtonHTMLAttributes<HTMLButtonElement> => ({
      type: 'button',
      'aria-label': 'Previous item',
      disabled: safeIndex === 0,
      onClick: () => setCurrentIndex((i) => Math.max(i - 1, 0)),
    }),
    [safeIndex]
  );

  const getNextButtonProps = useCallback(
    (): ButtonHTMLAttributes<HTMLButtonElement> => ({
      type: 'button',
      'aria-label': 'Next item',
      disabled: safeIndex === items.length - 1,
      onClick: () => setCurrentIndex((i) => Math.min(i + 1, items.length - 1)),
    }),
    [safeIndex, items.length]
  );

  return {
    currentItem,
    currentIndex: safeIndex,
    hasPrev: safeIndex > 0,
    hasNext: safeIndex < items.length - 1,
    getOverlayProps,
    getContentProps,
    getCloseButtonProps,
    getPrevButtonProps,
    getNextButtonProps,
    contentRef,
  };
}
