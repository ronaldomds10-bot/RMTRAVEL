import {
  Edit,
  Eye,
  FileText,
  MessageCircle,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { tickets as mockTickets } from '../data/tickets';
import { formatCurrency } from '../lib/formatters';
import * as customerRepository from '../services/customers/customerRepository';
import * as localTicketRepository from '../services/tickets/ticketRepository';
import * as saleRepository from '../services/sales/saleRepository';
import type { CustomerRecord } from '../types/customer';
import type { Ticket } from '../types/ticket';
import type { Sale, SaleInput, SalePaymentMethod, SaleStatus } from '../types/sale';

type TicketOption = {
  id: string;
  label: string;
  origin: string;
  destination: string;
  amount: number;
};

const saleStatusLabels: Record<SaleStatus, string> = {
  orcamento: 'Orcamento',
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  emitido: 'Emitido',
  cancelado: 'Cancelado'
};

const saleStatusTone: Record<SaleStatus, 'green' | 'blue' | 'amber' | 'slate'> = {
  orcamento: 'slate',
  aguardando_pagamento: 'amber',
  pago: 'green',
  emitido: 'blue',
  cancelado: 'slate'
};

const statusOptions = Object.keys(saleStatusLabels) as SaleStatus[];
const paymentOptions: SalePaymentMethod[] = ['Pix', 'Cartao', 'Boleto', 'Transferencia', 'Dinheiro'];

export function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [ticketOptions, setTicketOptions] = useState<TicketOption[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  async function refreshData() {
    const [saleRecords, customerRecords, savedTickets] = await Promise.all([
      saleRepository.listSales(),
      customerRepository.listCustomers(),
      localTicketRepository.listTickets()
    ]);

    setSales(saleRecords);
    setCustomers(customerRecords);
    setTicketOptions(toTicketOptions([...mockTickets, ...savedTickets]));
  }

  const summary = useMemo(() => {
    const activeSales = sales.filter((sale) => sale.status !== 'cancelado');
    const paidSales = sales.filter((sale) => sale.status === 'pago' || sale.status === 'emitido');
    const pendingSales = sales.filter(
      (sale) => sale.status === 'orcamento' || sale.status === 'aguardando_pagamento'
    );

    return {
      totalSold: activeSales.reduce((total, sale) => total + sale.saleAmount, 0),
      estimatedProfit: activeSales.reduce((total, sale) => total + sale.profitAmount, 0),
      paidCount: paidSales.length,
      pendingCount: pendingSales.length
    };
  }, [sales]);

  async function handleCreateSale(input: SaleInput) {
    const record = await saleRepository.createSale(input);
    await refreshData();
    setIsCreateModalOpen(false);
    setMessage(`Venda ${record.id} criada.`);
  }

  async function handleUpdateSale(input: SaleInput) {
    if (!editingSale) {
      return;
    }

    const record = await saleRepository.updateSale(editingSale.id, input);
    await refreshData();
    setEditingSale(null);

    if (record) {
      setViewingSale((current) => (current?.id === record.id ? record : current));
      setMessage(`Venda ${record.id} atualizada.`);
      return;
    }

    setMessage(`Nao foi possivel atualizar a venda ${editingSale.id}.`);
  }

  async function handleDeleteSale(sale: Sale) {
    const confirmed = window.confirm(`Excluir a venda ${sale.id} de ${sale.customerName}?`);

    if (!confirmed) {
      return;
    }

    const deleted = await saleRepository.deleteSale(sale.id);
    await refreshData();
    setViewingSale((current) => (current?.id === sale.id ? null : current));
    setEditingSale((current) => (current?.id === sale.id ? null : current));
    setMessage(deleted ? `Venda ${sale.id} excluida.` : `Venda ${sale.id} nao encontrada.`);
  }

  function handleWhatsApp(sale: Sale) {
    const text = [
      `Ola, ${sale.customerName}.`,
      `Resumo da venda ${sale.id}: ${sale.origin} > ${sale.destination}.`,
      `Valor: ${formatCurrency(sale.saleAmount)}.`,
      `Status: ${saleStatusLabels[sale.status]}.`
    ].join('\n');

    window.open(
      `https://wa.me/${sale.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  function handleGenerateSummary(sale: Sale) {
    const summaryText = [
      `Venda ${sale.id}`,
      `Cliente: ${sale.customerName}`,
      `Bilhete: ${sale.ticketLabel}`,
      `Trecho: ${sale.origin} > ${sale.destination}`,
      `Custo: ${formatCurrency(sale.costAmount)}`,
      `Venda: ${formatCurrency(sale.saleAmount)}`,
      `Lucro: ${formatCurrency(sale.profitAmount)}`,
      `Pagamento: ${sale.paymentMethod}`,
      `Status: ${saleStatusLabels[sale.status]}`,
      `Observacoes: ${sale.notes || 'Sem observacoes'}`
    ].join('\n');

    window.alert(summaryText);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Vendas"
          description="Registro local de vendas vinculando clientes e bilhetes existentes."
          badge="Repository local"
        />
        <Button className="w-full sm:w-auto" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={16} aria-hidden="true" />
          Nova venda
        </Button>
      </div>

      {message ? (
        <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          {message}
        </div>
      ) : null}

      <SalesSummaryCards summary={summary} />

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Vendas registradas</h2>
          <p className="text-sm text-ink-500">{sales.length} vendas no repository local.</p>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 text-center">
              <div>
                <p className="text-sm font-semibold text-ink-900">Nenhuma venda registrada</p>
                <p className="mt-1 text-sm text-ink-500">Crie uma venda para iniciar o acompanhamento.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="hidden grid-cols-[1fr_0.8fr_0.8fr_0.8fr_0.8fr_1.1fr] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid">
                <span>Cliente</span>
                <span>Trecho</span>
                <span>Venda</span>
                <span>Lucro</span>
                <span>Status</span>
                <span>Acoes</span>
              </div>
              <div className="divide-y divide-slate-200">
                {sales.map((sale) => (
                  <div
                    className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[1fr_0.8fr_0.8fr_0.8fr_0.8fr_1.1fr] lg:items-center"
                    key={sale.id}
                  >
                    <div>
                      <p className="font-semibold text-ink-900">{sale.customerName}</p>
                      <p className="mt-1 text-xs text-ink-500">{sale.ticketLabel}</p>
                    </div>
                    <p className="font-semibold text-ink-900">
                      {sale.origin} &gt; {sale.destination}
                    </p>
                    <p className="text-ink-700">{formatCurrency(sale.saleAmount)}</p>
                    <p className={sale.profitAmount >= 0 ? 'font-semibold text-brand-700' : 'font-semibold text-red-600'}>
                      {formatCurrency(sale.profitAmount)}
                    </p>
                    <div>
                      <Badge tone={saleStatusTone[sale.status]}>{saleStatusLabels[sale.status]}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setViewingSale(sale)}>
                        <Eye size={14} aria-hidden="true" />
                        Ver
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingSale(sale)}>
                        <Edit size={14} aria-hidden="true" />
                        Editar
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleWhatsApp(sale)}>
                        <MessageCircle size={14} aria-hidden="true" />
                        WhatsApp
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleGenerateSummary(sale)}>
                        <FileText size={14} aria-hidden="true" />
                        Resumo
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteSale(sale)}>
                        <Trash2 size={14} aria-hidden="true" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SaleModal
        customers={customers}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateSale}
        ticketOptions={ticketOptions}
        title="Nova venda"
      />

      <SaleModal
        customers={customers}
        initialSale={editingSale}
        isOpen={Boolean(editingSale)}
        onClose={() => setEditingSale(null)}
        onSave={handleUpdateSale}
        ticketOptions={ticketOptions}
        title="Editar venda"
      />

      {viewingSale ? (
        <SaleViewModal
          sale={viewingSale}
          onClose={() => setViewingSale(null)}
          onEdit={() => {
            setEditingSale(viewingSale);
            setViewingSale(null);
          }}
          onDelete={() => handleDeleteSale(viewingSale)}
          onSummary={() => handleGenerateSummary(viewingSale)}
          onWhatsApp={() => handleWhatsApp(viewingSale)}
        />
      ) : null}
    </section>
  );
}

type SalesSummaryCardsProps = {
  summary: {
    totalSold: number;
    estimatedProfit: number;
    paidCount: number;
    pendingCount: number;
  };
};

function SalesSummaryCards({ summary }: SalesSummaryCardsProps) {
  const cards = [
    { label: 'Total vendido', value: formatCurrency(summary.totalSold), helper: 'Sem canceladas' },
    { label: 'Lucro estimado', value: formatCurrency(summary.estimatedProfit), helper: 'Venda - custo' },
    { label: 'Vendas pagas', value: String(summary.paidCount), helper: 'Pago ou emitido' },
    { label: 'Pendentes', value: String(summary.pendingCount), helper: 'Orcamento ou pagamento' }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-ink-500">{card.label}</p>
            <p className="mt-3 text-2xl font-semibold text-ink-900">{card.value}</p>
            <p className="mt-1 text-sm text-ink-500">{card.helper}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

type SaleModalProps = {
  customers: CustomerRecord[];
  initialSale?: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (sale: SaleInput) => Promise<void>;
  ticketOptions: TicketOption[];
  title: string;
};

function SaleModal({
  customers,
  initialSale,
  isOpen,
  onClose,
  onSave,
  ticketOptions,
  title
}: SaleModalProps) {
  const [form, setForm] = useState<SaleInput>(() =>
    initialSale ? toSaleInput(initialSale) : createEmptySaleInput(customers[0], ticketOptions[0])
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm(initialSale ? toSaleInput(initialSale) : createEmptySaleInput(customers[0], ticketOptions[0]));
    setIsSubmitting(false);
  }, [customers, initialSale, isOpen, ticketOptions]);

  if (!isOpen) {
    return null;
  }

  const profitAmount = Number(form.saleAmount || 0) - Number(form.costAmount || 0);
  const canSubmit =
    form.customerId &&
    form.ticketId &&
    form.origin.trim() &&
    form.destination.trim() &&
    Number.isFinite(Number(form.costAmount)) &&
    Number.isFinite(Number(form.saleAmount)) &&
    !isSubmitting;

  function updateCustomer(customerId: string) {
    const customer = customers.find((item) => item.id === customerId);

    setForm((current) => ({
      ...current,
      customerId,
      customerName: customer?.personal.fullName ?? '',
      customerPhone: customer?.contact.phone ?? ''
    }));
  }

  function updateTicket(ticketId: string) {
    const ticket = ticketOptions.find((item) => item.id === ticketId);

    setForm((current) => ({
      ...current,
      ticketId,
      ticketLabel: ticket?.label ?? '',
      origin: ticket?.origin ?? current.origin,
      destination: ticket?.destination ?? current.destination,
      costAmount: ticket?.amount ?? current.costAmount,
      saleAmount: current.saleAmount || ticket?.amount || 0
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    await onSave({
      ...form,
      costAmount: Number(form.costAmount),
      saleAmount: Number(form.saleAmount),
      notes: form.notes.trim()
    });
    setIsSubmitting(false);
  }

  return (
    <ModalShell title={title} onClose={onClose}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="text-sm font-semibold text-ink-700">Cliente</span>
            <select
              className={fieldClass}
              value={form.customerId}
              onChange={(event) => updateCustomer(event.target.value)}
            >
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.personal.fullName}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-sm font-semibold text-ink-700">Bilhete</span>
            <select
              className={fieldClass}
              value={form.ticketId}
              onChange={(event) => updateTicket(event.target.value)}
            >
              {ticketOptions.map((ticket) => (
                <option key={ticket.id} value={ticket.id}>
                  {ticket.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-sm font-semibold text-ink-700">Origem</span>
            <input
              className={`${fieldClass} uppercase`}
              value={form.origin}
              onChange={(event) => setForm((current) => ({ ...current, origin: event.target.value.toUpperCase() }))}
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-ink-700">Destino</span>
            <input
              className={`${fieldClass} uppercase`}
              value={form.destination}
              onChange={(event) => setForm((current) => ({ ...current, destination: event.target.value.toUpperCase() }))}
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-ink-700">Valor custo</span>
            <input
              className={fieldClass}
              min="0"
              step="0.01"
              type="number"
              value={form.costAmount}
              onChange={(event) => setForm((current) => ({ ...current, costAmount: Number(event.target.value) }))}
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-ink-700">Valor venda</span>
            <input
              className={fieldClass}
              min="0"
              step="0.01"
              type="number"
              value={form.saleAmount}
              onChange={(event) => setForm((current) => ({ ...current, saleAmount: Number(event.target.value) }))}
            />
          </label>

          <InfoBox label="Lucro" value={formatCurrency(profitAmount)} />

          <label>
            <span className="text-sm font-semibold text-ink-700">Forma de pagamento</span>
            <select
              className={fieldClass}
              value={form.paymentMethod}
              onChange={(event) =>
                setForm((current) => ({ ...current, paymentMethod: event.target.value as SalePaymentMethod }))
              }
            >
              {paymentOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-2">
            <span className="text-sm font-semibold text-ink-700">Status</span>
            <select
              className={fieldClass}
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as SaleStatus }))}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {saleStatusLabels[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-2">
            <span className="text-sm font-semibold text-ink-700">Observacoes</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!canSubmit} type="submit">
            {isSubmitting ? 'Salvando...' : 'Salvar venda'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

type SaleViewModalProps = {
  sale: Sale;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSummary: () => void;
  onWhatsApp: () => void;
};

function SaleViewModal({
  sale,
  onClose,
  onDelete,
  onEdit,
  onSummary,
  onWhatsApp
}: SaleViewModalProps) {
  return (
    <ModalShell title={`Venda ${sale.id}`} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-ink-900">{sale.customerName}</p>
            <p className="mt-1 text-sm text-ink-500">{sale.ticketLabel}</p>
          </div>
          <Badge tone={saleStatusTone[sale.status]}>{saleStatusLabels[sale.status]}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoBox label="Trecho" value={`${sale.origin} > ${sale.destination}`} />
          <InfoBox label="Pagamento" value={sale.paymentMethod} />
          <InfoBox label="Custo" value={formatCurrency(sale.costAmount)} />
          <InfoBox label="Venda" value={formatCurrency(sale.saleAmount)} />
          <InfoBox label="Lucro" value={formatCurrency(sale.profitAmount)} />
          <InfoBox label="Atualizado" value={formatDateTime(sale.updatedAt)} />
        </div>

        <InfoBox label="Observacoes" value={sale.notes || 'Sem observacoes.'} />

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          <Button variant="ghost" onClick={onDelete}>
            <Trash2 size={16} aria-hidden="true" />
            Excluir
          </Button>
          <Button variant="secondary" onClick={onWhatsApp}>
            <MessageCircle size={16} aria-hidden="true" />
            WhatsApp
          </Button>
          <Button variant="secondary" onClick={onSummary}>
            <FileText size={16} aria-hidden="true" />
            Gerar resumo
          </Button>
          <Button onClick={onEdit}>
            <Edit size={16} aria-hidden="true" />
            Editar
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

type ModalShellProps = {
  children: ReactNode;
  onClose: () => void;
  title: string;
};

function ModalShell({ children, onClose, title }: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          <button
            aria-label="Fechar modal"
            className="grid size-9 place-items-center rounded-lg text-ink-500 transition hover:bg-slate-100 hover:text-ink-900"
            type="button"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

type InfoBoxProps = {
  label: string;
  value: string;
};

function InfoBox({ label, value }: InfoBoxProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm leading-6 text-ink-700">{value}</p>
    </div>
  );
}

const fieldClass =
  'mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-50';

function toTicketOptions(tickets: Ticket[]): TicketOption[] {
  const options = tickets.map((ticket) => {
    const firstSegment = ticket.segments[0];
    const lastSegment = ticket.segments[ticket.segments.length - 1] ?? firstSegment;

    return {
      id: ticket.id,
      label: `${ticket.locator} - ${ticket.airline}`,
      origin: firstSegment?.origin.iata ?? '',
      destination: lastSegment?.destination.iata ?? '',
      amount: ticket.amount
    };
  });

  return Array.from(new Map(options.map((option) => [option.id, option])).values());
}

function createEmptySaleInput(customer?: CustomerRecord, ticket?: TicketOption): SaleInput {
  return {
    customerId: customer?.id ?? '',
    customerName: customer?.personal.fullName ?? '',
    customerPhone: customer?.contact.phone ?? '',
    ticketId: ticket?.id ?? '',
    ticketLabel: ticket?.label ?? '',
    origin: ticket?.origin ?? '',
    destination: ticket?.destination ?? '',
    costAmount: ticket?.amount ?? 0,
    saleAmount: ticket?.amount ?? 0,
    paymentMethod: 'Pix',
    status: 'orcamento',
    notes: ''
  };
}

function toSaleInput(sale: Sale): SaleInput {
  return {
    id: sale.id,
    customerId: sale.customerId,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    ticketId: sale.ticketId,
    ticketLabel: sale.ticketLabel,
    origin: sale.origin,
    destination: sale.destination,
    costAmount: sale.costAmount,
    saleAmount: sale.saleAmount,
    paymentMethod: sale.paymentMethod,
    status: sale.status,
    notes: sale.notes
  };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}
