import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const styles: Record<Variant, string> = {
  primary: 'bg-ink text-champagne border border-champagne/40 hover:bg-ink/90',
  ghost: 'bg-transparent text-graphite hover:text-ink border border-transparent',
  outline: 'bg-transparent text-champagne border border-champagne/50 hover:border-champagne',
};

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`px-6 py-2.5 text-sm tracking-widest uppercase font-body transition-all duration-300 rounded-sm disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
