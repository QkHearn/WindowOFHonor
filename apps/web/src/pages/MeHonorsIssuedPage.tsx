import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { MeBackLink } from '../components/MeBackLink';
import { Card, LoadingLine, PageHeader } from '../components/ui/Card';
import type { IssuedHonorSummary } from '../types';

export default function MeHonorsIssuedPage() {
  const { token } = useAuth();
  const [data, setData] = useState<IssuedHonorSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.myIssuedHonors(token).then(setData).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingLine />;

  return (
    <div>
      <MeBackLink />
      <PageHeader
        title="历史赞赏"
        subtitle={`共发放 ${data?.summary.count ?? 0} 次赞赏`}
      />
      <div className="relative border-l border-champagne/30 ml-4 space-y-6">
        {(data?.records ?? []).map((r) => (
          <div key={r.id} className="relative pl-8">
            <div className="absolute -left-1.5 top-3 w-3 h-3 rounded-full bg-champagne/60" />
            <Card>
              <h3 className="font-display text-xl">{r.title}</h3>
              <p className="text-sm text-graphite mt-1">赠予 {r.recipients}</p>
              <time className="text-xs text-graphite/70">
                {new Date(r.issuedAt).toLocaleString('zh-CN')}
              </time>
            </Card>
          </div>
        ))}
        {!data?.records?.length && <p className="text-graphite pl-8">暂无发放记录</p>}
      </div>
    </div>
  );
}
