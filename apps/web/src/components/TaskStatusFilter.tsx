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
    <div className="flex flex-wrap gap-2 mb-8">
      {TASK_STATUS_FILTERS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`text-sm font-medium px-4 py-2 border transition-all duration-300 rounded-sm ${
            value === opt.value
              ? 'border-champagne bg-champagne/15 text-ink shadow-sm'
              : 'border-bronze/25 text-mist bg-paper hover:border-champagne/40 hover:text-graphite'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
