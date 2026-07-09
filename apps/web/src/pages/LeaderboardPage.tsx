import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { FullscreenShell } from '../components/layout/FullscreenShell';
import { Avatar, GoldDivider, LoadingLine } from '../components/ui/Card';
import { RankBadge } from '../components/ui/RankBadge';
import type { LeaderboardPersonalEntry, LeaderboardTeamEntry } from '../types';

function PodiumCard({ entry }: { entry: LeaderboardPersonalEntry }) {
  const heights = { 1: 'h-36', 2: 'h-28', 3: 'h-24' }[entry.rank] ?? 'h-24';
  const widths = { 1: 'w-36', 2: 'w-32', 3: 'w-32' }[entry.rank] ?? 'w-32';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: entry.rank * 0.1, duration: 0.5 }}
      className={`flex flex-col items-center ${entry.rank === 1 ? 'order-2 -mt-4' : entry.rank === 2 ? 'order-1' : 'order-3'}`}
    >
      <Avatar name={entry.displayName} size={entry.rank === 1 ? 'lg' : 'md'} tone="dark" />
      <p className="font-display text-base mt-4 text-center max-w-[9rem] leading-snug text-ivory">
        {entry.displayName}
      </p>
      {entry.department && (
        <p className="text-[10px] tracking-[0.2em] uppercase text-graphite/70 mt-1 text-center">
          {entry.department.name}
        </p>
      )}
      <p className="font-display text-2xl text-champagne mt-3 tabular-nums">{entry.honorValue}</p>
      <div
        className={`${widths} ${heights} mt-4 border border-champagne/20 bg-gradient-to-b from-champagne/10 via-ink/40 to-ink flex flex-col items-center justify-end pb-3 gap-2`}
      >
        <RankBadge rank={entry.rank} size="sm" />
      </div>
    </motion.div>
  );
}

