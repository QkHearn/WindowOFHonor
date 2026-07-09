import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Avatar, Card, LoadingLine, PageHeader } from '../components/ui/Card';
import type { LeaderboardPersonalEntry, LeaderboardTeamEntry } from '../types';

export default function TeamPage() {
  const { token, user } = useAuth();
  const [team, setTeam] = useState<LeaderboardTeamEntry | null>(null);
  const [members, setMembers] = useState<LeaderboardPersonalEntry[]>([]);
  const [liking, setLiking] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.teamLeaderboard(), api.personalLeaderboard('team', 'all', 50)]).then(([teams, board]) => {
      setTeam(teams[0] ?? null);
      setMembers(board);
    });
  }, []);

  async function handleLike(toUserId: string) {
    if (!token || toUserId === user?.id) return;
    setLiking(toUserId);
    try {
      await api.likeUser(token, { toUserId, targetType: 'user_profile' });
    } catch {
      /* ignore duplicate */
    } finally {
      setLiking(null);
    }
  }

  if (!team && !members.length) return <LoadingLine />;

  return (
    <div>
      <PageHeader title="团队展播" subtitle={team?.teamName ?? '本团队'} />
      {team && (
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Card><p className="text-xs uppercase tracking-widest text-graphite">荣誉总量</p><p className="font-display text-4xl text-champagne mt-2">{team.honorTotal}</p></Card>
          <Card><p className="text-xs uppercase tracking-widest text-graphite">成员数</p><p className="font-display text-4xl text-champagne mt-2">{team.memberCount}</p></Card>
          <Card><p className="text-xs uppercase tracking-widest text-graphite">人均荣誉</p><p className="font-display text-4xl text-champagne mt-2">{team.avgHonor}</p></Card>
        </div>
      )}
      <h2 className="font-display text-2xl mb-6">成员荣誉榜</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((m) => (
          <Card key={m.id}>
            <div className="flex items-center gap-4">
              <Avatar name={m.displayName} />
              <div className="flex-1">
                <p className="font-display text-lg">{m.displayName}</p>
                <p className="text-champagne font-display">{m.honorValue} 积分</p>
              </div>
              {m.id !== user?.id && (
                <button
                  type="button"
                  disabled={liking === m.id}
                  onClick={() => handleLike(m.id)}
                  className="text-graphite hover:text-champagne transition-colors text-xl"
                  title="点赞"
                >
                  ♡
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
