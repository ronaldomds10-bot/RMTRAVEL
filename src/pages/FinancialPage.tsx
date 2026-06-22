import {
  BadgeDollarSign,
  CreditCard,
  Percent,
  ReceiptText,
  RefreshCw,
  Search,
  TrendingUp
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { formatCurrency } from '../lib/formatters';
import { financialRepository } from '../services/financial/financialRepositoryAdapter';
import type {
  FinancialData,
  FinancialSaleRecord,
  FinancialSaleStatus
} from '../types/financial';
import type { LucideIcon } from 'lucide-react';

type FinancialStatus = 'loading' | 'loaded' | 'error';
type StatusFilter = FinancialSaleStatus | 'todos';

const statusLabels: Record<FinancialSaleStatus, string> = {
  orcamento: 'Orcamento',
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  emitido: 'Emitido',
  cancelado: 'Cancelado'
};

export function FinancialPage() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [status, setStatus] = useState<FinancialStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [paymentFilter, setPaymentFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    refreshFinancialData();
  }, []);

  async function refreshFinancialData() {
    try {
      setStatus('loading');
      setErrorMessage(null);
      const nextData = await financialRepository.getFinancialData();
      setData(nextData);
      setStatus('loaded');
    } catch {
      setData(null);
      setStatus('error');
      setErrorMessage('Nao foi possivel carregar o financeiro.');
    }
  }

  const paymentMethods = useMemo(() => {
    if (!data) {
      return [];
    }

    return Array.from(
      new Set(
        data.sales
          .map((sale) => sale.paymentMethod)
          .filter((method): method is string => Boolean(method))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filteredSales = useMemo(() => {
    if (!data) {
      return [];
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();

    return data.sales.filter((sale) => {
      const matchesStatus = statusFilter === 'todos' || sale.status === statusFilter;
      const matchesPayment =
        paymentFilter === 'todos' || sale.paymentMethod === paymentFilter;
      const searchable = `${sale.customerName} ${sale.ticketLocator ?? ''}`.toLowerCase();
      const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);

      return matchesStatus && matchesPayment && matchesSearch;
    });
  }, [data, paymentFilter, searchTerm, statusFilter]);

  const metrics = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        label: 'Receita',
        value: formatCurrency(data.summary.totalRevenue),
        helper: 'Soma das vendas',
        icon: BadgeDollarSign
      },
      {
        label: 'Custo',
        value: formatCurrency(data.summary.totalCost),
        helper: 'Soma dos custos',
        icon: ReceiptText
      },
      {
        label: 'Lucro',
        value: formatCurrency(data.summary.totalProfit),
        helper: 'Lucro total',
        icon: TrendingUp
      },
      {
        label: 'Margem',
        value: `${data.summary.marginPercent.toFixed(1)}%`,
        helper: 'Lucro sobre receita',
        icon: Percent
      },
      {
        label: 'Pagas',
        value: data.summary.paidCount.toString(),
        helper: 'Status pago ou emitido',
        icon: CreditCard
      },
      {
        label: 'Pendentes',
        value: data.summary.pendingCount.toString(),
        helper: 'Orcamento ou aguardando pagamento',
        icon: ReceiptText
      }
    ];
  }, [data]);

  const hasSales = Boolean(data && data.sales.length > 0);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Financeiro"
          description="Acompanhe receitas, custos, lucro e pagamentos das vendas."
        />
        <Button
          className="w-full sm:w-auto sm:shrink-0"
          disabled={status === 'loading'}
          onClick={refreshFinancialData}
          variant="secondary"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Atualizar
        </Button>
      </div>

      {status === 'loading' ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-ink-600">
          Carregando financeiro...
        </div>
      ) : null}

      {status === 'error' ? (
        <Card>
          <CardContent>
            <EmptyState
              title="Nao foi possivel carregar o financeiro"
              description={errorMessage ?? 'Tente novamente em instantes.'}
              actionLabel="Erro de carregamento"
            />
          </CardContent>
        </Card>
      ) : null}

      {status === 'loaded' && data && !hasSales ? (
        <Card>
          <CardContent>
            <EmptyState
              title="Sem vendas para exibir"
              description="Quando houver vendas cadastradas, as metricas e a lista financeira serao preenchidas automaticamente."
              actionLabel="Aguardando vendas"
            />
          </CardContent>
        </Card>
      ) : null}

      {status === 'loaded' && data && hasSales ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-ink-900">Vendas</h2>
                  <p className="mt-1 text-sm text-ink-500">
                    Lista financeira com valores, custos, lucro e status de pagamento.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[680px]">
                  <label className="space-y-1 text-sm font-medium text-ink-600">
                    <span>Status</span>
                    <select
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                    >
                      <option value="todos">Todos</option>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm font-medium text-ink-600">
                    <span>Pagamento</span>
                    <select
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      value={paymentFilter}
                      onChange={(event) => setPaymentFilter(event.target.value)}
                    >
                      <option value="todos">Todos</option>
                      {paymentMethods.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm font-medium text-ink-600">
                    <span>Busca</span>
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                        aria-hidden="true"
                      />
                      <input
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-ink-700 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                        placeholder="Cliente ou localizador"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                      />
                    </div>
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredSales.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                    <thead>
                      <tr className="text-xs font-semibold uppercase text-slate-400">
                        <th className="whitespace-nowrap px-3 py-3">Cliente</th>
                        <th className="whitespace-nowrap px-3 py-3">Localizador</th>
                        <th className="whitespace-nowrap px-3 py-3 text-right">Valor</th>
                        <th className="whitespace-nowrap px-3 py-3 text-right">Custo</th>
                        <th className="whitespace-nowrap px-3 py-3 text-right">Lucro</th>
                        <th className="whitespace-nowrap px-3 py-3">Pagamento</th>
                        <th className="whitespace-nowrap px-3 py-3">Status</th>
                        <th className="whitespace-nowrap px-3 py-3">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSales.map((sale) => (
                        <FinancialSaleRow key={sale.id} sale={sale} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="Nenhuma venda encontrada"
                  description="Ajuste os filtros para ver outros registros financeiros."
                  actionLabel="Sem resultados"
                />
              )}
            </CardContent>
          </Card>
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

function FinancialSaleRow({ sale }: { sale: FinancialSaleRecord }) {
  return (
    <tr className="align-top text-ink-700">
      <td className="min-w-48 px-3 py-4 font-semibold text-ink-900">{sale.customerName}</td>
      <td className="whitespace-nowrap px-3 py-4">{sale.ticketLocator ?? '-'}</td>
      <td className="whitespace-nowrap px-3 py-4 text-right font-semibold text-ink-900">
        {formatCurrency(sale.saleAmount)}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-right">{formatCurrency(sale.costAmount)}</td>
      <td className="whitespace-nowrap px-3 py-4 text-right font-semibold">
        {formatCurrency(sale.profitAmount)}
      </td>
      <td className="whitespace-nowrap px-3 py-4">{sale.paymentMethod ?? '-'}</td>
      <td className="whitespace-nowrap px-3 py-4">
        <Badge tone={statusTone(sale.status)}>{statusLabels[sale.status]}</Badge>
      </td>
      <td className="whitespace-nowrap px-3 py-4">
        {new Date(sale.createdAt).toLocaleDateString('pt-BR')}
      </td>
    </tr>
  );
}

function statusTone(status: FinancialSaleStatus) {
  if (status === 'pago' || status === 'emitido') {
    return 'green';
  }

  if (status === 'aguardando_pagamento') {
    return 'amber';
  }

  if (status === 'cancelado') {
    return 'slate';
  }

  return 'blue';
}
