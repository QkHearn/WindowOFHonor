import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { GoldDivider } from '../ui/Card';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="auth-page">
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="text-center mb-12 relative z-10 max-w-xl px-4"
      >
        <p className="section-label text-champagne mb-6">Window of Honor</p>
        <h1 className="font-display text-5xl md:text-7xl font-semibold text-champagne leading-none tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-ivory/60 mt-5 text-base font-normal leading-relaxed">{subtitle}</p>
        )}
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        className="auth-card"
      >
        {children}
        {footer && (
          <>
            <GoldDivider className="mt-8" />
            <div className="mt-6">{footer}</div>
          </>
        )}
      </motion.div>
    </div>
  );
}
