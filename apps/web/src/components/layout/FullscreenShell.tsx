import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { defaultHomePath } from '../../auth/storage';

export function FullscreenShell({
  children,
  subtitle,
}: {
  children: ReactNode;
  subtitle?: string;
}) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    if (isAuthenticated && user) {
      navigate(defaultHomePath(user.role));
      return;
    }
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-ink text-ivory relative overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(201,169,98,0.12),transparent_55%)]" />
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-5 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className="text-sm tracking-[0.25em] text-champagne/90 hover:text-champagne transition-colors flex items-center gap-2"
        >
          <span aria-hidden>←</span>
          <span>返回</span>
        </button>
        {subtitle && (
          <p className="text-[10px] tracking-[0.4em] uppercase text-champagne/50 hidden sm:block">{subtitle}</p>
        )}
      </header>
      <main className="relative z-10 pt-20 pb-12 px-6">{children}</main>
    </div>
  );
}
