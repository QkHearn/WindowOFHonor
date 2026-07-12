import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { Avatar } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { SelectMark } from './ui/SelectMark';
import type { TeamMember } from '../types';

interface MemberPickerProps {
  token: string;
  selected: Map<string, TeamMember>;
  onChange: (selected: Map<string, TeamMember>) => void;
  multiple?: boolean;
  label?: string;
}

export function MemberPicker({
  token,
  selected,
  onChange,
  multiple = true,
  label = '团队成员',
}: MemberPickerProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listMembers(token)
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q),
    );
  }, [members, query]);

  function toggle(user: TeamMember) {
    const next = new Map(selected);
    if (next.has(user.id)) {
      next.delete(user.id);
    } else if (multiple) {
      next.set(user.id, user);
    } else {
      next.clear();
      next.set(user.id, user);
    }
    onChange(next);
  }

  function selectAllVisible() {
    const next = new Map(selected);
    filtered.forEach((m) => next.set(m.id, m));
    onChange(next);
  }

  function selectAllTeam() {
    const next = new Map(selected);
    members.forEach((m) => next.set(m.id, m));
    onChange(next);
  }

  function clearAll() {
    onChange(new Map());
  }

  const selectedList = Array.from(selected.values());

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl">{label}</h2>
        <span className="text-sm text-graphite tracking-wider">已选 {selected.size} 人</span>
      </div>

      {selectedList.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedList.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => toggle(u)}
              className="text-xs px-3 py-1.5 border border-champagne/40 bg-champagne/5 hover:bg-champagne/10 transition-colors tracking-wider"
            >
              {u.displayName} ×
            </button>
          ))}
        </div>
      )}

      <Input
        label="筛选成员"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="输入姓名或用户名快速过滤"
      />

      <div className="flex flex-wrap gap-2 mt-3 mb-4">
        {multiple && (
          <>
            <Button type="button" variant="ghost" onClick={selectAllVisible} disabled={!filtered.length}>
              全选当前列表
            </Button>
            <Button type="button" variant="ghost" onClick={selectAllTeam} disabled={!members.length}>
              全选团队
            </Button>
          </>
        )}
        <Button type="button" variant="ghost" onClick={clearAll} disabled={!selected.size}>
          清空
        </Button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {loading && <p className="text-sm text-graphite">加载团队成员…</p>}
        {!loading &&
          filtered.map((u) => {
            const isSelected = selected.has(u.id);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => toggle(u)}
                className={`group w-full flex items-center gap-4 p-4 border text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-champagne/60 bg-gradient-to-r from-champagne/[0.08] to-transparent shadow-[inset_3px_0_0_#C9A962]'
                    : 'border-champagne/10 bg-ivory/40 hover:border-champagne/35 hover:bg-ivory/80'
                }`}
              >
                <SelectMark checked={isSelected} multiple={multiple} />
                <Avatar name={u.displayName} size="sm" tone="light" />
                <span className="flex-1 min-w-0">
                  <span className="block font-display truncate">{u.displayName}</span>
                <span className="block text-xs text-graphite mt-0.5">@{u.username}</span>
              </span>
            </button>
            );
          })}
        {!loading && !filtered.length && (
          <p className="text-graphite text-sm">{query ? '未找到匹配成员' : '暂无团队成员'}</p>
        )}
      </div>
    </div>
  );
}
