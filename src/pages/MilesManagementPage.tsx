import { ArrowRight, CircleAlert, Search, Trophy, WalletCards } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { cn } from '../lib/cn';
import { milesProgramRepository } from '../services/miles/milesProgramRepositoryAdapter';
import {
  milesProgramTypes,
  type MilesProgramRecord,
  type MilesProgramStatus,
  type MilesProgramType
} from '../types/miles';

type StatusFilter = MilesProgramStatus | 'all';
type TypeFilter = MilesProgramType | 'all';

const statusLabels: Record<MilesProgramStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo'
};

export function MilesManagementPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<MilesProgramRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [type, setType] = useState<TypeFilter>('all');

  useEffect(() => {
    refreshPrograms();
  }, []);

  const filteredPrograms = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return programs.filter((program) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [program.programName, program.accountHolder]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesStatus = status === 'all' || program.status === status;
      const matchesType = type === 'all' || program.type === type;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [programs, search, status, type]);

  const summary = useMemo(() => {
    const expiringPrograms = programs.filter((program) => isExpiringSoon(program.expirationDate));
    const highestBalance = programs.reduce<MilesProgramRecord | null>((highest, program) => {
      if (!highest || program.balance > highest.balance) {
        return program;
      }

      return highest;
    }, null);

    return {
      totalMiles: programs.reduce((total, program) => total + program.balance, 0),
      activePrograms: programs.filter((program) => program.status === 'active').length,
      expiringMiles: expiringPrograms.reduce((total, program) => total + program.balance, 0),
      highestBalance
    };
  }, [programs]);

  async function refreshPrograms() {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const records = await milesProgramRepository.listPrograms();
      setPrograms(records);
    } catch {
      setErrorMessage('Nao foi possivel carregar programas de milhas.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Gestao de milhas"
          description="Visao consolidada dos saldos e vencimentos dos programas cadastrados."
        />
        <Button className="w-full sm:w-auto sm:shrink-0" onClick={() => navigate('/platform/miles')}>
          Ir para Milhas
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total de milhas" value={formatMiles(summary.totalMiles)} icon={WalletCards} />
        <SummaryCard label="Programas ativos" value={summary.activePrograms.toString()} icon={CircleAlert} />
        <SummaryCard label="Milhas vencendo" value={formatMiles(summary.expiringMiles)} icon={CircleAlert} />
        <SummaryCard
          label="Maior saldo"
          value={summary.highestBalance ? formatMiles(summary.highestBalance.balance) : '0'}
          helper={summary.highestBalance?.programName ?? 'Sem programas'}
          icon={Trophy}
        />
      </div>

      <Filters
        search={search}
        status={status}
        type={type}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onTypeChange={setType}
      />

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Programas cadastrados</h2>
          <p className="text-sm text-ink-500">{filteredPrograms.length} programas encontrados</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center text-sm font-semibold text-ink-500">
              Carregando programas de milhas...
            </div>
          ) : filteredPrograms.length === 0 ? (
            <EmptyState
              icon={WalletCards}
              title="Nenhum programa encontrado"
              description="Ajuste os filtros ou cadastre programas na pagina de Milhas."
              actionLabel="Ir para Milhas"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-3">Programa</th>
                    <th className="px-3 py-3">Titular</th>
                    <th className="px-3 py-3">Saldo</th>
                    <th className="px-3 py-3">Vencimento</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPrograms.map((program) => {
                    const expiringSoon = isExpiringSoon(program.expirationDate);

                    return (
                      <tr
                        className={cn(
                          'align-top transition hover:bg-slate-50',
                          expiringSoon && 'bg-amber-50/60'
                        )}
                        key={program.id}
                      >
                        <td className="px-3 py-4">
                          <p className="font-semibold text-ink-900">{program.programName}</p>
                          <p className="mt-1 text-xs text-ink-500">{program.type}</p>
                        </td>
                        <td className="px-3 py-4 text-ink-700">{program.accountHolder || '-'}</td>
                        <td className="px-3 py-4 font-semibold text-ink-900">
                          {formatMiles(program.balance)}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex flex-col items-start gap-2">
                            <span className="text-ink-700">{formatDate(program.expirationDate)}</span>
                            {expiringSoon ? <Badge tone="amber">Vence em ate 90 dias</Badge> : null}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <Badge tone={program.status === 'active' ? 'green' : 'slate'}>
                            {statusLabels[program.status]}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

type SummaryCardProps = {
  helper?: string;
  icon: LucideIcon;
  label: string;
  value: string;
};

function SummaryCard({ helper, icon: Icon, label, value }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-500">{label}</p>
            <p className="mt-3 break-words text-2xl font-semibold text-ink-900">{value}</p>
            {helper ? <p className="mt-1 truncate text-sm text-ink-500">{helper}</p> : null}
          </div>
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
            <Icon size={20} aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type FiltersProps = {
  search: string;
  status: StatusFilter;
  type: TypeFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onTypeChange: (value: TypeFilter) => void;
};

function Filters({
  search,
  status,
  type,
  onSearchChange,
  onStatusChange,
  onTypeChange
}: FiltersProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <label className="relative block w-full lg:max-w-md">
          <span className="sr-only">Buscar programas</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
            aria-hidden="true"
          />
          <input
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-ink-900 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por programa ou titular"
            type="search"
          />
        </label>

        <div className="grid gap-3 xl:grid-cols-2">
          <FilterGroup label="Status">
            <FilterButton isActive={status === 'all'} onClick={() => onStatusChange('all')}>
              Todos
            </FilterButton>
            <FilterButton isActive={status === 'active'} onClick={() => onStatusChange('active')}>
              Ativos
            </FilterButton>
            <FilterButton
              isActive={status === 'inactive'}
              onClick={() => onStatusChange('inactive')}
            >
              Inativos
            </FilterButton>
          </FilterGroup>

          <FilterGroup label="Tipo">
            <FilterButton isActive={type === 'all'} onClick={() => onTypeChange('all')}>
              Todos
            </FilterButton>
            {milesProgramTypes.map((programType) => (
              <FilterButton
                isActive={type === programType}
                key={programType}
                onClick={() => onTypeChange(programType)}
              >
                {programType}
              </FilterButton>
            ))}
          </FilterGroup>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterGroup({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterButton({
  children,
  isActive,
  onClick
}: {
  children: ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
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

function isExpiringSoon(expirationDate: string) {
  if (!expirationDate) {
    return false;
  }

  const today = startOfDay(new Date());
  const expiresAt = startOfDay(new Date(`${expirationDate}T00:00:00`));
  const daysUntilExpiration = Math.ceil(
    (expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysUntilExpiration >= 0 && daysUntilExpiration <= 90;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(value: string) {
  if (!value) {
    return '-';
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
}

function formatMiles(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0
  }).format(value);
}
