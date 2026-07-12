import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Avatar } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { SelectMark } from './ui/SelectMark';
import type { User } from '../types';

interface UserSearchPickerProps {
  token: string;
  selected: Map<string, User>;
  onChange: (selected: Map<string, User>) => void;
  multiple?: boolean;
  excludeUserId?: string;
}

export function UserSearchPicker({
  token,
  selected,
  onChange,
  multiple = true,
  excludeUserId,
}: UserSearchPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      api
        .searchUsers(token, q)
        .then((users) => setResults(users.filter((u) => u.id !== excludeUserId)))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [token, query, excludeUserId]);

  function toggle(user: User) {
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

  function clearAll() {
    onChange(new Map());
  }

  const selectedList = Array.from(selected.values());

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl">选择接收人</h2>
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
        label="搜索用户"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="输入姓名或用户名搜索任何人"
      />

      <div className="flex gap-2 mt-3 mb-4">
        <Button type="button" variant="ghost" onClick={clearAll} disabled={!selected.size}>
          清空
        </Button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {loading && <p className="text-sm text-graphite">搜索中…</p>}
        {!loading && query.trim() && !results.length && (
          <p className="text-graphite text-sm">未找到匹配用户</p>
        )}
        {!query.trim() && <p className="text-graphite text-sm">输入关键词开始搜索</p>}
        {results.map((u) => {
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
              {u.honorPoints > 0 && (
                <span className="text-xs text-champagne/80 tracking-wider">{u.honorPoints} 分</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
