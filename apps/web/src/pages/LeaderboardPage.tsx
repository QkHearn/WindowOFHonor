import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { FullscreenShell } from '../components/layout/FullscreenShell';
import { Avatar, GoldDivider, LoadingLine } from '../components/ui/Card';
import { RankBadge } from '../components/ui/RankBadge';
import type {
  CoHonorNetwork,
  LeaderboardPersonalEntry,
  LeaderboardTeamEntry,
  PartnerEntry,
  PartnerLeaderboardEntry,
} from '../types';

type MainTab = 'personal' | 'partner' | 'team';
type PartnerView = 'rank' | 'mine' | 'network';

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
      <p className="font-display text-2xl text-champagne mt-3 tabular-nums">{entry.honorValue} 次</p>
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
        <p className="font-display text-xl text-champagne tabular-nums">{entry.honorValue} 次</p>
        <p className="text-[10px] tracking-[0.2em] text-graphite/60 uppercase">赞赏</p>
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
              {entry.memberCount} 名成员 · 人均 {entry.avgHonor} 次
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
            <p className="font-display text-3xl text-champagne tabular-nums">{entry.honorTotal} 次</p>
            <p className="text-[10px] tracking-[0.2em] text-graphite/60 uppercase mt-1">赞赏</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PartnerRankRow({ entry, delay }: { entry: PartnerLeaderboardEntry; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex items-center gap-5 py-4 px-6 border border-champagne/10 bg-ivory/[0.03] hover:border-champagne/25"
    >
      <RankBadge rank={entry.rank} size="md" />
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar name={entry.userA.displayName} size="sm" tone="dark" />
        <span className="text-champagne/60 text-sm">×</span>
        <Avatar name={entry.userB.displayName} size="sm" tone="dark" />
        <div className="min-w-0">
          <p className="font-display text-base text-ivory truncate">
            {entry.userA.displayName} · {entry.userB.displayName}
          </p>
          <p className="text-xs text-graphite mt-0.5">共获 {entry.coCount} 次荣誉</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-display text-xl text-champagne tabular-nums">{entry.coCount} 次</p>
        <p className="text-[10px] tracking-[0.2em] text-graphite/60 uppercase">共获</p>
      </div>
    </motion.div>
  );
}

