import type { ReactNode } from 'react';

export function Panel({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          {subtitle && <div className="mt-0.5 text-xs text-white/60">{subtitle}</div>}
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
