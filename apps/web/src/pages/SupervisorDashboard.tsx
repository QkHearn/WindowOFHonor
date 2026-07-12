import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, LoadingLine, PageHeader } from '../components/ui/Card';
import type { LeaderboardPersonalEntry } from '../types';

export default function SupervisorDashboard() {
  const { token } = useAuth();
  const [board, setBoard] = useState<LeaderboardPersonalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.personalLeaderboard().then((b) => setBoard(b.slice(0, 5))).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingLine />;

  return (
    <div>
      <PageHeader title="管理员工作台" subtitle="管理组织任务与团队荣誉" />
      <div className="flex flex-wrap gap-4 mb-10">
        <Link to="/supervisor/tasks"><Button>发放任务令</Button></Link>
        <Link to="/appreciation"><Button variant="outline">发放赞赏</Button></Link>
        <Link to="/me/honors"><Button variant="outline">我的赞赏</Button></Link>
        <Link to="/me/tasks"><Button variant="outline">我的任务令</Button></Link>
        <Link to="/leaderboard?tab=partner"><Button variant="outline">最佳拍档</Button></Link>
        <Link to="/leaderboard"><Button variant="ghost">排行榜</Button></Link>
        <Link to="/broadcast"><Button variant="ghost">荣誉殿堂</Button></Link>
      </div>
      <section>
        <h2 className="font-display text-2xl mb-4">成员荣誉 Top 5</h2>
        <div className="space-y-2">
          {board.map((e) => (
            <Card key={e.id} className="!p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-display text-champagne w-8">{e.rank}</span>
                <span>{e.displayName}</span>
              </div>
              <span className="text-champagne font-display">{e.honorValue} 次</span>
            </Card>
          ))}
          {!board.length && <p className="text-graphite">暂无排行数据</p>}
        </div>
      </section>
    </div>
  );
}
