import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type BadgeTone = 'green' | 'blue' | 'slate' | 'amber';

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

const toneClasses: Record<BadgeTone, string> = {
  green: 'bg-brand-50 text-brand-700 ring-brand-100',
  blue: 'bg-skyway-50 text-skyway-700 ring-skyway-100',
  slate: 'bg-slate-100 text-ink-700 ring-slate-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100'
};

export function Badge({ children, tone = 'slate', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset',
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
