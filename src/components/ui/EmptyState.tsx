import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-soft border border-dashed border-white/15 px-5 py-8 text-center flex flex-col items-center justify-center gap-2.5">
      <div className="h-11 w-11 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-ink-300">
        {icon}
      </div>
      <h3 className="font-display text-base font-bold text-ink-100">{title}</h3>
      <p className="text-xs sm:text-sm text-ink-400 max-w-md leading-relaxed">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
