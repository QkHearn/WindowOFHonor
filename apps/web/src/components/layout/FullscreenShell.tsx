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
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,169,98,0.16), transparent 60%)',
        }}
      />
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-ink/90 backdrop-blur-md border-b border-champagne/15">
        <button
          type="button"
          onClick={goBack}
          className="text-sm font-medium text-ivory/80 hover:text-champagne transition-colors flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform" aria-hidden>
            ←
          </span>
          <span>返回</span>
        </button>
        {subtitle && (
          <p className="section-label text-champagne/70 hidden sm:block">{subtitle}</p>
        )}
      </header>
      <main className="relative z-10 pt-24 pb-14 px-6 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
