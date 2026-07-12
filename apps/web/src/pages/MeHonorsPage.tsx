import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { MeBackLink } from '../components/MeBackLink';
import { Card, LoadingLine, PageHeader } from '../components/ui/Card';
import type { HonorSummary } from '../types';

export default function MeHonorsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<HonorSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.myHonors(token).then(setData).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingLine />;

  return (
    <div>
      <MeBackLink />
      <PageHeader
        title="我的赞赏"
        subtitle={`共收到 ${data?.summary.incentiveCount ?? 0} 次赞赏`}
      />
      <div className="relative border-l border-champagne/30 ml-4 space-y-6">
        {(data?.records ?? []).map((r) => (
          <div key={r.id} className="relative pl-8">
            <div className="absolute -left-1.5 top-3 w-3 h-3 rounded-full bg-champagne" />
            <Card>
              <h3 className="font-display text-xl">{r.title}</h3>
              <p className="text-sm text-graphite mt-1">{r.issuedBy}</p>
              <time className="text-xs text-graphite/70">{new Date(r.issuedAt).toLocaleString('zh-CN')}</time>
            </Card>
          </div>
        ))}
        {!data?.records?.length && <p className="text-graphite pl-8">暂无记录</p>}
      </div>
    </div>
  );
}
