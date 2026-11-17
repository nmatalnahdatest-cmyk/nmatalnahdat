import React from 'react';

const PALETTES = [
  'bg-[#153B40]/12 text-[#153B40] dark:bg-[#2DD4BF]/15 dark:text-[#5EEAD4]',
  'bg-[#4388FF]/14 text-[#2366DB] dark:bg-[#4388FF]/20 dark:text-[#94C5FF]',
  'bg-[#00C985]/14 text-[#008C5C] dark:bg-[#00C985]/20 dark:text-[#4CE8B0]',
  'bg-[#8957FF]/14 text-[#6B3AE0] dark:bg-[#8957FF]/20 dark:text-[#BBA0FF]',
  'bg-[#FFD84D]/25 text-[#8A6700] dark:bg-[#FFD84D]/20 dark:text-[#FFE580]',
];

interface AvatarProps {
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-7 h-7 text-[11px] rounded-full',
  sm: 'w-9 h-9 text-xs rounded-full',
  md: 'w-11 h-11 text-sm rounded-2xl',
  lg: 'w-14 h-14 text-lg rounded-2xl',
};

export const Avatar: React.FC<AvatarProps> = ({ name = '?', size = 'sm', className = '' }) => {
  const clean = name.trim() || '?';
  const parts = clean.split(/\s+/);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : clean.slice(0, 2).toUpperCase();

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = PALETTES[Math.abs(hash) % PALETTES.length];

  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center font-bold shrink-0 select-none ${SIZE_MAP[size]} ${palette} ${className}`}
    >
      {initials}
    </span>
  );
};
