import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, LoadingLine, PageHeader } from '../components/ui/Card';
import type { HonorSummary } from '../types';

export default function MeDashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState<HonorSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.myHonors(token).then(setData).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingLine />;

  const points = data?.summary.honorPoints ?? user?.honorPoints ?? 0;

  return (
    <div>
      <PageHeader title={`你好，${user?.displayName}`} subtitle="你的荣誉与成就" />
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="text-center">
          <p className="text-xs uppercase tracking-widest text-graphite">荣誉积分</p>
          <p className="font-display text-5xl text-champagne mt-2">{points}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs uppercase tracking-widest text-graphite">获激励次数</p>
          <p className="font-display text-5xl text-champagne mt-2">{data?.summary.incentiveCount ?? 0}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs uppercase tracking-widest text-graphite">收到点赞</p>
          <p className="font-display text-5xl text-champagne mt-2">—</p>
        </Card>
      </div>
      <div className="flex flex-wrap gap-4 mb-10">
        <Link to="/me/honors"><Button variant="outline">我的荣誉</Button></Link>
        <Link to="/me/partners"><Button variant="outline">最佳拍档</Button></Link>
        <Link to="/me/tasks"><Button variant="outline">我的任务令</Button></Link>
        <Link to="/leaderboard"><Button variant="ghost">排行榜</Button></Link>
      </div>
      <section>
        <h2 className="font-display text-2xl mb-4">近期荣誉</h2>
        <div className="space-y-4">
          {(data?.records ?? []).slice(0, 5).map((r) => (
            <Card key={r.id} className="!p-4 flex justify-between items-center">
              <div>
                <p className="font-display text-lg">{r.title}</p>
                <p className="text-sm text-graphite">{r.issuedBy} · {new Date(r.issuedAt).toLocaleDateString('zh-CN')}</p>
              </div>
              <span className="text-champagne font-display text-xl">+{r.honorValue}</span>
            </Card>
          ))}
          {!data?.records?.length && <p className="text-graphite">暂无荣誉记录</p>}
        </div>
      </section>
    </div>
  );
}
