import { ArrowRight, Bell, RefreshCw } from 'lucide-react';
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

type NotificationsData = {
  tickets: TicketRow[];
  sales: SaleRow[];
  milesPrograms: MilesProgramRow[];
  milesTransfers: MilesTransferRow[];
  milesPurchases: MilesPurchaseRow[];
};

type NotificationType = 'miles' | 'sale' | 'transfer' | 'purchase' | 'ticket';
type NotificationPriority = 'critical' | 'pending' | 'informative';
type NotificationStatus = 'upcoming' | 'overdue' | 'pending' | 'cancelled';

type OperationalNotification = {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  description: string;
  date: string;
  route: string;
};

const emptyData: NotificationsData = {
  tickets: [],
  sales: [],
  milesPrograms: [],
  milesTransfers: [],
  milesPurchases: []
};

const typeLabels: Record<NotificationType | 'all', string> = {
  all: 'Todos os tipos',
  miles: 'Milhas',
  sale: 'Vendas',
  transfer: 'Transferencias',
  purchase: 'Compras',
  ticket: 'Bilhetes'
};

const priorityLabels: Record<NotificationPriority | 'all', string> = {
  all: 'Todas as prioridades',
  critical: 'Critica',
  pending: 'Pendente',
  informative: 'Informativa'
};

const statusLabels: Record<NotificationStatus | 'all', string> = {
  all: 'Todos os status',
  upcoming: 'Vencendo',
  overdue: 'Vencido',
  pending: 'Pendente',
  cancelled: 'Cancelado'
};

const priorityTone: Record<NotificationPriority, 'green' | 'blue' | 'slate' | 'amber'> = {
  critical: 'amber',
  pending: 'blue',
  informative: 'slate'
};

const pendingSaleStatuses = new Set(['orcamento', 'aguardando_pagamento']);

