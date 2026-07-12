import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { type MeDimension } from '../components/meRoutes';
import { Card, LoadingLine, PageHeader } from '../components/ui/Card';
import type { MeOverview } from '../types';

function MetricCard({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  return (
    <Card className="text-center lux-card-hover animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <p className="text-sm font-medium text-mist">{label}</p>
      <p className="metric-value text-5xl md:text-6xl mt-4">{value}</p>
    </Card>
  );
}

function EntryLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="entry-tile group">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-xl font-semibold text-ink group-hover:text-bronze transition-colors">
            {title}
          </p>
          <p className="text-sm text-mist mt-2 leading-relaxed">{desc}</p>
        </div>
        <span className="text-champagne text-xl shrink-0 mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity" aria-hidden>
          →
        </span>
      </div>
    </Link>
  );
}

function DimTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-6 py-3 text-[15px] font-medium border-b-2 transition-all duration-300 ${
        active
          ? 'border-champagne text-ink font-display text-lg'
          : 'border-transparent text-mist hover:text-graphite hover:border-parchment'
      }`}
    >
      {label}
    </button>
  );
}

export default function MeDashboard() {
  const { token, user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const dimParam = searchParams.get('dim');
  const [dim, setDim] = useState<MeDimension>(dimParam === 'team' ? 'team' : 'personal');
  const [overview, setOverview] = useState<MeOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dimParam === 'team' || dimParam === 'personal') {
      setDim(dimParam);
    }
  }, [dimParam]);

  function switchDim(next: MeDimension) {
    setDim(next);
    setSearchParams({ dim: next }, { replace: true });
  }

  useEffect(() => {
    if (!token) return;
    api.myOverview(token).then(setOverview).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingLine />;

  const personal = overview?.personal;
  const team = overview?.team;

  return (
    <div>
      <PageHeader
        title={`你好，${user?.displayName}`}
        subtitle={team ? `${team.department.name} · ${team.memberCount} 人` : '个人中心'}
      />

      <div className="flex gap-1 border-b border-bronze/15 mb-10">
        <DimTab active={dim === 'personal'} label="个人" onClick={() => switchDim('personal')} />
        <DimTab active={dim === 'team'} label="团队" onClick={() => switchDim('team')} />
      </div>

      {dim === 'personal' && (
        <>
          <div className={`grid gap-5 mb-12 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            <MetricCard label="获赞赏次数" value={personal?.appreciationCount ?? 0} delay={0} />
            <MetricCard label="进行中任务令" value={personal?.activeTasks ?? 0} delay={80} />
            {isAdmin && (
              <MetricCard label="我发放的任务令" value={personal?.issuedTasks ?? 0} delay={160} />
            )}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <EntryLink to="/me/honors" title="我的赞赏" desc="收到的赞赏记录" />
            <EntryLink to="/me/tasks" title="我的任务令" desc="进行中的任务与挑战" />
            <EntryLink to="/me/partners" title="最佳拍档" desc="共获赞赏的协作关系" />
            <EntryLink to="/me/honors/issued" title="历史赞赏" desc={`已发放 ${personal?.issuedAppreciationCount ?? 0} 次`} />
            {isAdmin && (
              <EntryLink
                to="/me/tasks/issued"
                title="已发放任务令"
                desc={`共发放 ${personal?.issuedTasks ?? 0} 条`}
              />
            )}
          </div>
        </>
      )}

      {dim === 'team' && (
        <>
          {team ? (
            <>
              <div className="grid md:grid-cols-3 gap-5 mb-12">
                <MetricCard label="团队获赞赏" value={team.appreciationCount} delay={0} />
                <MetricCard label="团队进行中任务" value={team.activeTasks} delay={80} />
                <MetricCard label="团队拍档关系" value={team.partnerPairs} delay={160} />
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <EntryLink to="/me/team/honors" title="团队赞赏" desc="本团队收到的赞赏" />
                <EntryLink to="/me/team/tasks" title="团队任务令" desc="本团队成员的任务" />
                <EntryLink to="/me/team/partners" title="团队最佳拍档" desc="团队内协作拍档榜" />
              </div>
            </>
          ) : (
            <Card className="text-center py-12">
              <p className="text-graphite font-light">你尚未加入组织，暂无团队数据</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
