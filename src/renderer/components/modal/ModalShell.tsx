import { motion, AnimatePresence } from 'framer-motion';
import { modalContent } from '@renderer/animations/variants';
import * as React from 'react';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

/**
 * Reusable modal shell with backdrop and content.
 * Uses Framer Motion for smooth enter/exit animations.
 * Includes focus trap for accessibility.
 */
export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  children,
  title = 'Modal',
  className = '',
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
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
        (el: any) => !el.hasAttribute?.('disabled')
      ) as HTMLElement[];
    };

    // Focus first focusable element on mount
    const timer = setTimeout(() => {
      const focusables = getFocusables();
      (focusables[0] || container).focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
  }, [isOpen, onClose]);

  // Close on backdrop click (but not on content)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <AnimatePresence>
            <motion.div
              ref={containerRef}
              initial={modalContent.initial}
              animate={modalContent.animate}
              exit={modalContent.exit}
              transition={modalContent.transition}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              tabIndex={-1}
              className={`relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-bg-card rounded-lg border border-border shadow-2xl outline-none ${className}`}
            >
              <div className="p-4 space-y-4">
                {/* Close button in top-right */}
                <div className="flex justify-end">
                  <button
                    onClick={onClose}
                    className="p-1 rounded hover:text-primary hover:bg-bg-surface/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    aria-label="Cerrar modal"
                  >
                    <svg className="h-4 w-4" stroke="currentColor" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">{children}</div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </>
  );
};

ModalShell.displayName = 'ModalShell';
