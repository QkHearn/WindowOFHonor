/** 与后端 TaskStatus 枚举值对应 */
export const TASK_STATUS_LABEL: Record<string, string> = {
  pending: '进行中',
  in_progress: '进行中',
  completed: '已完成',
  expired: '已逾期',
};

/** 筛选用：全部 + 三态 */
export type TaskStatusFilterValue = 'all' | 'in_progress' | 'completed' | 'expired';

export const TASK_STATUS_FILTERS: { value: TaskStatusFilterValue; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'expired', label: '已逾期' },
];

/** 手动可改的状态（具体选项由截止时间决定，见 TaskStatusEditor） */
export type TaskStatusEditableValue = 'in_progress' | 'completed' | 'expired';

export function TaskStatusFilter({
  value,
  onChange,
}: {
  value: TaskStatusFilterValue;
  onChange: (next: TaskStatusFilterValue) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {TASK_STATUS_FILTERS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`text-xs px-3 py-1.5 border tracking-wider transition-colors ${
            value === opt.value
              ? 'border-champagne bg-champagne/10 text-ink'
              : 'border-champagne/20 text-graphite hover:border-champagne/40'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
