/** 奢侈品风自定义选中标记，替代原生 checkbox */
export function SelectMark({
  checked,
  multiple = true,
  className = '',
}: {
  checked: boolean;
  multiple?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`relative shrink-0 flex items-center justify-center border transition-all duration-200 ${
        multiple ? 'w-5 h-5' : 'w-5 h-5 rounded-full'
      } ${
        checked
          ? 'border-champagne bg-champagne/10 shadow-[inset_0_0_0_1px_rgba(201,169,98,0.3)]'
          : 'border-graphite/30 bg-transparent group-hover:border-champagne/50'
      } ${className}`}
      aria-hidden
    >
      {checked && (
        <svg viewBox="0 0 12 12" className="w-3 h-3 text-champagne" fill="none">
          {multiple ? (
            <path
              d="M2 6l3 3 5-6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <circle cx="6" cy="6" r="2.5" fill="currentColor" />
          )}
        </svg>
      )}
    </span>
  );
}
