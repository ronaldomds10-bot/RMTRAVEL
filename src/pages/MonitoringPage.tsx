import { AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { hasSupabaseConfig, supabase } from '../lib/supabase';

type TicketRow = {
  id: string;
  locator: string;
  passenger_name: string;
  passenger_surname: string;
  airline: string;
  status: string;
  origin: string;
  destination: string;
  departure_date: string;
  updated_at: string;
};

type SaleRow = {
  id: string;
  customer_name: string;
  ticket_locator: string | null;
  origin: string | null;
  destination: string | null;
  sale_amount: number | string;
  status: string;
  updated_at: string;
};

type MilesProgramRow = {
  id: string;
  program_name: string;
  type: string;
  balance: number | string;
  account_holder: string;
  expiration_date: string | null;
  status: string;
  updated_at: string;
};

type MilesTransferRow = {
  id: string;
  quantity: number | string;
  final_quantity: number | string;
  transfer_date: string;
  status: string;
  updated_at: string;
};

type MilesPurchaseRow = {
  id: string;
  quantity: number | string;
  total_cost: number | string;
  purchase_date: string;
  status: string;
  updated_at: string;
};

type MonitoringData = {
  tickets: TicketRow[];
  sales: SaleRow[];
  milesPrograms: MilesProgramRow[];
  milesTransfers: MilesTransferRow[];
  milesPurchases: MilesPurchaseRow[];
};

type AlertType = 'miles' | 'sale' | 'transfer' | 'ticket' | 'purchase';
type AlertStatus = 'upcoming' | 'overdue' | 'pending' | 'cancelled';

type OperationalAlert = {
  id: string;
  type: AlertType;
  status: AlertStatus;
  title: string;
  detail: string;
  helper: string;
  route: string;
  updatedAt: string;
};

const emptyData: MonitoringData = {
  tickets: [],
  sales: [],
  milesPrograms: [],
  milesTransfers: [],
  milesPurchases: []
};

const alertTypeLabels: Record<AlertType | 'all', string> = {
  all: 'Todos os tipos',
  miles: 'Milhas',
  sale: 'Vendas',
  transfer: 'Transferencias',
  ticket: 'Bilhetes',
  purchase: 'Compras'
};

const alertStatusLabels: Record<AlertStatus | 'all', string> = {
  all: 'Todos os status',
  upcoming: 'Vencendo',
  overdue: 'Vencido',
  pending: 'Pendente',
  cancelled: 'Cancelado'
};

const alertStatusTone: Record<AlertStatus, 'green' | 'blue' | 'slate' | 'amber'> = {
  upcoming: 'amber',
  overdue: 'amber',
  pending: 'blue',
  cancelled: 'slate'
};

const pendingSaleStatuses = new Set(['orcamento', 'aguardando_pagamento']);
const activeTicketStatuses = new Set(['confirmado', 'pendente', 'emitido']);

export function MonitoringPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<MonitoringData>(emptyData);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');

  async function loadMonitoringData() {
    if (!hasSupabaseConfig || !supabase) {
      setData(emptyData);
      setError('Supabase nao esta configurado para carregar o monitoramento.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      setError(`Nao foi possivel identificar o usuario autenticado: ${authError.message}`);
      setIsLoading(false);
      return;
    }

    if (!authData.user) {
      setError('Usuario autenticado nao encontrado para carregar o monitoramento.');
      setIsLoading(false);
      return;
    }

    const userId = authData.user.id;
    const [tickets, sales, milesPrograms, milesTransfers, milesPurchases] = await Promise.all([
      supabase
        .from('tickets')
        .select('id, locator, passenger_name, passenger_surname, airline, status, origin, destination, departure_date, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }),
      supabase
        .from('sales')
        .select('id, customer_name, ticket_locator, origin, destination, sale_amount, status, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }),
      supabase
        .from('miles_programs')
        .select('id, program_name, type, balance, account_holder, expiration_date, status, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }),
      supabase
        .from('miles_transfers')
        .select('id, quantity, final_quantity, transfer_date, status, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }),
      supabase
        .from('miles_purchases')
        .select('id, quantity, total_cost, purchase_date, status, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
    ]);

    const queryError =
      tickets.error ??
      sales.error ??
      milesPrograms.error ??
      milesTransfers.error ??
      milesPurchases.error;

    if (queryError) {
      setError(`Nao foi possivel carregar os dados de monitoramento: ${queryError.message}`);
      setIsLoading(false);
      return;
    }

    setData({
      tickets: (tickets.data ?? []) as TicketRow[],
      sales: (sales.data ?? []) as SaleRow[],
      milesPrograms: (milesPrograms.data ?? []) as MilesProgramRow[],
      milesTransfers: (milesTransfers.data ?? []) as MilesTransferRow[],
      milesPurchases: (milesPurchases.data ?? []) as MilesPurchaseRow[]
    });
    setIsLoading(false);
  }

  useEffect(() => {
    loadMonitoringData();
  }, []);

  const alerts = useMemo(() => createAlerts(data), [data]);
  const filteredAlerts = alerts.filter((alert) => {
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;

    return matchesType && matchesStatus;
  });

  const summary = useMemo(() => {
    const expiringPrograms = getExpiringPrograms(data.milesPrograms, { includeOverdue: false });

    return {
      activeTickets: data.tickets.filter((ticket) => activeTicketStatuses.has(ticket.status)).length,
      pendingSales: data.sales.filter((sale) => pendingSaleStatuses.has(sale.status)).length,
      expiringMiles: expiringPrograms.length,
      pendingTransfers: data.milesTransfers.filter((transfer) => transfer.status === 'pending').length
    };
  }, [data]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Monitoramento"
          description="Alertas operacionais baseados nos dados autenticados da conta."
          badge="Supabase RLS"
        />
        <Button className="w-full sm:w-auto" disabled={isLoading} onClick={loadMonitoringData}>
          <RefreshCw size={16} aria-hidden="true" />
          Atualizar
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Bilhetes ativos" value={summary.activeTickets} helper="Confirmados, pendentes ou emitidos" />
        <SummaryCard label="Vendas pendentes" value={summary.pendingSales} helper="Orcamento ou aguardando pagamento" />
        <SummaryCard label="Milhas vencendo 90d" value={summary.expiringMiles} helper="Programas ativos com validade proxima" />
        <SummaryCard label="Transferencias pendentes" value={summary.pendingTransfers} helper="Operacoes ainda nao concluidas" />
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink-900">Alertas operacionais</h2>
              <p className="mt-1 text-sm text-ink-500">
                {isLoading ? 'Carregando alertas.' : `${filteredAlerts.length} alertas exibidos.`}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label>
                <span className="sr-only">Tipo de alerta</span>
                <select
                  className={fieldClass}
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as AlertType | 'all')}
                >
                  {Object.entries(alertTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Status do alerta</span>
                <select
                  className={fieldClass}
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as AlertStatus | 'all')}
                >
                  {Object.entries(alertStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 text-center">
              <div>
                <p className="text-sm font-semibold text-ink-900">Nenhum alerta encontrado</p>
                <p className="mt-1 text-sm text-ink-500">Ajuste os filtros ou atualize os dados.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
              {filteredAlerts.map((alert) => (
                <div
                  className="grid gap-4 px-4 py-4 text-sm lg:grid-cols-[auto_1fr_auto] lg:items-center"
                  key={alert.id}
                >
                  <div className="hidden size-10 place-items-center rounded-lg bg-amber-50 text-amber-700 lg:grid">
                    <AlertTriangle size={18} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink-900">{alert.title}</p>
                      <Badge tone={alertStatusTone[alert.status]}>{alertStatusLabels[alert.status]}</Badge>
                      <Badge tone="slate">{alertTypeLabels[alert.type]}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-700">{alert.detail}</p>
                    <p className="mt-1 text-xs text-ink-500">{alert.helper}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => navigate(alert.route)}>
                    Abrir
                    <ArrowRight size={14} aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  helper: string;
};

function SummaryCard({ label, value, helper }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        <p className="mt-3 text-2xl font-semibold text-ink-900">{value}</p>
        <p className="mt-1 text-sm text-ink-500">{helper}</p>
      </CardContent>
    </Card>
  );
}

function createAlerts(data: MonitoringData): OperationalAlert[] {
  const alerts: OperationalAlert[] = [
    ...getExpiringPrograms(data.milesPrograms, { includeOverdue: true }).map((program) => {
      const expiration = program.expiration_date ? new Date(`${program.expiration_date}T00:00:00`) : null;
      const isOverdue = expiration ? expiration < startOfToday() : false;

      return {
        id: `miles-${program.id}`,
        type: 'miles' as const,
        status: isOverdue ? ('overdue' as const) : ('upcoming' as const),
        title: `${program.program_name} com milhas ${isOverdue ? 'vencidas' : 'a vencer'}`,
        detail: `${formatNumber(program.balance)} milhas de ${program.account_holder || 'titular nao informado'}.`,
        helper: `Validade: ${formatDate(program.expiration_date)}.`,
        route: '/platform/miles-management',
        updatedAt: program.expiration_date ?? program.updated_at
      };
    }),
    ...data.sales
      .filter((sale) => pendingSaleStatuses.has(sale.status))
      .map((sale) => ({
        id: `sale-${sale.id}`,
        type: 'sale' as const,
        status: 'pending' as const,
        title: `Venda pendente para ${sale.customer_name}`,
        detail: `${sale.origin ?? '--'} > ${sale.destination ?? '--'} - ${formatCurrency(sale.sale_amount)}.`,
        helper: `Status: ${formatStatus(sale.status)}${sale.ticket_locator ? ` - Localizador ${sale.ticket_locator}` : ''}.`,
        route: '/platform/emissions/sales',
        updatedAt: sale.updated_at
      })),
    ...data.milesTransfers
      .filter((transfer) => transfer.status === 'pending')
      .map((transfer) => ({
        id: `transfer-${transfer.id}`,
        type: 'transfer' as const,
        status: 'pending' as const,
        title: 'Transferencia de milhas pendente',
        detail: `${formatNumber(transfer.quantity)} milhas solicitadas, ${formatNumber(transfer.final_quantity)} finais.`,
        helper: `Data da transferencia: ${formatDate(transfer.transfer_date)}.`,
        route: '/platform/miles-transfer',
        updatedAt: transfer.updated_at
      })),
    ...data.tickets
      .filter((ticket) => ticket.status !== 'emitido')
      .map((ticket) => ({
        id: `ticket-${ticket.id}`,
        type: 'ticket' as const,
        status: ticket.status === 'cancelado' ? ('cancelled' as const) : ('pending' as const),
        title: `Bilhete ${ticket.locator} ${ticket.status === 'cancelado' ? 'cancelado' : 'nao emitido'}`,
        detail: `${ticket.passenger_name} ${ticket.passenger_surname} - ${ticket.origin} > ${ticket.destination}.`,
        helper: `${ticket.airline} - embarque ${formatDate(ticket.departure_date)}.`,
        route: '/platform/tickets',
        updatedAt: ticket.updated_at
      })),
    ...data.milesPurchases
      .filter((purchase) => purchase.status === 'pending')
      .map((purchase) => ({
        id: `purchase-${purchase.id}`,
        type: 'purchase' as const,
        status: 'pending' as const,
        title: 'Compra de milhas pendente',
        detail: `${formatNumber(purchase.quantity)} milhas - custo total ${formatCurrency(purchase.total_cost)}.`,
        helper: `Data da compra: ${formatDate(purchase.purchase_date)}.`,
        route: '/platform/miles-purchases',
        updatedAt: purchase.updated_at
      }))
  ];

  return alerts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function getExpiringPrograms(programs: MilesProgramRow[], options: { includeOverdue: boolean }) {
  const today = startOfToday();
  const limit = new Date(today);
  limit.setDate(limit.getDate() + 90);

  return programs.filter((program) => {
    if (program.status !== 'active' || !program.expiration_date) {
      return false;
    }

    const expiration = new Date(`${program.expiration_date}T00:00:00`);
    if (!options.includeOverdue && expiration < today) {
      return false;
    }

    return expiration <= limit;
  });
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function formatNumber(value: number | string) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value) || 0);
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Sem data';
  }

  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(normalizedValue));
}

function formatStatus(value: string) {
  return value.replace(/_/g, ' ');
}

const fieldClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-50';