function MyPartnerCard({ entry, highlight }: { entry: PartnerEntry; highlight?: boolean }) {
  return (
    <div
      className={`border border-champagne/15 bg-ivory/[0.03] p-5 ${
        highlight ? 'ring-1 ring-champagne/40' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <Avatar name={entry.partner.displayName} size="lg" tone="dark" />
        <div>
          {highlight && (
            <span className="text-xs text-champagne tracking-widest uppercase">最佳拍档</span>
          )}
          <h3 className="font-display text-xl text-ivory">{entry.partner.displayName}</h3>
          <p className="text-sm text-graphite mt-1">共获 {entry.coCount} 次赞赏</p>
        </div>
      </div>
    </div>
  );
}

function PartnerNetworkChart({ network }: { network: CoHonorNetwork }) {
  const option = {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        label: { show: true, color: '#C9A962', fontFamily: 'serif' },
        lineStyle: { color: '#C9A962', curveness: 0.2, width: 2 },
        force: { repulsion: 200, edgeLength: 120 },
        data: network.nodes.map((n) => ({
          id: n.id,
          name: n.label,
          symbolSize: n.isCenter ? 56 : 36 + (n.isCenter ? 0 : 12),
          itemStyle: { color: n.isCenter ? '#C9A962' : '#1A1A1A', borderColor: '#C9A962', borderWidth: 1 },
        })),
        links: network.edges.map((e) => ({
          source: e.source,
          target: e.target,
          lineStyle: { width: Math.min(e.weight, 6) },
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

const TAB_LABELS: Record<MainTab, string> = {
  personal: '个人',
  partner: '拍档',
  team: '团队',
};

const PARTNER_VIEW_LABELS: Record<PartnerView, string> = {
  rank: '拍档榜',
  mine: '我的拍档',
  network: '关系网络',
};

function parseTab(value: string | null): MainTab {
  if (value === 'partner' || value === 'team') return value;
  return 'personal';
}

export default function LeaderboardPage() {
  const { user, token, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<MainTab>(() => parseTab(searchParams.get('tab')));
  const [partnerView, setPartnerView] = useState<PartnerView>('rank');
  const [personal, setPersonal] = useState<LeaderboardPersonalEntry[]>([]);
  const [team, setTeam] = useState<LeaderboardTeamEntry[]>([]);
  const [partners, setPartners] = useState<PartnerLeaderboardEntry[]>([]);
  const [myPartners, setMyPartners] = useState<PartnerEntry[]>([]);
  const [network, setNetwork] = useState<CoHonorNetwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setTab(parseTab(searchParams.get('tab')));
    if (searchParams.get('tab') === 'partner' && isAuthenticated) {
      setPartnerView('mine');
    }
  }, [searchParams, isAuthenticated]);

  function selectTab(next: MainTab) {
    setTab(next);
    setSearchParams(next === 'personal' ? {} : { tab: next }, { replace: true });
  }

  useEffect(() => {
    setLoading(true);
    setError('');

    if (tab === 'personal') {
      api.personalLeaderboard('team', 'all', 20)
        .then(setPersonal)
        .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
        .finally(() => setLoading(false));
      return;
    }

    if (tab === 'team') {
      api.teamLeaderboard()
        .then(setTeam)
        .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
        .finally(() => setLoading(false));
      return;
    }

    const reqs: Promise<void>[] = [
      api.partnerLeaderboard(20).then(setPartners),
    ];
    if (token) {
      reqs.push(
        api.myPartners(token).then(setMyPartners),
        api.coHonorNetwork(token).then(setNetwork),
      );
    } else {
      setMyPartners([]);
      setNetwork(null);
    }

    Promise.all(reqs)
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [tab, token]);

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
          <h1 className="font-display text-4xl md:text-5xl font-semibold">排行榜</h1>
          <p className="text-graphite mt-4 font-light">个人、拍档与团队荣耀名录</p>
        </header>

        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1 border border-champagne/20 bg-ink/60">
            {(['personal', 'partner', 'team'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => selectTab(t)}
                className={`relative px-8 py-2.5 text-sm tracking-[0.25em] transition-colors ${
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
                <span className="relative z-10">{TAB_LABELS[t]}</span>
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
        ) : tab === 'team' ? (
          <div className="space-y-4">
            {team.map((t, i) => (
              <TeamRow key={t.teamId} entry={t} delay={i * 0.05} maxHonor={maxTeamHonor} />
            ))}
            {!team.length && (
              <p className="text-center text-graphite py-12">暂无团队数据</p>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {isAuthenticated && (
              <div className="flex justify-center gap-2">
                {(['rank', 'mine', 'network'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPartnerView(v)}
                    className={`px-5 py-2 text-xs tracking-[0.2em] border transition-colors ${
                      partnerView === v
                        ? 'border-champagne/50 text-ivory bg-champagne/10'
                        : 'border-champagne/15 text-graphite hover:text-ivory'
                    }`}
                  >
                    {PARTNER_VIEW_LABELS[v]}
                  </button>
                ))}
              </div>
            )}

            {(!isAuthenticated || partnerView === 'rank') && (
              <section className="space-y-2">
                {partners.map((p, i) => (
                  <PartnerRankRow key={`${p.userA.id}-${p.userB.id}`} entry={p} delay={i * 0.05} />
                ))}
                {!partners.length && (
                  <p className="text-center text-graphite py-12">暂无拍档数据</p>
                )}
              </section>
            )}

            {isAuthenticated && partnerView === 'mine' && (
              <section className="grid md:grid-cols-2 gap-4">
                {myPartners.map((p, i) => (
                  <MyPartnerCard key={p.partner.id} entry={p} highlight={i === 0} />
                ))}
                {!myPartners.length && (
                  <p className="text-center text-graphite py-12 md:col-span-2">暂无共获荣誉的拍档</p>
                )}
              </section>
            )}

            {isAuthenticated && partnerView === 'network' && (
              <section className="border border-champagne/15 bg-ink/40 p-4 h-[480px]">
                {network?.nodes.length ? (
                  <PartnerNetworkChart network={network} />
                ) : (
                  <p className="text-graphite text-center pt-20">暂无关系网络数据</p>
                )}
              </section>
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
              <p className="text-champagne font-display text-lg mt-2 tabular-nums">
                {myEntry ? `${myEntry.honorValue} 次赞赏` : '暂无赞赏'}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </FullscreenShell>
  );
}
