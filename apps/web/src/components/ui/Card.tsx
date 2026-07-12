import type { CSSProperties, ReactNode } from 'react';

export function Card({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`lux-card ${className}`} style={style}>
      {children}
    </div>
  );
}

export function GoldDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`h-px bg-gradient-to-r from-transparent via-champagne/60 to-transparent ${className}`} />
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-10 animate-fade-up">
      <p className="section-label mb-3">Window of Honor</p>
      <h1 className="font-display text-4xl md:text-5xl text-ink font-semibold leading-tight tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-mist mt-3 text-[15px] font-normal">{subtitle}</p>
      )}
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
  const sz = { sm: 'w-10 h-10 text-sm', md: 'w-12 h-12 text-base', lg: 'w-[4.5rem] h-[4.5rem] text-2xl' }[size];
  const palette =
    tone === 'dark'
      ? 'bg-gradient-to-br from-[#2a2418] via-ink to-[#1a1814] text-champagne'
      : 'bg-parchment text-ink';

  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-display font-semibold shrink-0 ring-2 ring-champagne/50 ${palette} shadow-lux`}
      aria-hidden
    >
      {name.slice(0, 1)}
    </div>
  );
}

export function LoadingLine() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-24 h-0.5 bg-champagne/25 relative overflow-hidden rounded-full">
        <div className="absolute inset-0 shimmer-line" />
      </div>
      <p className="section-label opacity-70">加载中</p>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-14 px-6 border border-dashed border-bronze/30 rounded-sm bg-paper">
      <p className="section-label mb-3 opacity-60">暂无内容</p>
      <p className="text-graphite text-[15px]">{message}</p>
    </div>
  );
}
