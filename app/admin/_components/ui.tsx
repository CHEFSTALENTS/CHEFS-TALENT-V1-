'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

export function PageTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {subtitle ? <p className="text-sm text-white/60 mt-1">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex gap-2">{right}</div> : null}
    </div>
  );
}

export function GhostButton({
  children,
  onClick,
  href,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const cls =
    'px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition';

  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button onClick={onClick} className={cls}>{children}</button>;
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-white/10 rounded-2xl bg-white/5 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function Segment({
  label,
  active,
  onClick,
  badge,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition',
        active
          ? 'bg-white/15 text-white border-white/15'
          : 'bg-white/5 text-white/75 border-white/10 hover:bg-white/10 hover:text-white',
      ].join(' ')}
    >
      <span className="font-medium">{label}</span>
      {badge !== undefined ? (
        <span
          className={[
            'text-[11px] px-2 py-0.5 rounded-full border',
            active
              ? 'bg-white/10 border-white/15 text-white'
              : 'bg-white/5 border-white/10 text-white/70',
          ].join(' ')}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function Badge({
  children,
  tone = 'stone',
}: {
  children: ReactNode;
  tone?: 'stone' | 'dark' | 'violet';
}) {
  const cls =
    tone === 'dark'
      ? 'bg-white/15 text-white border-white/15'
      : tone === 'violet'
      ? 'bg-violet-500/15 text-violet-200 border-violet-500/20'
      : 'bg-white/10 text-white/75 border-white/10';

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${cls}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();

  const cls =
    s === 'new'
      ? 'bg-amber-500/15 text-amber-200 border-amber-500/20'
      : s === 'in_review'
      ? 'bg-sky-500/15 text-sky-200 border-sky-500/20'
      : s === 'assigned'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20'
      : s === 'closed'
      ? 'bg-white/10 text-white/60 border-white/10'
      : 'bg-white/10 text-white/60 border-white/10';

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${cls}`}>
      {s || '—'}
    </span>
  );
}
