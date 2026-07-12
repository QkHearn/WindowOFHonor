import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { SelectMark } from './ui/SelectMark';
import type { User } from '../types';

interface AppreciationUserPickerProps {
  token: string;
  selected: Map<string, User>;
  onChange: (selected: Map<string, User>) => void;
}

export function AppreciationUserPicker({
  token,
  selected,
  onChange,
}: AppreciationUserPickerProps) {
  const { user: me } = useAuth();
  const [browse, setBrowse] = useState<User[]>([]);
  const [remote, setRemote] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [loadingBrowse, setLoadingBrowse] = useState(true);
  const [loadingRemote, setLoadingRemote] = useState(false);

  useEffect(() => {
    api
      .searchUsers(token, '')
      .then(setBrowse)
      .catch(() => setBrowse([]))
      .finally(() => setLoadingBrowse(false));
  }, [token]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setRemote([]);
      return;
    }
    const timer = setTimeout(() => {
      setLoadingRemote(true);
      api
        .searchUsers(token, q)
        .then(setRemote)
        .catch(() => setRemote([]))
        .finally(() => setLoadingRemote(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [token, query]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? remote : browse;
    const merged = new Map<string, User>();
    for (const u of base) merged.set(u.id, u);
    for (const u of selected.values()) merged.set(u.id, u);
    let list = [...merged.values()];
    if (q && !remote.length && browse.length) {
      list = browse.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => a.displayName.localeCompare(b.displayName, 'zh-CN'));
  }, [browse, remote, query, selected]);

  function toggle(user: User) {
    const next = new Map(selected);
    if (next.has(user.id)) next.delete(user.id);
    else next.set(user.id, user);
    onChange(next);
  }

  function selectAllVisible() {
    const next = new Map(selected);
    visible.forEach((u) => next.set(u.id, u));
    onChange(next);
  }

  function clearAll() {
    onChange(new Map());
  }

  const selectedList = Array.from(selected.values());
  const loading = loadingBrowse || loadingRemote;

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
        label="搜索或浏览"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="输入姓名/用户名搜索，留空可浏览列表多选"
      />

      <div className="flex flex-wrap gap-2 mt-3 mb-4">
        <Button type="button" variant="ghost" onClick={selectAllVisible} disabled={!visible.length}>
          全选当前列表
        </Button>
        <Button type="button" variant="ghost" onClick={clearAll} disabled={!selected.size}>
          清空
        </Button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {loading && <p className="text-sm text-graphite">加载中…</p>}
        {!loading && !visible.length && (
          <p className="text-graphite text-sm">{query ? '未找到匹配用户' : '暂无可选用户'}</p>
        )}
        {visible.map((u) => {
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
              <SelectMark checked={isSelected} />
              <Avatar name={u.displayName} size="sm" tone="light" />
              <span className="flex-1 min-w-0">
                <span className="block font-display truncate">
                  {u.displayName}
                  {u.id === me?.id && (
                    <span className="text-xs text-champagne ml-2 tracking-wider">（我）</span>
                  )}
                </span>
                <span className="block text-xs text-graphite mt-0.5">@{u.username}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
