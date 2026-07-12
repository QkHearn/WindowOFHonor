import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppreciationUserPicker } from '../components/AppreciationUserPicker';
import { Button } from '../components/ui/Button';
import { Card, PageHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import type { User } from '../types';

export default function IssueAppreciationPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Map<string, User>>(new Map());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
      });
      navigate('/me');
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  if (preview) {
    return (
      <div>
        <PageHeader title="预览赞赏" subtitle="确认后将展示于荣誉殿堂" />
        <Card className="max-w-xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-champagne mb-4">Appreciation</p>
          <h2 className="font-display text-3xl mb-4">{title}</h2>
          {description && <p className="text-graphite mb-6">{description}</p>}
          <p className="text-sm text-graphite mb-8">
            接收人：{selectedUsers.map((u) => u.displayName).join('、')}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={submit} disabled={submitting}>
              {submitting ? '发放中…' : '确认发放'}
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
      <PageHeader title="发放赞赏" subtitle="搜索或从列表多选，向同事表达认可" />
      <div className="grid md:grid-cols-2 gap-10">
        <section>
          <AppreciationUserPicker
            token={token!}
            selected={selected}
            onChange={setSelected}
          />
        </section>
        <section>
          <h2 className="font-display text-xl mb-4">赞赏内容</h2>
          <div className="space-y-6">
            <Input label="标题" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <label className="block">
              <span className="text-xs tracking-[0.2em] uppercase text-graphite mb-2 block">说明</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent border-b border-graphite/30 pb-2 focus:outline-none focus:border-champagne min-h-[80px]"
              />
            </label>
          </div>
          <Button
            className="mt-8"
            disabled={!title || !selectedIds.length}
            onClick={() => setPreview(true)}
          >
            预览赞赏
          </Button>
        </section>
      </div>
    </div>
  );
}
