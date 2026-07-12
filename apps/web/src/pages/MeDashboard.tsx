import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { type MeDimension } from '../components/meRoutes';
import { Card, LoadingLine, PageHeader } from '../components/ui/Card';
import type { MeOverview } from '../types';

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="text-center">
      <p className="text-xs uppercase tracking-widest text-graphite">{label}</p>
      <p className="font-display text-5xl text-champagne mt-2">{value}</p>
    </Card>
  );
}

function EntryLink({
  to,
  title,
  desc,
}: {
  to: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="block border border-champagne/20 p-5 hover:border-champagne/50 hover:bg-champagne/[0.04] transition-colors"
    >
      <p className="font-display text-lg">{title}</p>
      <p className="text-sm text-graphite mt-1">{desc}</p>
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
      className={`px-6 py-3 text-sm tracking-[0.2em] border-b-2 transition-colors ${
        active
          ? 'border-champagne text-ink font-display'
          : 'border-transparent text-graphite hover:text-ink'
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
  const [dim, setDim] = useState<MeDimension>(
    dimParam === 'team' ? 'team' : 'personal',
  );
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

      <div className="flex gap-1 border-b border-champagne/15 mb-8">
        <DimTab active={dim === 'personal'} label="个人" onClick={() => switchDim('personal')} />
        <DimTab active={dim === 'team'} label="团队" onClick={() => switchDim('team')} />
      </div>

      {dim === 'personal' && (
        <>
          <div className={`grid gap-6 mb-10 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            <MetricCard label="获赞赏次数" value={personal?.appreciationCount ?? 0} />
            <MetricCard label="进行中任务令" value={personal?.activeTasks ?? 0} />
            {isAdmin && (
              <MetricCard label="我发放的任务令" value={personal?.issuedTasks ?? 0} />
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
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <MetricCard label="团队获赞赏" value={team.appreciationCount} />
                <MetricCard label="团队进行中任务" value={team.activeTasks} />
                <MetricCard label="团队拍档关系" value={team.partnerPairs} />
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <EntryLink to="/me/team/honors" title="团队赞赏" desc="本团队收到的赞赏" />
                <EntryLink to="/me/team/tasks" title="团队任务令" desc="本团队成员的任务" />
                <EntryLink to="/me/team/partners" title="团队最佳拍档" desc="团队内协作拍档榜" />
              </div>
            </>
          ) : (
            <Card>
              <p className="text-graphite">你尚未加入组织，暂无团队数据</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
