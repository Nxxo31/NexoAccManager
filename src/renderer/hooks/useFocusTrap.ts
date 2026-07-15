import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to manage focus trapping within an element.
 * Returns a callback ref that attaches the focus trap logic to the element.
 * When enabled, it traps Tab/Shift+Tab within the element, focuses the first
 * focusable element on mount, and restores focus to the previously focused
 * element on unmount.
 */
export function useFocusTrap(
  enabled: boolean,
  onEscape?: () => void
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const refCallback = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
  }, []);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container: HTMLDivElement = containerRef.current;
    previousFocusRef.current = document.activeElement as HTMLElement;

    const focusableSelector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const getFocusables = (): HTMLElement[] => {
      const elements = container.querySelectorAll(focusableSelector);
      return Array.from(elements).filter(
        (el) => !(el as HTMLElement).hasAttribute('disabled')
      ) as HTMLElement[];
    };

    // Focus first focusable element on mount
    const timer = setTimeout(() => {
      const focusables = getFocusables();
      (focusables[0] || container).focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }

      if (e.key === 'Tab') {
        const focusables = getFocusables();
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [enabled, onEscape]);

  return refCallback;
}