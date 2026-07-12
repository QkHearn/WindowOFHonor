import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, GoldDivider, LoadingLine, PageHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { SelectMark } from '../components/ui/SelectMark';
import type { AdminUser, Department } from '../types';

type Tab = 'orgs' | 'people' | 'admins';

const roleLabel: Record<string, string> = {
  super_admin: '系统管理员',
  supervisor: '管理员',
  employee: '员工',
};

function DeptTagPicker({
  departments,
  selected,
  onChange,
  excludeId,
}: {
  departments: Department[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  excludeId?: string;
}) {
  const list = excludeId ? departments.filter((d) => d.id !== excludeId) : departments;

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((d) => {
        const active = selected.has(d.id);
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => toggle(d.id)}
            className={`text-xs px-3 py-1.5 border transition-colors tracking-wider ${
              active
                ? 'border-champagne bg-champagne/10 text-ink'
                : 'border-champagne/25 text-graphite hover:border-champagne/50'
            }`}
          >
            {d.name}
          </button>
        );
      })}
      {!list.length && <p className="text-sm text-graphite">暂无可用组织</p>}
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-6 py-3 text-sm tracking-[0.2em] border-b-2 transition-colors ${
        active
          ? 'border-champagne text-ink font-display'
          : 'border-transparent text-graphite hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

export default function SystemAdminPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>('orgs');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState('');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [userQuery, setUserQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'employee' | 'supervisor'>('all');
  const [transferSelected, setTransferSelected] = useState<Set<string>>(new Set());
  const [transferTargetDept, setTransferTargetDept] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [deleteTransferTo, setDeleteTransferTo] = useState('');

  const [demoteTarget, setDemoteTarget] = useState<AdminUser | null>(null);
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);

  const [promoteTarget, setPromoteTarget] = useState<AdminUser | null>(null);
  const [promoteDeptIds, setPromoteDeptIds] = useState<Set<string>>(new Set());

  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editDeptIds, setEditDeptIds] = useState<Set<string>>(new Set());

  function reload() {
    if (!token) return;
    setLoading(true);
    Promise.all([api.listAdminUsers(token), api.listDepartments()])
      .then(([u, d]) => {
        setUsers(u);
        setDepartments(d);
        setTransferSelected(new Set());
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, [token]);

  const transferableUsers = useMemo(
    () => users.filter((u) => u.role !== 'super_admin'),
    [users],
  );

  const filteredPeople = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    return transferableUsers.filter((u) => {
      if (deptFilter && u.department?.id !== deptFilter) return false;
      if (!q) return true;
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.department?.name.toLowerCase().includes(q)
      );
    });
  }, [transferableUsers, userQuery, deptFilter]);

  const filteredAdmins = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    return users
      .filter((u) => u.role === 'employee' || u.role === 'supervisor')
      .filter((u) => {
        if (roleFilter === 'employee' && u.role !== 'employee') return false;
        if (roleFilter === 'supervisor' && u.role !== 'supervisor') return false;
        if (!q) return true;
        return (
          u.displayName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.department?.name.toLowerCase().includes(q) ||
          u.managedDepartments.some((d) => d.name.toLowerCase().includes(q))
        );
      });
  }, [users, userQuery, roleFilter]);

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !orgName.trim()) return;
    setBusy('create-org');
    setError('');
    setMessage('');
    try {
      const dept = await api.createDepartment(token, orgName.trim());
      setOrgName('');
      setMessage(`组织「${dept.name}」已创建`);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setBusy('');
    }
  }

  async function confirmDeleteOrg() {
    if (!token || !deleteTarget) return;
    const memberCount = deleteTarget.memberCount ?? 0;
    if (memberCount > 0 && !deleteTransferTo) {
      setError('请选择成员转移的目标组织');
      return;
    }
    setBusy('delete-org');
    setError('');
    try {
      const res = await api.deleteDepartment(
        token,
        deleteTarget.id,
        memberCount > 0 ? deleteTransferTo : undefined,
      );
      const targetName = departments.find((d) => d.id === deleteTransferTo)?.name;
      setMessage(
        res.transferredCount
          ? `已删除「${deleteTarget.name}」，${res.transferredCount} 人已转移至「${targetName}」`
          : `组织「${deleteTarget.name}」已删除`,
      );
      setDeleteTarget(null);
      setDeleteTransferTo('');
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setBusy('');
    }
  }

  async function executeTransfer() {
    if (!token || !transferSelected.size || !transferTargetDept) return;
    setBusy('transfer');
    setError('');
    setTransferConfirmOpen(false);
    try {
      const target = departments.find((d) => d.id === transferTargetDept);
      await api.transferUsersDepartment(token, Array.from(transferSelected), transferTargetDept);
      setMessage(`已将 ${transferSelected.size} 人转移至「${target?.name}」`);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '转移失败');
    } finally {
      setBusy('');
    }
  }

  async function confirmPromote() {
    if (!token || !promoteTarget) return;
    const ids = Array.from(promoteDeptIds);
    if (!ids.length) {
      setError('请至少选择一个管理组织');
      return;
    }
    setBusy('promote');
    setError('');
    try {
      await api.promoteToAdmin(token, promoteTarget.id, ids);
      setMessage(`已将「${promoteTarget.displayName}」设为管理员`);
      setPromoteTarget(null);
      setPromoteDeptIds(new Set());
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setBusy('');
    }
  }

  async function confirmEditAdmin() {
    if (!token || !editTarget) return;
    const ids = Array.from(editDeptIds);
    if (!ids.length) {
      setError('请至少选择一个管理组织');
      return;
    }
    setBusy('edit-admin');
    setError('');
    try {
      await api.updateAdminDepartments(token, editTarget.id, ids);
      setMessage(`已更新「${editTarget.displayName}」的管理组织`);
      setEditTarget(null);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setBusy('');
    }
  }

  async function confirmDemote() {
    if (!token || !demoteTarget) return;
    setBusy('demote');
    setError('');
    try {
      await api.demoteFromAdmin(token, demoteTarget.id);
      setMessage(`已取消「${demoteTarget.displayName}」的管理员身份`);
      setDemoteTarget(null);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setBusy('');
    }
  }

  function toggleTransferUser(userId: string) {
    setTransferSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function openPromote(user: AdminUser) {
    setPromoteTarget(user);
    setPromoteDeptIds(new Set());
    setError('');
  }

  function openEditAdmin(user: AdminUser) {
    setEditTarget(user);
    setEditDeptIds(new Set(user.managedDepartments.map((d) => d.id)));
    setError('');
  }

  if (loading) return <LoadingLine />;

  const deleteMemberCount = deleteTarget?.memberCount ?? 0;
  const deleteTransferOptions = deleteTarget
    ? departments.filter((d) => d.id !== deleteTarget.id)
    : [];

  return (
    <div>
      <PageHeader title="系统管理" subtitle="组织、人员与管理员分层管理" />

      {message && (
        <div className="mb-6 px-4 py-3 border border-champagne/30 bg-champagne/5 text-champagne text-sm">
          {message}
        </div>
      )}
      {error && !deleteTarget && !demoteTarget && !promoteTarget && !editTarget && (
        <div className="mb-6 px-4 py-3 border border-bronze/40 bg-bronze/5 text-bronze text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-1 border-b border-champagne/15 mb-8">
        <TabButton active={tab === 'orgs'} label="组织" onClick={() => setTab('orgs')} />
        <TabButton active={tab === 'people'} label="人员" onClick={() => setTab('people')} />
        <TabButton active={tab === 'admins'} label="管理员" onClick={() => setTab('admins')} />
      </div>

      {tab === 'orgs' && (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-8">
          <Card>
            <h2 className="font-display text-xl mb-2">新增组织</h2>
            <p className="text-sm text-graphite mb-6">创建后可供员工注册或转移时选择</p>
            <form onSubmit={handleCreateOrg} className="space-y-6">
              <Input
                label="组织名称"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="例如：研发一部"
                required
              />
              <Button type="submit" disabled={busy === 'create-org' || !orgName.trim()}>
                {busy === 'create-org' ? '创建中…' : '新增组织'}
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="font-display text-xl mb-2">组织列表</h2>
            <p className="text-sm text-graphite mb-6">共 {departments.length} 个组织</p>
            <div className="divide-y divide-champagne/10">
              {departments.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-4 gap-4">
                  <div>
                    <p className="font-display text-lg">{d.name}</p>
                    <p className="text-xs text-graphite mt-1">{d.memberCount ?? 0} 名成员</p>
                  </div>
                  <Button variant="ghost" onClick={() => { setDeleteTarget(d); setDeleteTransferTo(''); setError(''); }}>
                    删除
                  </Button>
                </div>
              ))}
              {!departments.length && <p className="text-graphite text-sm py-4">暂无组织</p>}
            </div>
          </Card>
        </div>
      )}

      {tab === 'people' && (
        <Card>
          <h2 className="font-display text-xl mb-2">人员转移</h2>
          <p className="text-sm text-graphite mb-6">多选人员并批量变更所属组织</p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Input
              label="搜索"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="姓名、用户名或组织"
            />
            <label className="block">
              <span className="text-xs tracking-[0.2em] uppercase text-graphite mb-2 block">筛选组织</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full bg-transparent border-b border-graphite/30 pb-2 focus:outline-none focus:border-champagne"
              >
                <option value="">全部组织</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTransferSelected(new Set(filteredPeople.map((u) => u.id)))}
              disabled={!filteredPeople.length}
            >
              全选当前列表
            </Button>
            <Button type="button" variant="ghost" onClick={() => setTransferSelected(new Set())} disabled={!transferSelected.size}>
              清空
            </Button>
            <span className="text-sm text-graphite ml-auto tracking-wider">已选 {transferSelected.size} 人</span>
          </div>

          <div className="max-h-96 overflow-y-auto border border-champagne/15 mb-6">
            {filteredPeople.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleTransferUser(u.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 border-b border-champagne/10 last:border-0 text-left ${
                  transferSelected.has(u.id) ? 'bg-champagne/[0.06]' : 'hover:bg-ivory/60'
                }`}
              >
                <SelectMark checked={transferSelected.has(u.id)} />
                <div className="flex-1 min-w-0">
                  <p className="font-display truncate">{u.displayName}</p>
                  <p className="text-xs text-graphite mt-0.5">
                    @{u.username} · {u.department?.name ?? '未分配'}
                  </p>
                </div>
              </button>
            ))}
            {!filteredPeople.length && <p className="text-graphite text-sm p-4">没有匹配的人员</p>}
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <label className="block flex-1 min-w-[200px]">
              <span className="text-xs tracking-[0.2em] uppercase text-graphite mb-2 block">目标组织</span>
              <select
                value={transferTargetDept}
                onChange={(e) => setTransferTargetDept(e.target.value)}
                className="w-full bg-transparent border-b border-graphite/30 pb-2 focus:outline-none focus:border-champagne"
              >
                <option value="">请选择</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>
            <Button
              disabled={!transferSelected.size || !transferTargetDept}
              onClick={() => setTransferConfirmOpen(true)}
            >
              转移（{transferSelected.size}）
            </Button>
          </div>
        </Card>
      )}

      {tab === 'admins' && (
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-xl">管理员设置</h2>
              <p className="text-sm text-graphite mt-1">为员工添加管理组织标签，或调整现有管理员</p>
            </div>
            <div className="flex gap-2">
              {(['all', 'employee', 'supervisor'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`text-xs px-3 py-1.5 border tracking-wider ${
                    roleFilter === r
                      ? 'border-champagne bg-champagne/10 text-ink'
                      : 'border-champagne/20 text-graphite'
                  }`}
                >
                  {r === 'all' ? '全部' : r === 'employee' ? '员工' : '管理员'}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="搜索"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="姓名、用户名、组织或管理标签"
            className="mb-6"
          />

          <div className="overflow-x-auto border border-champagne/15">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-champagne/15 bg-ivory/60 text-left">
                  <th className="px-4 py-3 font-display tracking-wider">姓名</th>
                  <th className="px-4 py-3 font-display tracking-wider">角色</th>
                  <th className="px-4 py-3 font-display tracking-wider">所属组织</th>
                  <th className="px-4 py-3 font-display tracking-wider">管理组织</th>
                  <th className="px-4 py-3 font-display tracking-wider text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((u) => (
                  <tr key={u.id} className="border-b border-champagne/10 last:border-0 hover:bg-ivory/40">
                    <td className="px-4 py-3">
                      <p className="font-display">{u.displayName}</p>
                      <p className="text-xs text-graphite">@{u.username}</p>
                    </td>
                    <td className="px-4 py-3 text-graphite">{roleLabel[u.role]}</td>
                    <td className="px-4 py-3 text-graphite">{u.department?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.managedDepartments.length
                          ? u.managedDepartments.map((d) => (
                              <span
                                key={d.id}
                                className="text-xs px-2 py-0.5 border border-champagne/30 text-champagne/90"
                              >
                                {d.name}
                              </span>
                            ))
                          : <span className="text-graphite">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {u.role === 'employee' ? (
                        <Button variant="outline" className="!px-4 !py-1.5 !text-xs" onClick={() => openPromote(u)}>
                          设为管理员
                        </Button>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" className="!px-4 !py-1.5 !text-xs" onClick={() => openEditAdmin(u)}>
                            编辑
                          </Button>
                          <Button variant="ghost" className="!px-4 !py-1.5 !text-xs" onClick={() => setDemoteTarget(u)}>
                            取消
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredAdmins.length && (
              <p className="text-graphite text-sm p-6 text-center">没有匹配的人员</p>
            )}
          </div>
        </Card>
      )}

      <Modal
        open={!!deleteTarget}
        title="删除组织"
        description={
          deleteTarget
            ? deleteMemberCount > 0
              ? `「${deleteTarget.name}」下有 ${deleteMemberCount} 名成员，删除前需将全部成员转移至其他组织。`
              : `确定删除组织「${deleteTarget.name}」？此操作不可撤销。`
            : undefined
        }
        confirmLabel="确认删除"
        loading={busy === 'delete-org'}
        confirmDisabled={deleteMemberCount > 0 && !deleteTransferTo}
        onClose={() => { setDeleteTarget(null); setDeleteTransferTo(''); setError(''); }}
        onConfirm={confirmDeleteOrg}
      >
        {deleteMemberCount > 0 && (
          <label className="block">
            <span className="text-xs tracking-[0.2em] uppercase text-graphite mb-2 block">转移至</span>
            <select
              value={deleteTransferTo}
              onChange={(e) => setDeleteTransferTo(e.target.value)}
              className="w-full bg-transparent border-b border-graphite/30 pb-2 focus:outline-none focus:border-champagne"
            >
              <option value="">请选择目标组织</option>
              {deleteTransferOptions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
        )}
        {error && deleteTarget && <p className="text-bronze text-sm mt-4">{error}</p>}
      </Modal>

      <Modal
        open={transferConfirmOpen}
        title="确认转移"
        description={
          transferTargetDept
            ? `将 ${transferSelected.size} 人转移至「${departments.find((d) => d.id === transferTargetDept)?.name}」？`
            : undefined
        }
        confirmLabel="确认转移"
        loading={busy === 'transfer'}
        onClose={() => setTransferConfirmOpen(false)}
        onConfirm={executeTransfer}
      />

      <Modal
        open={!!promoteTarget}
        title="设为管理员"
        description={promoteTarget ? `为「${promoteTarget.displayName}」选择可管理的组织（可多选）` : undefined}
        confirmLabel="确认设置"
        loading={busy === 'promote'}
        confirmDisabled={!promoteDeptIds.size}
        onClose={() => { setPromoteTarget(null); setPromoteDeptIds(new Set()); }}
        onConfirm={confirmPromote}
      >
        <DeptTagPicker
          departments={departments}
          selected={promoteDeptIds}
          onChange={setPromoteDeptIds}
        />
      </Modal>

      <Modal
        open={!!editTarget}
        title="编辑管理组织"
        description={editTarget ? `调整「${editTarget.displayName}」的管理范围` : undefined}
        confirmLabel="保存"
        loading={busy === 'edit-admin'}
        confirmDisabled={!editDeptIds.size}
        onClose={() => setEditTarget(null)}
        onConfirm={confirmEditAdmin}
      >
        <DeptTagPicker
          departments={departments}
          selected={editDeptIds}
          onChange={setEditDeptIds}
        />
      </Modal>

      <Modal
        open={!!demoteTarget}
        title="取消管理员"
        description={demoteTarget ? `确定取消「${demoteTarget.displayName}」的管理员身份？` : undefined}
        confirmLabel="确认取消"
        confirmVariant="outline"
        loading={busy === 'demote'}
        onClose={() => setDemoteTarget(null)}
        onConfirm={confirmDemote}
      />

      <GoldDivider className="mt-12 opacity-40" />
    </div>
  );
}
