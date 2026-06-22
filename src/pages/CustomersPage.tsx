import { Plus, UsersRound, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CustomerFilters } from '../components/customers/CustomerFilters';
import { CustomerStatusBadge } from '../components/customers/CustomerStatusBadge';
import { CustomerSummaryCards } from '../components/customers/CustomerSummaryCards';
import { CustomerTable } from '../components/customers/CustomerTable';
import {
  NewCustomerModal,
  type CustomerFormValues
} from '../components/customers/NewCustomerModal';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { formatCurrency } from '../lib/formatters';
import { customerRepository } from '../services/customers/customerRepositoryAdapter';
import type { Customer, CustomerRecord, CustomerStatus, CustomerTag } from '../types/customer';

export function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CustomerStatus | 'todos'>('todos');
  const [tag, setTag] = useState<CustomerTag | 'todas'>('todas');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<CustomerRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    refreshCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          customer.personal.fullName,
          customer.personal.documentNumber,
          customer.personal.type,
          customer.contact.email,
          customer.contact.phone,
          customer.address.city,
          customer.address.state,
          customer.travelProfile.nextAction,
          customer.notes
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus = status === 'todos' || customer.travelProfile.status === status;
      const matchesTag = tag === 'todas' || customer.travelProfile.tags.includes(tag);

      return matchesSearch && matchesStatus && matchesTag;
    });
  }, [customers, search, status, tag]);

  async function refreshCustomers() {
    setIsLoading(true);
    const records = await customerRepository.listCustomers();
    setCustomers(records);
    setIsLoading(false);
  }

  function toCustomer(values: CustomerFormValues, existingId = ''): Customer {
    return {
      id: values.id ?? existingId,
      personal: values.personal,
      contact: values.contact,
      address: values.address,
      travelProfile: values.travelProfile,
      financial: values.financial,
      notes: values.notes
    };
  }

  async function handleCreateCustomer(values: CustomerFormValues) {
    const record = await customerRepository.createCustomer(toCustomer(values));
    await refreshCustomers();
    setIsCreateModalOpen(false);
    setMessage(`Cliente ${record.personal.fullName} criado.`);
  }

  async function handleEditCustomer(values: CustomerFormValues) {
    if (!editingCustomer) {
      return;
    }

    const updatedRecord = await customerRepository.updateCustomer(
      editingCustomer.id,
      toCustomer(values, editingCustomer.id)
    );
    await refreshCustomers();
    setEditingCustomer(null);

    if (updatedRecord) {
      setViewingCustomer((current) => (current?.id === updatedRecord.id ? updatedRecord : current));
      setMessage(`Cliente ${updatedRecord.personal.fullName} atualizado.`);
      return;
    }

    setMessage(`Nao foi possivel atualizar ${editingCustomer.personal.fullName}.`);
  }

  async function handleDeleteCustomer(customer: Customer) {
    const confirmed = window.confirm(`Excluir o cliente ${customer.personal.fullName}?`);

    if (!confirmed) {
      return;
    }

    const deleted = await customerRepository.deleteCustomer(customer.id);
    await refreshCustomers();
    setViewingCustomer((current) => (current?.id === customer.id ? null : current));
    setEditingCustomer((current) => (current?.id === customer.id ? null : current));
    setMessage(
      deleted
        ? `Cliente ${customer.personal.fullName} excluido.`
        : `Cliente ${customer.personal.fullName} nao foi encontrado para exclusao.`
    );
  }

  function handleWhatsApp(customer: Customer) {
    const message = [
      `Olá, ${customer.personal.fullName}.`,
      `Aqui é a RMTRAVEL sobre seu atendimento.`,
      `Próxima ação: ${customer.travelProfile.nextAction || 'acompanhar seu cadastro'}.`
    ].join('\n');
    window.open(`https://wa.me/${formatPhoneForWhatsApp(customer.contact.phone)}?text=${encodeURIComponent(message)}`);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Clientes"
          description="Central para consultar clientes, acompanhar pendencias e executar atendimento."
        />
        <Button className="w-full sm:w-auto sm:shrink-0" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={16} aria-hidden="true" />
          Novo cliente
        </Button>
      </div>

      {message ? (
        <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          {message}
        </div>
      ) : null}

      <CustomerSummaryCards customers={customers} />

      <CustomerFilters
        search={search}
        status={status}
        tag={tag}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onTagChange={setTag}
      />

      {isLoading ? (
        <Card>
          <CardContent>
            <div className="flex min-h-48 items-center justify-center text-sm font-semibold text-ink-500">
              Carregando clientes...
            </div>
          </CardContent>
        </Card>
      ) : filteredCustomers.length > 0 ? (
        <CustomerTable
          customers={filteredCustomers}
          onDelete={handleDeleteCustomer}
          onEdit={(customer) => setEditingCustomer(customer as CustomerRecord)}
          onView={(customer) => setViewingCustomer(customer as CustomerRecord)}
          onWhatsApp={handleWhatsApp}
        />
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              title="Nenhum cliente encontrado"
              description="Ajuste a busca ou os filtros para voltar a exibir clientes salvos."
              actionLabel="Revisar filtros"
              icon={UsersRound}
            />
          </CardContent>
        </Card>
      )}

      <NewCustomerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateCustomer}
      />

      <NewCustomerModal
        customer={editingCustomer}
        isOpen={Boolean(editingCustomer)}
        mode="edit"
        onClose={() => setEditingCustomer(null)}
        onSave={handleEditCustomer}
      />

      {viewingCustomer ? (
        <CustomerViewModal
          customer={viewingCustomer}
          onClose={() => setViewingCustomer(null)}
          onDelete={() => handleDeleteCustomer(viewingCustomer)}
          onEdit={() => {
            setEditingCustomer(viewingCustomer);
            setViewingCustomer(null);
          }}
          onWhatsApp={() => handleWhatsApp(viewingCustomer)}
        />
      ) : null}
    </section>
  );
}

