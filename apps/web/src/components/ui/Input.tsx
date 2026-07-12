import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label;
  return (
    <label htmlFor={inputId} className="block w-full group">
      <span className="text-xs font-medium text-graphite mb-2 block group-focus-within:text-bronze transition-colors">
        {label}
      </span>
      <input
        id={inputId}
        className={`w-full bg-transparent border-0 border-b-2 border-parchment pb-2.5 text-ink text-[15px] placeholder:text-mist/80 focus:outline-none focus:border-champagne transition-colors duration-300 ${className}`}
        {...props}
      />
    </label>
  );
}
