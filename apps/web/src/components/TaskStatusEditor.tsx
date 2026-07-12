import {
  TASK_STATUS_LABEL,
  type TaskStatusEditableValue,
} from './TaskStatusFilter';

function isAfterDue(dueAt?: string | null) {
  return !!dueAt && new Date(dueAt).getTime() <= Date.now();
}

function getEditableOptions(dueAt?: string | null) {
  if (isAfterDue(dueAt)) {
    return [
      { value: 'expired' as const, label: '已逾期' },
      { value: 'completed' as const, label: '已完成' },
    ];
  }
  return [
    { value: 'in_progress' as const, label: '进行中' },
    { value: 'completed' as const, label: '已完成' },
  ];
}

export function TaskStatusBadge({ status }: { status: string }) {
  return (
    <span className="text-xs font-medium border border-bronze/40 bg-champagne/10 px-2.5 py-1 text-bronze rounded-sm">
      {TASK_STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function TaskStatusEditor({
  status,
  dueAt,
  disabled,
  onChange,
}: {
  status: string;
  dueAt?: string | null;
  disabled?: boolean;
  onChange: (status: TaskStatusEditableValue) => void;
}) {
  const options = getEditableOptions(dueAt);
  const selectValue =
    status === 'completed'
      ? 'completed'
      : isAfterDue(dueAt)
        ? 'expired'
        : 'in_progress';

  return (
    <label className="block shrink-0">
      <span className="sr-only">任务状态</span>
      <select
        value={selectValue}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value;
          if (next === 'in_progress' || next === 'completed' || next === 'expired') {
            onChange(next);
          }
        }}
        className="text-sm font-medium bg-paper border border-bronze/30 px-3 py-1.5 rounded-sm focus:outline-none focus:border-champagne text-ink disabled:opacity-50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TaskStatusHint() {
  return (
    <p className="text-sm text-mist mb-5 leading-relaxed">
      截止前可在「进行中」与「已完成」之间切换；截止后可在「已逾期」与「已完成」之间切换。超过截止时间且仍为进行中的任务将自动变为已逾期。
    </p>
  );
}

export { TASK_STATUS_LABEL };
