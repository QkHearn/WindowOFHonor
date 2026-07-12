import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { MeBackLink } from '../components/MeBackLink';
import { Card, LoadingLine, PageHeader } from '../components/ui/Card';
import type { TeamHonorSummary } from '../types';

export default function MeTeamHonorsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<TeamHonorSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.teamHonors(token).then(setData).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingLine />;

  return (
    <div>
      <MeBackLink />
      <PageHeader
        title="团队赞赏"
        subtitle={
          data?.department
            ? `${data.department.name} · 共 ${data.summary.count} 次`
            : '暂无组织'
        }
      />
      <div className="space-y-4">
        {(data?.records ?? []).map((r) => (
          <Card key={r.id}>
            <h3 className="font-display text-xl">{r.title}</h3>
            <p className="text-sm text-graphite mt-1">
              {r.issuedBy} → {r.recipients}
            </p>
            <time className="text-xs text-graphite/70">
              {new Date(r.issuedAt).toLocaleString('zh-CN')}
            </time>
          </Card>
        ))}
        {!data?.records?.length && <p className="text-graphite">暂无团队赞赏记录</p>}
      </div>
    </div>
  );
}