export function NotificationsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<NotificationsData>(emptyData);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | 'all'>('all');

  async function loadNotificationsData() {
    if (!hasSupabaseConfig || !supabase) {
      setData(emptyData);
      setError('Nao foi possivel carregar notificacoes.');
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
      setError('Usuario autenticado nao encontrado para carregar notificacoes.');
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
        .select('id, program_name, balance, account_holder, expiration_date, status, updated_at')
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
      setError(`Nao foi possivel carregar notificacoes: ${queryError.message}`);
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
    loadNotificationsData();
  }, []);

  const notifications = useMemo(() => createNotifications(data), [data]);
  const filteredNotifications = notifications.filter((notification) => {
    const matchesPriority =
      priorityFilter === 'all' || notification.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter;

    return matchesPriority && matchesType && matchesStatus;
  });
  const summary = useMemo(
    () => ({
      total: notifications.length,
      critical: notifications.filter((notification) => notification.priority === 'critical').length,
      pending: notifications.filter((notification) => notification.priority === 'pending').length,
      informative: notifications.filter((notification) => notification.priority === 'informative').length
    }),
    [notifications]
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Notificacoes"
          description="Central operacional gerada a partir dos dados da conta."
        />
        <Button className="w-full sm:w-auto" disabled={isLoading} onClick={loadNotificationsData}>
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
        <SummaryCard label="Total" value={summary.total} helper="Notificacoes geradas" />
        <SummaryCard label="Criticas" value={summary.critical} helper="Exigem atencao imediata" />
        <SummaryCard label="Pendentes" value={summary.pending} helper="Aguardam acao operacional" />
        <SummaryCard label="Informativas" value={summary.informative} helper="Acompanhamento preventivo" />
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink-900">Lista de notificacoes</h2>
              <p className="mt-1 text-sm text-ink-500">
                {isLoading ? 'Carregando notificacoes.' : `${filteredNotifications.length} notificacoes exibidas.`}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <FilterSelect
                label="Prioridade"
                value={priorityFilter}
                options={priorityLabels}
                onChange={(value) => setPriorityFilter(value as NotificationPriority | 'all')}
              />
              <FilterSelect
                label="Tipo"
                value={typeFilter}
                options={typeLabels}
                onChange={(value) => setTypeFilter(value as NotificationType | 'all')}
              />
              <FilterSelect
                label="Status"
                value={statusFilter}
                options={statusLabels}
                onChange={(value) => setStatusFilter(value as NotificationStatus | 'all')}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 text-center">
              <div>
                <p className="text-sm font-semibold text-ink-900">Nenhuma notificacao encontrada</p>
                <p className="mt-1 text-sm text-ink-500">Ajuste os filtros ou atualize os dados.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
              {filteredNotifications.map((notification) => (
                <div
                  className="grid gap-4 px-4 py-4 text-sm lg:grid-cols-[auto_1fr_auto] lg:items-center"
                  key={notification.id}
                >
                  <div className="hidden size-10 place-items-center rounded-lg bg-skyway-50 text-skyway-700 lg:grid">
                    <Bell size={18} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink-900">{notification.title}</p>
                      <Badge tone={priorityTone[notification.priority]}>
                        {priorityLabels[notification.priority]}
                      </Badge>
                      <Badge tone="slate">{typeLabels[notification.type]}</Badge>
                      <Badge tone="slate">{statusLabels[notification.status]}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-700">{notification.description}</p>
                    <p className="mt-1 text-xs text-ink-500">
                      Data: {formatDate(notification.date)}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => navigate(notification.route)}>
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

type FilterSelectProps = {
  label: string;
  value: string;
  options: Record<string, string>;
  onChange: (value: string) => void;
};

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {Object.entries(options).map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function createNotifications(data: NotificationsData): OperationalNotification[] {
  const notifications: OperationalNotification[] = [
    ...getExpiringPrograms(data.milesPrograms).map((program) => {
      const days = program.expiration_date ? getDaysUntil(program.expiration_date) : null;
      const isOverdue = typeof days === 'number' && days < 0;
      const isCritical = typeof days === 'number' && days <= 30;

      return {
        id: `miles-${program.id}`,
        type: 'miles' as const,
        priority: isCritical ? ('critical' as const) : ('informative' as const),
        status: isOverdue ? ('overdue' as const) : ('upcoming' as const),
        title: `${program.program_name} com milhas ${isOverdue ? 'vencidas' : 'a vencer'}`,
        description: `${formatNumber(program.balance)} milhas de ${program.account_holder || 'titular nao informado'} vencem em ${formatDate(program.expiration_date)}.`,
        date: program.expiration_date ?? program.updated_at,
        route: '/platform/miles-management'
      };
    }),
    ...data.sales
      .filter((sale) => pendingSaleStatuses.has(sale.status))
      .map((sale) => ({
        id: `sale-${sale.id}`,
        type: 'sale' as const,
        priority: 'pending' as const,
        status: 'pending' as const,
        title: `Venda pendente para ${sale.customer_name}`,
        description: `${sale.origin ?? '--'} > ${sale.destination ?? '--'} por ${formatCurrency(sale.sale_amount)}. Status: ${formatStatus(sale.status)}${sale.ticket_locator ? `, localizador ${sale.ticket_locator}` : ''}.`,
        date: sale.updated_at,
        route: '/platform/emissions/sales'
      })),
    ...data.milesTransfers
      .filter((transfer) => transfer.status === 'pending')
      .map((transfer) => ({
        id: `transfer-${transfer.id}`,
        type: 'transfer' as const,
        priority: 'pending' as const,
        status: 'pending' as const,
        title: 'Transferencia de milhas pendente',
        description: `${formatNumber(transfer.quantity)} milhas solicitadas, ${formatNumber(transfer.final_quantity)} milhas finais.`,
        date: transfer.transfer_date,
        route: '/platform/miles-transfer'
      })),
    ...data.milesPurchases
      .filter((purchase) => purchase.status === 'pending')
      .map((purchase) => ({
        id: `purchase-${purchase.id}`,
        type: 'purchase' as const,
        priority: 'pending' as const,
        status: 'pending' as const,
        title: 'Compra de milhas pendente',
        description: `${formatNumber(purchase.quantity)} milhas registradas com custo total de ${formatCurrency(purchase.total_cost)}.`,
        date: purchase.purchase_date,
        route: '/platform/miles-purchases'
      })),
    ...data.tickets
      .filter((ticket) => ticket.status !== 'emitido')
      .map((ticket) => ({
        id: `ticket-${ticket.id}`,
        type: 'ticket' as const,
        priority: ticket.status === 'cancelado' ? ('critical' as const) : ('pending' as const),
        status: ticket.status === 'cancelado' ? ('cancelled' as const) : ('pending' as const),
        title: `Bilhete ${ticket.locator} ${ticket.status === 'cancelado' ? 'cancelado' : 'nao emitido'}`,
        description: `${ticket.passenger_name} ${ticket.passenger_surname}, ${ticket.airline}, ${ticket.origin} > ${ticket.destination}.`,
        date: ticket.departure_date,
        route: '/platform/tickets'
      }))
  ];

  return notifications.sort((a, b) => b.date.localeCompare(a.date));
}

function getExpiringPrograms(programs: MilesProgramRow[]) {
  const today = startOfToday();
  const limit = new Date(today);
  limit.setDate(limit.getDate() + 90);

  return programs.filter((program) => {
    if (program.status !== 'active' || !program.expiration_date) {
      return false;
    }

    const expiration = new Date(`${program.expiration_date}T00:00:00`);
    return expiration <= limit;
  });
}

function getDaysUntil(value: string) {
  const today = startOfToday().getTime();
  const date = new Date(`${value}T00:00:00`).getTime();

  return Math.ceil((date - today) / 86_400_000);
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
