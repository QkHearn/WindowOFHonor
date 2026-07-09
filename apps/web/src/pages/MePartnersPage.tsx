import ReactECharts from 'echarts-for-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Avatar, Card, LoadingLine, PageHeader } from '../components/ui/Card';
import type { CoHonorNetwork, PartnerEntry } from '../types';

export default function MePartnersPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<'list' | 'network'>('list');
  const [partners, setPartners] = useState<PartnerEntry[]>([]);
  const [network, setNetwork] = useState<CoHonorNetwork | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([api.myPartners(token), api.coHonorNetwork(token)])
      .then(([p, n]) => {
        setPartners(p);
        setNetwork(n);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const chartOption = network
    ? {
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
              symbolSize: n.isCenter ? 56 : 36 + (n.honorPoints ? Math.min(n.honorPoints / 20, 20) : 0),
              itemStyle: { color: n.isCenter ? '#C9A962' : '#1A1A1A', borderColor: '#C9A962', borderWidth: 1 },
            })),
            links: network.edges.map((e) => ({
              source: e.source,
              target: e.target,
              lineStyle: { width: Math.min(e.weight, 6) },
            })),
          },
        ],
      }
    : {};

  if (loading) return <LoadingLine />;

  return (
    <div>
      <PageHeader title="最佳拍档" subtitle="共获荣誉关系与协作网络" />
      <div className="flex gap-6 mb-8 border-b border-champagne/20">
        {(['list', 'network'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`pb-3 text-sm tracking-wider border-b-2 transition-colors ${tab === t ? 'border-champagne text-champagne' : 'border-transparent text-graphite'}`}
          >
            {t === 'list' ? '拍档列表' : '关系网络'}
          </button>
        ))}
      </div>
      {tab === 'list' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((p, i) => (
            <Card key={p.partner.id} className={i === 0 ? 'ring-1 ring-champagne/50' : ''}>
              <div className="flex items-center gap-4">
                <Avatar name={p.partner.displayName} size="lg" />
                <div>
                  {i === 0 && <span className="text-xs text-champagne tracking-widest uppercase">最佳拍档</span>}
                  <h3 className="font-display text-xl">{p.partner.displayName}</h3>
                  <p className="text-sm text-graphite">共获 {p.coCount} 次</p>
                </div>
              </div>
            </Card>
          ))}
          {!partners.length && <p className="text-graphite">暂无共获荣誉记录</p>}
        </div>
      ) : (
        <div className="bg-ink rounded-sm p-4 h-[480px]">
          {network?.nodes.length ? (
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
          ) : (
            <p className="text-graphite text-center pt-20">暂无关系数据</p>
          )}
        </div>
      )}
    </div>
  );
}
