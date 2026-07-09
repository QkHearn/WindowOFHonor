import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label;
  return (
    <label htmlFor={inputId} className="block w-full">
      <span className="text-xs tracking-[0.2em] uppercase text-graphite mb-2 block">{label}</span>
      <input
        id={inputId}
        className={`w-full bg-transparent border-0 border-b border-graphite/30 pb-2 text-ink focus:outline-none focus:border-champagne transition-colors ${className}`}
        {...props}
      />
    </label>
  );
}
