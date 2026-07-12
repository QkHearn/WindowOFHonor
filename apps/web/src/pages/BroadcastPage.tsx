import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { FullscreenShell } from '../components/layout/FullscreenShell';
import { Avatar, GoldDivider, LoadingLine } from '../components/ui/Card';
import type { BroadcastItem } from '../types';

function formatTimelineDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
    time: d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  };
}

function TimelineItem({ item, index, isLast }: { item: BroadcastItem; index: number; isLast: boolean }) {
  const { date, time } = formatTimelineDate(item.issuedAt);

  return (
    <motion.article
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.45 }}
      className="relative pl-10 pb-12 last:pb-0"
    >
      {!isLast && (
        <span className="absolute left-[7px] top-2 bottom-0 w-px bg-gradient-to-b from-champagne/50 via-champagne/20 to-transparent" />
      )}
      <span className="absolute left-0 top-1.5 w-4 h-4 rounded-full border border-champagne/60 bg-ink shadow-[0_0_12px_rgba(201,169,98,0.35)]" />

      <div className="max-w-2xl">
        <p className="text-[10px] tracking-[0.3em] uppercase text-champagne/60 mb-1">
          {date} · {time}
        </p>
        <div className="border border-champagne/15 bg-ivory/[0.03] backdrop-blur-sm p-6 md:p-8">
          <div className="flex flex-wrap justify-center gap-3 mb-5">
            {item.recipients.map((r) => (
              <div key={r.id} className="flex flex-col items-center gap-2">
                <Avatar name={r.displayName} size="md" tone="dark" />
                <span className="text-xs text-graphite/80 tracking-wider">{r.displayName}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] tracking-[0.35em] uppercase text-champagne text-center mb-3">Honor</p>
          <h2 className="font-display text-2xl md:text-3xl text-center text-ivory mb-3">{item.title}</h2>
          {item.description && (
            <p className="text-graphite text-center font-light mb-4 leading-relaxed">{item.description}</p>
          )}
          <GoldDivider className="max-w-xs mx-auto my-4 opacity-60" />
          <p className="text-center text-sm text-champagne/90 tracking-wider">
            由 {item.issuedBy} 发放
          </p>
        </div>
      </div>
    </motion.article>
  );
}

export default function BroadcastPage() {
  const [items, setItems] = useState<BroadcastItem[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    return api
      .getBroadcast()
      .then((data) => {
        setItems(data);
        setError('');
      })
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    const poll = setInterval(load, 30000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setFeaturedIndex((i) => (i + 1) % items.length), 12000);
    return () => clearInterval(t);
  }, [items.length]);

  const featured = items[featuredIndex];

  return (
    <FullscreenShell subtitle="Honor Hall">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-14">
          <p className="text-xs tracking-[0.4em] uppercase text-champagne mb-4">Window of Honor</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold">荣誉殿堂</h1>
          <p className="text-graphite mt-4 font-light tracking-wide">全员荣誉的永恒记录</p>
        </header>

        {loading ? (
          <LoadingLine />
        ) : error ? (
          <p className="text-center text-bronze py-16">{error}</p>
        ) : !items.length ? (
          <p className="text-center text-graphite py-16">暂无荣誉记录，发放赞赏后将展示于此</p>
        ) : (
          <>
            {featured && (
              <section className="mb-16 text-center">
                <p className="text-[10px] tracking-[0.35em] uppercase text-champagne/70 mb-6">最新荣誉</p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={featured.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="flex justify-center gap-4 mb-6">
                      {featured.recipients.map((r) => (
                        <Avatar key={r.id} name={r.displayName} size="lg" tone="dark" />
                      ))}
                    </div>
                    <h2 className="font-display text-3xl md:text-4xl mb-3">{featured.title}</h2>
                    <GoldDivider className="max-w-xs mx-auto my-5 opacity-70" />
                    <p className="text-graphite/90">
                      {featured.recipients.map((r) => r.displayName).join(' · ')}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </section>
            )}

            <section>
              <p className="text-[10px] tracking-[0.35em] uppercase text-champagne/70 text-center mb-10">
                荣誉时间轴
              </p>
              <div className="mx-auto max-w-2xl">
                {items.map((item, i) => (
                  <TimelineItem key={item.id} item={item} index={i} isLast={i === items.length - 1} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </FullscreenShell>
  );
}
