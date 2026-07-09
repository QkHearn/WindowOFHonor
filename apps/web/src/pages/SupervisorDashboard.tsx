import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, LoadingLine, PageHeader } from '../components/ui/Card';
import type { IncentiveRecord, LeaderboardPersonalEntry } from '../types';

export default function SupervisorDashboard() {
  const { token } = useAuth();
  const [records, setRecords] = useState<IncentiveRecord[]>([]);
  const [board, setBoard] = useState<LeaderboardPersonalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([api.listIncentives(token), api.personalLeaderboard()])
      .then(([r, b]) => {
        setRecords(r.slice(0, 5));
        setBoard(b.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingLine />;

  const teamTotal = board.reduce((s, e) => s + e.honorValue, 0);

  return (
    <div>
      <PageHeader title="主管工作台" subtitle="团队荣誉一览，呈递激励从这里开始" />
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <Card><p className="text-xs uppercase tracking-widest text-graphite">团队荣誉总量</p><p className="font-display text-4xl text-champagne mt-2">{teamTotal}</p></Card>
        <Card><p className="text-xs uppercase tracking-widest text-graphite">近期发放</p><p className="font-display text-4xl text-champagne mt-2">{records.length}</p></Card>
        <Card><p className="text-xs uppercase tracking-widest text-graphite">活跃成员</p><p className="font-display text-4xl text-champagne mt-2">{board.length}</p></Card>
      </div>
      <div className="flex gap-4 mb-10">
        <Link to="/supervisor/issue"><Button>呈递荣誉</Button></Link>
        <Link to="/supervisor/records"><Button variant="outline">发放记录</Button></Link>
        <Link to="/supervisor/tasks"><Button variant="outline">任务令管理</Button></Link>
        <Link to="/supervisor/teams"><Button variant="outline">团队管理</Button></Link>
        <Link to="/leaderboard"><Button variant="ghost">查看排行榜</Button></Link>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <h2 className="font-display text-2xl mb-4">近期团队动态</h2>
          <div className="space-y-4">
            {records.map((r) => (
              <Card key={r.id} className="!p-4">
                <p className="font-display text-lg">{r.title}</p>
                <p className="text-sm text-graphite mt-1">
                  {r.recipients?.map((x) => x.user.displayName).join('、')} · +{r.honorValue}
                </p>
              </Card>
            ))}
            {!records.length && <p className="text-graphite">暂无发放记录</p>}
          </div>
        </section>
        <section>
          <h2 className="font-display text-2xl mb-4">成员荣誉 Top 5</h2>
          <div className="space-y-2">
            {board.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3 border-b border-champagne/10">
                <span className="font-display text-champagne w-8">{e.rank}</span>
                <span className="flex-1">{e.displayName}</span>
                <span className="text-champagne font-display">{e.honorValue}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
