import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { MemberPicker } from '../components/MemberPicker';
import { Button } from '../components/ui/Button';
import { Card, PageHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import type { TeamMember } from '../types';

export default function IssueIncentivePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Map<string, TeamMember>>(new Map());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [honorValue, setHonorValue] = useState(10);
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedIds = Array.from(selected.keys());
  const selectedUsers = Array.from(selected.values());

  async function submit() {
    if (!token || !title || !selectedIds.length) return;
    setSubmitting(true);
    setError('');
    try {
      await api.issueIncentive(token, {
        title,
        description,
        recipientIds: selectedIds,
        honorValue,
      });
      navigate('/supervisor/records');
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  if (preview) {
    return (
      <div>
        <PageHeader title="预览荣誉" subtitle="确认后将呈递至荣誉展播" />
        <Card className="max-w-xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-champagne mb-4">Honor Certificate</p>
          <h2 className="font-display text-3xl mb-4">{title}</h2>
          {description && <p className="text-graphite mb-6">{description}</p>}
          <p className="text-champagne font-display text-2xl mb-6">+{honorValue} 荣誉积分</p>
          <p className="text-sm text-graphite mb-8">
            接收人：{selectedUsers.map((u) => u.displayName).join('、')}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={submit} disabled={submitting}>
              {submitting ? '呈递中…' : '确认呈递'}
            </Button>
            <Button variant="ghost" onClick={() => setPreview(false)}>
              返回编辑
            </Button>
          </div>
          {error && <p className="text-bronze mt-4">{error}</p>}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="呈递荣誉" subtitle="选择接收人，填写激励内容" />
      <div className="grid md:grid-cols-2 gap-10">
        <section>
          <MemberPicker token={token!} selected={selected} onChange={setSelected} />
        </section>
        <section>
          <h2 className="font-display text-xl mb-4">激励内容</h2>
          <div className="space-y-6">
            <Input label="激励标题" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <label className="block">
              <span className="text-xs tracking-[0.2em] uppercase text-graphite mb-2 block">说明</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent border-b border-graphite/30 pb-2 focus:outline-none focus:border-champagne min-h-[80px]"
              />
            </label>
            <Input
              label="荣誉分值"
              type="number"
              min={1}
              value={honorValue}
              onChange={(e) => setHonorValue(Number(e.target.value))}
            />
          </div>
          <Button
            className="mt-8"
            disabled={!title || !selectedIds.length}
            onClick={() => setPreview(true)}
          >
            预览荣誉
          </Button>
        </section>
      </div>
    </div>
  );
}
