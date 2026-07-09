import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Card, LoadingLine, PageHeader } from '../components/ui/Card';
import type { IncentiveRecord } from '../types';

export default function IssueRecordsPage() {
  const { token } = useAuth();
  const [records, setRecords] = useState<IncentiveRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.listIncentives(token).then(setRecords).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingLine />;

  return (
    <div>
      <PageHeader title="发放记录" subtitle="时间轴式荣誉呈递历史" />
      <div className="relative border-l border-champagne/30 ml-4 space-y-8">
        {records.map((r) => (
          <div key={r.id} className="relative pl-8">
            <div className="absolute -left-1.5 top-2 w-3 h-3 rounded-full bg-champagne border-2 border-ivory" />
            <Card>
              <time className="text-xs text-graphite tracking-wider">
                {new Date(r.issuedAt).toLocaleString('zh-CN')}
              </time>
              <h3 className="font-display text-xl mt-2">{r.title}</h3>
              {r.description && <p className="text-graphite mt-1">{r.description}</p>}
              <p className="text-sm mt-3 text-champagne">
                +{r.honorValue} · {r.recipients?.map((x) => x.user.displayName).join('、')}
              </p>
              {r.issuedBy && <p className="text-xs text-graphite mt-2">发放人：{r.issuedBy.displayName}</p>}
            </Card>
          </div>
        ))}
        {!records.length && <p className="text-graphite pl-8">暂无记录</p>}
      </div>
    </div>
  );
}
