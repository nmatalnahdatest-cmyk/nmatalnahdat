import React, { useRef } from 'react';
import gsap from 'gsap';
import { Loader2 } from 'lucide-react';
import { usePrefersReducedMotion } from '../../hooks/useGsapAnimations';

export type ButtonVariant = 'primary' | 'teal' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[#232325] text-[#FAF9F5] hover:bg-[#F8D568] hover:text-[#1D1D1F] hover:shadow-[0_10px_24px_-6px_rgba(248,213,104,0.65)] dark:bg-[#F8D568] dark:text-[#1D1D1F] dark:hover:bg-[#FFE382] border border-transparent shadow-[0_6px_16px_-4px_rgba(35,35,37,0.32)]',
  teal:
    'bg-[#232325] text-[#FAF9F5] hover:bg-[#F8D568] hover:text-[#1D1D1F] hover:shadow-[0_10px_24px_-6px_rgba(248,213,104,0.65)] dark:bg-[#F8D568] dark:text-[#1D1D1F] dark:hover:bg-[#FFE382] border border-transparent shadow-[0_6px_16px_-4px_rgba(35,35,37,0.35)]',
  secondary:
    'bg-[var(--surface-solid)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[#F8D568] hover:text-[#1D1D1F] hover:border-[#E6BC3C]/50 hover:shadow-[0_8px_20px_-6px_rgba(248,213,104,0.45)] shadow-[0_2px_8px_-2px_rgba(24,24,28,0.06)]',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:bg-[#F8D568]/35 hover:text-[var(--text-primary)] border border-transparent',
  danger:
    'bg-[#E5535E]/12 text-[#C42B37] dark:text-[#FF858E] border border-[#E5535E]/25 hover:bg-[#E5535E] hover:text-white hover:shadow-[0_8px_20px_-6px_rgba(229,83,94,0.45)]',
  success:
    'bg-[#1EA866] text-white hover:bg-[#179156] hover:shadow-[0_8px_20px_-6px_rgba(30,168,102,0.5)] border border-transparent',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-xl gap-1.5',
  md: 'h-10 px-4 text-sm rounded-2xl gap-2',
  lg: 'h-11 px-5 text-sm rounded-2xl gap-2',
  icon: 'h-9 w-9 p-0 rounded-xl justify-center',
};

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  onMouseEnter,
  onMouseLeave,
  ...rest
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const reduced = usePrefersReducedMotion();

  const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!reduced && !disabled && !loading && btnRef.current) {
      gsap.to(btnRef.current, {
        y: -2,
        scale: 1.025,
        duration: 0.18,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    }
    onMouseEnter?.(e);
  };

  const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!reduced && btnRef.current) {
      gsap.to(btnRef.current, {
        y: 0,
        scale: 1,
        duration: 0.22,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    }
    onMouseLeave?.(e);
  };

  return (
    <button
      ref={btnRef}
      data-animated-btn="true"
      disabled={disabled || loading}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`inline-flex items-center justify-center font-semibold whitespace-nowrap shrink-0 cursor-pointer select-none transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />}
      {children}
    </button>
  );
};
