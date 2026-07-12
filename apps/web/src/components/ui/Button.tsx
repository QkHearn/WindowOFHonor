import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'outline' | 'gold';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** 用于深色背景（顶栏等） */
  onDark?: boolean;
}

const lightStyles: Record<Variant, string> = {
  primary: 'bg-ink text-champagne border border-champagne/50 hover:bg-ink-soft hover:border-champagne hover:shadow-glow',
  ghost: 'bg-transparent text-graphite hover:text-ink border border-transparent hover:bg-parchment/60',
  outline: 'bg-transparent text-bronze border border-bronze/50 hover:bg-champagne/10 hover:border-bronze',
  gold: 'bg-champagne text-ink border border-champagne hover:bg-[#d4b96e] hover:shadow-glow font-semibold',
};

const darkStyles: Record<Variant, string> = {
  primary: 'bg-champagne text-ink border border-champagne hover:bg-[#d4b96e] hover:shadow-glow font-semibold',
  ghost: 'bg-transparent text-ivory/75 hover:text-champagne border border-transparent hover:border-ivory/15',
  outline: 'bg-transparent text-champagne border border-champagne/50 hover:bg-champagne/10 hover:border-champagne',
  gold: 'bg-champagne text-ink border border-champagne hover:bg-[#d4b96e] font-semibold',
};

export function Button({
  variant = 'primary',
  onDark = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const styles = onDark ? darkStyles : lightStyles;
  return (
    <button
      className={`px-6 py-2.5 text-sm font-medium tracking-wide transition-all duration-300 rounded-sm disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
