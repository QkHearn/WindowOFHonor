const labels: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
};

export function RankBadge({ rank, size = 'md' }: { rank: number; size?: 'sm' | 'md' | 'lg' }) {
  const isTop = rank <= 3;
  const sz = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
  }[size];

  if (!isTop) {
    return (
      <span className={`${sz} flex items-center justify-center font-display text-graphite/70 tabular-nums`}>
        {String(rank).padStart(2, '0')}
      </span>
    );
  }

  return (
    <span
      className={`${sz} flex items-center justify-center font-display tracking-widest border border-champagne/60 bg-gradient-to-b from-champagne/20 to-champagne/5 text-champagne shadow-[0_4px_20px_rgba(201,169,98,0.15)]`}
    >
      {labels[rank]}
    </span>
  );
}
