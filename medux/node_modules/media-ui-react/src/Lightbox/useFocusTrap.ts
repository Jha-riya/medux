import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary',
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
    (el) => !el.closest('[inert]') && getComputedStyle(el).display !== 'none'
  );
}

/**
 * Traps keyboard focus inside `containerRef` while `active` is true.
 * Restores focus to the previously focused element when deactivated.
 *
 * @param containerRef - ref attached to the dialog/modal root element
 * @param active - whether the trap is currently active
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean
) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Save the currently focused element so we can restore it on close.
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Move focus into the container.
    const container = containerRef.current;
    if (container) {
      const firstFocusable = getFocusableElements(container)[0];
      (firstFocusable ?? container).focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !containerRef.current) return;
      const focusable = getFocusableElements(containerRef.current);
      if (focusable.length === 0) { e.preventDefault(); return; }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus when trap deactivates.
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [active, containerRef]);
}
