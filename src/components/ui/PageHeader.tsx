import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  right?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, right }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-5 border-b border-white/10">
      <div className="min-w-0">
        <p className="eyebrow-label text-ember-400">{eyebrow}</p>
        <h1 className="mt-1.5 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-ink-100">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-ink-400 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {right && <div className="shrink-0 flex items-center gap-3">{right}</div>}
    </header>
  );
}
