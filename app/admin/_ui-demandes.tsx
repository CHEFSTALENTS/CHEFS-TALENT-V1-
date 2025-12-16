// app/admin/_ui-demandes.tsx
import Link from 'next/link';
import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-white/90">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-white/55">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
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
    'rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition';
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return (
    <button onClick={onClick} className={cls} type="button">
      {children}
    </button>
  );
}

export function PanelDark({
  title,
  subtitle,
  right,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5">
      {(title || subtitle || right) && (
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            {title ? <div className="text-sm font-semibold text-white/85">{title}</div> : null}
            {subtitle ? <div className="mt-0.5 text-xs text-white/55">{subtitle}</div> : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: ReactNode;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-xs text-white/55">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white/90">{value}</div>
      {sublabel ? <div className="mt-1 text-xs text-white/45">{sublabel}</div> : null}
    </div>
  );
}