type CustomerViewModalProps = {
  customer: CustomerRecord;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onWhatsApp: () => void;
};

function CustomerViewModal({
  customer,
  onClose,
  onDelete,
  onEdit,
  onWhatsApp
}: CustomerViewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        aria-label="Fechar detalhes"
        className="absolute inset-0 bg-slate-950/45"
        type="button"
        onClick={onClose}
      />
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{customer.personal.fullName}</h2>
            <p className="mt-1 text-sm text-ink-500">
              {customer.id} | {customer.personal.type}
            </p>
          </div>
          <button
            aria-label="Fechar"
            className="grid size-9 place-items-center rounded-lg text-ink-500 hover:bg-slate-100"
            type="button"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <CustomerStatusBadge status={customer.travelProfile.status} />
            <span className="text-sm text-ink-500">
              Atualizado em {formatDateTime(customer.updatedAt)}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Documento" value={`${customer.personal.documentType} ${customer.personal.documentNumber}`} />
            <InfoRow label="Contato" value={`${customer.contact.email} | ${customer.contact.phone}`} />
            <InfoRow label="Cidade" value={`${customer.address.city}, ${customer.address.state}`} />
            <InfoRow label="Canal preferido" value={customer.contact.preferredChannel} />
            <InfoRow label="Valor em aberto" value={formatCurrency(customer.financial.openAmount)} />
            <InfoRow
              label="Destinos"
              value={customer.travelProfile.preferredDestinations.join(', ') || 'Nao informado'}
            />
          </div>

          <InfoRow label="Proxima acao" value={customer.travelProfile.nextAction || 'Sem acao definida'} />
          <InfoRow label="Observacoes" value={customer.notes || 'Sem observacoes.'} />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onDelete}>
            Excluir
          </Button>
          <Button variant="secondary" onClick={onWhatsApp}>
            WhatsApp
          </Button>
          <Button onClick={onEdit}>Editar</Button>
        </div>
      </div>
    </div>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm leading-6 text-ink-700">{value}</p>
    </div>
  );
}

function formatPhoneForWhatsApp(phone: string) {
  return phone.replace(/\D/g, '');
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}
