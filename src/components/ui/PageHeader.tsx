import { Badge } from './Badge';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  badge?: string;
};

export function PageHeader({ eyebrow = 'RMTRAVEL', title, description, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-700">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-ink-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">{description}</p>
      </div>
      {badge ? (
        <Badge className="self-start" tone="green">
          {badge}
        </Badge>
      ) : null}
    </div>
  );
}
