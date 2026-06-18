import {
  Activity,
  BarChart3,
  CreditCard,
  ReceiptText,
  RefreshCw,
  Ticket,
  UsersRound
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { formatCurrency } from '../lib/formatters';
import { analyticsRepository } from '../services/analytics/analyticsRepositoryAdapter';
import type { AnalyticsMovement, AnalyticsSummary } from '../types/analytics';
import type { LucideIcon } from 'lucide-react';

type AnalyticsStatus = 'loading' | 'loaded' | 'error';

export function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [status, setStatus] = useState<AnalyticsStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    refreshAnalytics();
  }, []);

  async function refreshAnalytics() {
    try {
      setStatus('loading');
      setErrorMessage(null);
      const nextSummary = await analyticsRepository.getAnalyticsSummary();
      setSummary(nextSummary);
      setStatus('loaded');
    } catch (error) {
      setSummary(null);
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel carregar as analises.'
      );
    }
  }

  const hasData = Boolean(
    summary &&
      (summary.totalTickets > 0 || summary.totalCustomers > 0 || summary.totalSales > 0)
  );

  const metrics = useMemo(() => {
    if (!summary) {
      return [];
    }

    return [
      {
        label: 'Total de bilhetes',
        value: summary.totalTickets.toString(),
        helper: 'Bilhetes salvos no Supabase',
        icon: Ticket
      },
      {
        label: 'Total de clientes',
        value: summary.totalCustomers.toString(),
        helper: 'Clientes do usuario autenticado',
        icon: UsersRound
      },
      {
        label: 'Total de vendas',
        value: summary.totalSales.toString(),
        helper: 'Vendas registradas',
        icon: ReceiptText
      },
      {
        label: 'Receita total',
        value: formatCurrency(summary.totalRevenue),
        helper: 'Soma de sale_amount',
        icon: CreditCard
      },
      {
        label: 'Ticket medio',
        value: formatCurrency(summary.averageTicket),
        helper: 'Receita dividida por vendas',
        icon: BarChart3
      }
    ];
  }, [summary]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Análise e Gestão"
          description="Acompanhe os principais números da sua operação."
          badge="Supabase"
        />
        <Button
          className="w-full sm:w-auto sm:shrink-0"
          disabled={status === 'loading'}
          onClick={refreshAnalytics}
          variant="secondary"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Atualizar
        </Button>
      </div>

      {status === 'loading' ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-ink-600">
          Carregando indicadores da operacao...
        </div>
      ) : null}

      {status === 'error' ? (
        <Card>
          <CardContent>
            <EmptyState
              title="Nao foi possivel carregar as analises"
              description={errorMessage ?? 'Verifique a configuracao do Supabase e tente novamente.'}
              actionLabel="Erro de carregamento"
            />
          </CardContent>
        </Card>
      ) : null}

      {status === 'loaded' && summary && !hasData ? (
        <Card>
          <CardContent>
            <EmptyState
              title="Sem dados para analisar"
              description="Quando houver bilhetes, clientes ou vendas no Supabase, os indicadores desta tela serao preenchidos automaticamente."
              actionLabel="Aguardando dados"
            />
          </CardContent>
        </Card>
      ) : null}

      {status === 'loaded' && summary && hasData ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-ink-900">Resumo da operação</h2>
                <p className="text-sm text-ink-500">
                  Visao consolidada dos dados disponiveis para o usuario autenticado.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <SummaryRow
                  label="Bilhetes por cliente"
                  value={ratio(summary.totalTickets, summary.totalCustomers)}
                />
                <SummaryRow
                  label="Vendas por cliente"
                  value={ratio(summary.totalSales, summary.totalCustomers)}
                />
                <SummaryRow
                  label="Receita por cliente"
                  value={formatCurrency(
                    summary.totalCustomers > 0
                      ? summary.totalRevenue / summary.totalCustomers
                      : 0
                  )}
                />
                <SummaryRow label="Origem dos dados" value="Supabase com RLS" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-ink-900">Últimas movimentações</h2>
                <p className="text-sm text-ink-500">
                  Vendas e bilhetes mais recentes, ordenados por atualizacao.
                </p>
              </CardHeader>
              <CardContent>
                {summary.latestMovements.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {summary.latestMovements.map((movement) => (
                      <MovementRow key={`${movement.type}-${movement.id}`} movement={movement} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Sem movimentacoes recentes"
                    description="As ultimas vendas e bilhetes aparecerao aqui quando forem registrados."
                    actionLabel="Sem movimentos"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </section>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
};

function MetricCard({ label, value, helper, icon: Icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-500">{label}</p>
            <p className="mt-3 break-words text-2xl font-semibold text-ink-900">{value}</p>
          </div>
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-50 text-brand-700 ring-1 ring-slate-200">
            <Icon size={20} aria-hidden="true" />
          </div>
        </div>
        <p className="mt-4 text-xs font-medium text-ink-500">{helper}</p>
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-ink-600">{label}</span>
      <span className="text-right text-sm font-semibold text-ink-900">{value}</span>
    </div>
  );
}

function MovementRow({ movement }: { movement: AnalyticsMovement }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-1 grid size-9 shrink-0 place-items-center rounded-lg bg-skyway-50 text-skyway-700 ring-1 ring-skyway-100">
          <Activity size={17} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-ink-900">{movement.title}</p>
            <Badge tone={movement.type === 'sale' ? 'green' : 'blue'}>
              {movement.type === 'sale' ? 'Venda' : 'Bilhete'}
            </Badge>
          </div>
          <p className="mt-1 text-sm leading-5 text-ink-500">{movement.description}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {new Date(movement.updatedAt).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-ink-900">
          {movement.amount === null ? '-' : formatCurrency(movement.amount)}
        </p>
        <p className="mt-1 text-xs font-medium text-ink-500">{movement.status}</p>
      </div>
    </div>
  );
}

function ratio(value: number, divider: number) {
  if (divider <= 0) {
    return '0,0';
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / divider);
}