function PersonalRow({ entry, isMe }: { entry: LeaderboardPersonalEntry; isMe: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-5 py-4 px-6 border transition-colors ${
        isMe
          ? 'border-champagne/40 bg-champagne/[0.06]'
          : 'border-champagne/10 bg-ivory/[0.03] hover:border-champagne/25'
      }`}
    >
      <RankBadge rank={entry.rank} size="md" />
      <Avatar name={entry.displayName} size="sm" tone="dark" />
      <div className="flex-1 min-w-0">
        <p className="font-display text-base text-ivory">
          {entry.displayName}
          {isMe && <span className="text-xs text-champagne ml-2 tracking-wider">（我）</span>}
        </p>
        {entry.department && (
          <p className="text-xs text-graphite mt-0.5">{entry.department.name}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="font-display text-xl text-champagne tabular-nums">{entry.honorValue}</p>
        <p className="text-[10px] tracking-[0.2em] text-graphite/60 uppercase">Honor</p>
      </div>
    </motion.div>
  );
}

function TeamRow({
  entry,
  delay,
  maxHonor,
}: {
  entry: LeaderboardTeamEntry;
  delay: number;
  maxHonor: number;
}) {
  const width = maxHonor > 0 ? Math.min(100, Math.max(8, (entry.honorTotal / maxHonor) * 100)) : 8;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div className="border border-champagne/15 bg-ivory/[0.03] p-6">
        <div className="flex items-center gap-5">
          <RankBadge rank={entry.rank} size="md" />
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl text-ivory">{entry.teamName}</h3>
            <p className="text-xs text-graphite mt-1 tracking-wider">
              {entry.memberCount} 名成员 · 人均 {entry.avgHonor}
            </p>
            <div className="h-px bg-champagne/15 mt-4 mb-2" />
            <div className="h-1 bg-champagne/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ delay: delay + 0.15, duration: 0.5 }}
                className="h-full bg-gradient-to-r from-champagne/50 to-champagne"
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-display text-3xl text-champagne tabular-nums">{entry.honorTotal}</p>
            <p className="text-[10px] tracking-[0.2em] text-graphite/60 uppercase mt-1">Total</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'personal' | 'team'>('personal');
  const [personal, setPersonal] = useState<LeaderboardPersonalEntry[]>([]);
  const [team, setTeam] = useState<LeaderboardTeamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const req = tab === 'personal' ? api.personalLeaderboard('team', 'all', 20) : api.teamLeaderboard();
    req
      .then((data) => {
        if (tab === 'personal') setPersonal(data as LeaderboardPersonalEntry[]);
        else setTeam(data as LeaderboardTeamEntry[]);
      })
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [tab]);

  const myEntry = useMemo(
    () => (user ? personal.find((e) => e.id === user.id) : undefined),
    [user, personal],
  );

  const maxTeamHonor = useMemo(
    () => (team.length ? Math.max(...team.map((t) => t.honorTotal)) : 1),
    [team],
  );

  const top3 = personal.filter((e) => e.rank <= 3);
  const rest = personal.filter((e) => e.rank > 3);
  const podiumOrder = [2, 1, 3]
    .map((r) => top3.find((e) => e.rank === r))
    .filter(Boolean) as LeaderboardPersonalEntry[];

  return (
    <FullscreenShell subtitle="Leaderboard">
      <div className="max-w-3xl mx-auto pb-28">
        <header className="text-center mb-12">
          <p className="text-xs tracking-[0.4em] uppercase text-champagne mb-4">Window of Honor</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold">激励排行榜</h1>
          <p className="text-graphite mt-4 font-light">个人与团队荣耀名录</p>
        </header>

        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1 border border-champagne/20 bg-ink/60">
            {(['personal', 'team'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`relative px-10 py-2.5 text-sm tracking-[0.25em] transition-colors ${
                  tab === t ? 'text-ivory' : 'text-graphite hover:text-ivory'
                }`}
              >
                {tab === t && (
                  <motion.div
                    layoutId="lb-tab"
                    className="absolute inset-0 bg-champagne/15 border border-champagne/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t === 'personal' ? '个人榜' : '团队榜'}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingLine />
        ) : error ? (
          <p className="text-center text-bronze py-12">{error}</p>
        ) : tab === 'personal' ? (
          <div className="space-y-12">
            {podiumOrder.length > 0 && (
              <section className="text-center">
                <p className="text-xs tracking-[0.4em] uppercase text-champagne mb-10">Hall of Fame</p>
                <div className="flex items-end justify-center gap-6 md:gap-10 px-4">
                  {podiumOrder.map((e) => (
                    <PodiumCard key={e.id} entry={e} />
                  ))}
                </div>
                <GoldDivider className="mt-14 max-w-md mx-auto opacity-60" />
              </section>
            )}

            <section className="space-y-2">
              {rest.map((e) => (
                <PersonalRow key={e.id} entry={e} isMe={e.id === user?.id} />
              ))}
              {!personal.length && (
                <p className="text-center text-graphite py-12">暂无排行数据</p>
              )}
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            {team.map((t, i) => (
              <TeamRow key={t.teamId} entry={t} delay={i * 0.05} maxHonor={maxTeamHonor} />
            ))}
            {!team.length && (
              <p className="text-center text-graphite py-12">暂无团队数据</p>
            )}
          </div>
        )}
      </div>

      {user && tab === 'personal' && !loading && (
        <div className="fixed bottom-0 inset-x-0 z-40 flex justify-center px-4 pb-6 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto w-full max-w-sm"
          >
            <div className="mx-auto text-center border border-champagne/30 bg-ink/95 backdrop-blur-md px-8 py-5 shadow-2xl">
              <Avatar name={user.displayName} size="md" tone="dark" />
              <p className="text-[10px] tracking-[0.3em] uppercase text-champagne/80 mt-4">我的排名</p>
              <p className="font-display text-2xl text-ivory mt-1">
                {myEntry ? `第 ${myEntry.rank} 名` : '未进榜'}
              </p>
              <p className="text-champagne font-display text-lg mt-2 tabular-nums">{user.honorPoints} 积分</p>
            </div>
          </motion.div>
        </div>
      )}
    </FullscreenShell>
  );
}
