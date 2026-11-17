import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { usePrefersReducedMotion } from '../../hooks/useGsapAnimations';

export interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toast: ToastState | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (!toast || !ref.current || reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 18, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power3.out' }
      );
    });
    return () => ctx.revert();
  }, [toast, reduced]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed bottom-5 end-5 z-[60] max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <div
        ref={ref}
        role={isError ? 'alert' : 'status'}
        className={`pointer-events-auto soft-float-popover rounded-2xl px-4 py-3.5 flex items-start gap-3 border ${
          isError
            ? 'border-[#F05A65]/40 bg-[#FFF5F6] dark:bg-[#2B171B] text-[#B92B37] dark:text-[#FF8A93]'
            : isSuccess
            ? 'border-[#00C985]/35 bg-[#F2FCF8] dark:bg-[#112A22] text-[#097A53] dark:text-[#4AE5AB]'
            : 'border-[#4388FF]/35 bg-[var(--surface-elevated)] text-[var(--text-primary)]'
        }`}
      >
        <span className="mt-0.5 shrink-0">
          {isError ? (
            <AlertCircle className="w-4 h-4" />
          ) : isSuccess ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Info className="w-4 h-4 text-[#4388FF]" />
          )}
        </span>
        <p className="text-xs sm:text-sm font-medium flex-1 leading-snug">{toast.message}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="opacity-65 hover:opacity-100 p-0.5 cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
