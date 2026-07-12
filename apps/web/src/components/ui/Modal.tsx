import { useEffect, type ReactNode } from 'react';
import { GoldDivider } from './Card';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  confirmDisabled?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
}

export function Modal({
  open,
  title,
  description,
  children,
  confirmLabel = '确认',
  cancelLabel = '取消',
  confirmVariant = 'primary',
  loading = false,
  confirmDisabled = false,
  onConfirm,
  onClose,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        aria-label="关闭"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-ivory border border-champagne/25 shadow-2xl p-8"
      >
        <p className="text-xs tracking-[0.35em] uppercase text-champagne mb-3">System</p>
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {description && <p className="text-sm text-graphite mt-3 leading-relaxed">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
        <GoldDivider className="my-6" />
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          {onConfirm && (
            <Button
              variant={confirmVariant}
              onClick={onConfirm}
              disabled={loading || confirmDisabled}
            >
              {loading ? '处理中…' : confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
