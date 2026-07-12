import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { MeBackLink } from '../components/MeBackLink';
import { Avatar, Card, LoadingLine, PageHeader } from '../components/ui/Card';
import type { TeamPartnerList } from '../types';

export default function MeTeamPartnersPage() {
  const { token } = useAuth();
  const [data, setData] = useState<TeamPartnerList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.teamPartners(token).then(setData).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingLine />;

  return (
    <div>
      <MeBackLink />
      <PageHeader
        title="团队最佳拍档"
        subtitle={data?.department ? `${data.department.name} 内协作拍档` : '暂无组织'}
      />
      <div className="space-y-4">
        {(data?.pairs ?? []).map((p) => (
          <Card key={`${p.userA.id}-${p.userB.id}`} className={p.rank === 1 ? 'ring-1 ring-champagne/50' : ''}>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-display text-champagne w-8">{p.rank}</span>
              <Avatar name={p.userA.displayName} size="sm" />
              <span className="font-display">{p.userA.displayName}</span>
              <span className="text-graphite text-sm">×</span>
              <Avatar name={p.userB.displayName} size="sm" />
              <span className="font-display">{p.userB.displayName}</span>
              <span className="ml-auto text-champagne font-display">{p.coCount} 次共获</span>
            </div>
          </Card>
        ))}
        {!data?.pairs?.length && <p className="text-graphite">暂无团队拍档数据</p>}
      </div>
    </div>
  );
}
