import { Filter, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import type { CustomerStatus, CustomerTag } from '../../types/customer';
import { cn } from '../../lib/cn';

type CustomerFiltersProps = {
  search: string;
  status: CustomerStatus | 'todos';
  tag: CustomerTag | 'todas';
  onSearchChange: (value: string) => void;
  onStatusChange: (value: CustomerStatus | 'todos') => void;
  onTagChange: (value: CustomerTag | 'todas') => void;
};

const statusOptions: Array<{ label: string; value: CustomerStatus | 'todos' }> = [
  { label: 'Todos', value: 'todos' },
  { label: 'Ativos', value: 'ativo' },
  { label: 'Pendentes', value: 'pendente' },
  { label: 'Inativos', value: 'inativo' }
];

const tagOptions: Array<{ label: string; value: CustomerTag | 'todas' }> = [
  { label: 'Todas tags', value: 'todas' },
  { label: 'Viagem', value: 'viagem' },
  { label: 'Milhas', value: 'milhas' },
  { label: 'Financeiro', value: 'financeiro' },
  { label: 'Atendimento', value: 'atendimento' }
];

export function CustomerFilters({
  search,
  status,
  tag,
  onSearchChange,
  onStatusChange,
  onTagChange
}: CustomerFiltersProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-md">
            <span className="sr-only">Buscar clientes</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
              aria-hidden="true"
            />
            <input
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-ink-900 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por nome, email, cidade ou telefone"
              type="search"
            />
          </label>
          <Button variant="secondary">
            <Filter size={16} aria-hidden="true" />
            Filtros visuais
          </Button>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <FilterGroup label="Status">
            {statusOptions.map((option) => (
              <FilterButton
                isActive={status === option.value}
                key={option.value}
                onClick={() => onStatusChange(option.value)}
              >
                {option.label}
              </FilterButton>
            ))}
          </FilterGroup>

          <FilterGroup label="Tags">
            {tagOptions.map((option) => (
              <FilterButton
                isActive={tag === option.value}
                key={option.value}
                onClick={() => onTagChange(option.value)}
              >
                {option.label}
              </FilterButton>
            ))}
          </FilterGroup>
        </div>
      </CardContent>
    </Card>
  );
}

type FilterGroupProps = {
  label: string;
  children: ReactNode;
};

function FilterGroup({ label, children }: FilterGroupProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

type FilterButtonProps = {
  children: ReactNode;
  isActive: boolean;
  onClick: () => void;
};

function FilterButton({ children, isActive, onClick }: FilterButtonProps) {
  return (
    <button
      className={cn(
        'min-h-9 rounded-lg border px-3 text-sm font-semibold transition',
        isActive
          ? 'border-brand-200 bg-brand-50 text-brand-700'
          : 'border-slate-200 bg-white text-ink-700 hover:bg-slate-50'
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
