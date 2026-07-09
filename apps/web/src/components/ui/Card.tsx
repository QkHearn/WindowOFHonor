import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-ivory/80 backdrop-blur-md border border-champagne/20 shadow-[0_24px_80px_rgba(0,0,0,0.08)] rounded-sm p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function GoldDivider({ className = '' }: { className?: string }) {
  return <div className={`h-px bg-gradient-to-r from-transparent via-champagne/50 to-transparent ${className}`} />;
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-10">
      <p className="text-xs tracking-[0.35em] uppercase text-champagne mb-3">Window of Honor</p>
      <h1 className="font-display text-4xl text-ink font-semibold">{title}</h1>
      {subtitle && <p className="text-graphite mt-3 font-light">{subtitle}</p>}
      <GoldDivider className="mt-6" />
    </header>
  );
}

export function Avatar({
  name,
  size = 'md',
  tone = 'dark',
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'dark' | 'light';
}) {
  const sz = { sm: 'w-9 h-9 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-[4.5rem] h-[4.5rem] text-2xl' }[size];
  const palette =
    tone === 'dark'
      ? 'bg-gradient-to-br from-[#3d3528] via-ink to-[#1a1814] text-champagne'
      : 'bg-gradient-to-br from-[#EDE4D3] via-ivory to-[#E8DFD0] text-ink';

  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-display shrink-0 ${palette} shadow-[0_8px_24px_rgba(0,0,0,0.18)]`}
      aria-hidden
    >
      {name.slice(0, 1)}
    </div>
  );
}

export function LoadingLine() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-16 h-px bg-champagne/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-champagne animate-pulse" />
      </div>
    </div>
  );
}
