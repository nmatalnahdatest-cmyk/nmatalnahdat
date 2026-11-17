import React, { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { X } from 'lucide-react';
import { usePrefersReducedMotion } from '../../hooks/useGsapAnimations';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = 'max-w-2xl',
  children,
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      const timer = setTimeout(() => {
        const panel = panelRef.current;
        if (!panel) return;
        const focusable = panel.querySelector<HTMLElement>(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) focusable.focus();
        else panel.focus();
      }, 30);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus?.();
      previousFocusRef.current = null;
    }
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (!open || reduced) return;
    const ctx = gsap.context(() => {
      if (backdropRef.current) {
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.24, ease: 'power3.out' }
        );
      }
      if (panelRef.current) {
        gsap.fromTo(
          panelRef.current,
          { opacity: 0, y: 18, scale: 0.985 },
          { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power3.out' }
        );
      }
    });
    return () => ctx.revert();
  }, [open, reduced]);

  const handleAnimatedClose = () => {
    if (reduced || !backdropRef.current || !panelRef.current) {
      onClose();
      return;
    }
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.16, ease: 'power3.inOut' });
    gsap.to(panelRef.current, {
      opacity: 0,
      y: 10,
      scale: 0.985,
      duration: 0.16,
      ease: 'power3.inOut',
      onComplete: onClose,
    });
  };

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) handleAnimatedClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px] overflow-y-auto"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`w-full ${maxWidth} soft-card p-6 md:p-7 max-h-[90vh] flex flex-col relative outline-none`}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border-subtle)] shrink-0">
          <div className="min-w-0">
            <h2
              id="modal-title"
              className="text-lg md:text-xl font-bold text-[var(--text-primary)] tracking-tight"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAnimatedClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-5 overflow-y-auto sleek-scroll flex-1">{children}</div>
      </div>
    </div>
  );
};
