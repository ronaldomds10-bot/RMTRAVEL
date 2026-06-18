import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Layers3 } from 'lucide-react';
import { Button } from './Button';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  icon?: LucideIcon;
};

export function EmptyState({
  title,
  description,
  actionLabel = 'Ver estrutura',
  icon: Icon = Layers3
}: EmptyStateProps) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid size-12 place-items-center rounded-lg bg-white text-brand-700 shadow-sm ring-1 ring-slate-200">
          <Icon size={22} aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-ink-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-ink-500">{description}</p>
        <Button className="mt-5" variant="secondary">
          {actionLabel}
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
