import { Building2, Pencil, Plus, Search, Trash2, UserCheck, UserX, X } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { cn } from '../lib/cn';
import { supplierRepository } from '../services/suppliers/supabaseSupplierRepository';
import {
  supplierStatusLabels,
  supplierTypeLabels,
  type Supplier,
  type SupplierInput,
  type SupplierStatus,
  type SupplierType
} from '../types/supplier';

type SupplierStatusFilter = SupplierStatus | 'todos';
type SupplierTypeFilter = SupplierType | 'todos';

const supplierTypes = Object.keys(supplierTypeLabels) as SupplierType[];
const emptySupplierForm: SupplierInput = {
  name: '',
  type: 'companhia_aerea',
  document: '',
  email: '',
  phone: '',
  whatsapp: '',
  notes: '',
  status: 'ativo'
};

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SupplierStatusFilter>('todos');
  const [type, setType] = useState<SupplierTypeFilter>('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    refreshSuppliers();
  }, []);

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [supplier.name, supplier.document]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesStatus = status === 'todos' || supplier.status === status;
      const matchesType = type === 'todos' || supplier.type === type;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [search, status, suppliers, type]);

  async function refreshSuppliers() {
    setIsLoading(true);
    setError(null);

    try {
      const records = await supplierRepository.listSuppliers();
      setSuppliers(records);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Erro ao listar fornecedores.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleNewSupplier() {
    setEditingSupplier(null);
    setIsModalOpen(true);
  }

  async function handleSaveSupplier(values: SupplierInput) {
    setError(null);

    try {
      if (editingSupplier) {
        const updatedSupplier = await supplierRepository.updateSupplier(editingSupplier.id, values);
        setMessage(
          updatedSupplier
            ? `Fornecedor ${updatedSupplier.name} atualizado.`
            : `Fornecedor ${editingSupplier.name} nao encontrado para atualizacao.`
        );
      } else {
        const createdSupplier = await supplierRepository.createSupplier(values);
        setMessage(`Fornecedor ${createdSupplier.name} criado.`);
      }

      setIsModalOpen(false);
      setEditingSupplier(null);
      await refreshSuppliers();
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Erro ao salvar fornecedor.');
    }
  }

  async function handleDeleteSupplier(supplier: Supplier) {
    const confirmed = window.confirm(`Excluir o fornecedor ${supplier.name}?`);

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await supplierRepository.deleteSupplier(supplier.id);
      setMessage(`Fornecedor ${supplier.name} excluido.`);
      await refreshSuppliers();
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Erro ao excluir fornecedor.');
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Fornecedores"
          description="Cadastro e acompanhamento de fornecedores da operacao."
          badge="Supabase"
        />
        <Button className="w-full sm:w-auto sm:shrink-0" onClick={handleNewSupplier}>
          <Plus size={16} aria-hidden="true" />
          Novo fornecedor
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          {message}
        </div>
      ) : null}

      <SupplierSummaryCards suppliers={suppliers} />

      <SupplierFilters
        search={search}
        status={status}
        type={type}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onTypeChange={setType}
      />

      {isLoading ? (
        <Card>
          <CardContent>
            <div className="flex min-h-48 items-center justify-center text-sm font-semibold text-ink-500">
              Carregando fornecedores...
            </div>
          </CardContent>
        </Card>
      ) : filteredSuppliers.length > 0 ? (
        <SupplierTable
          suppliers={filteredSuppliers}
          onDelete={handleDeleteSupplier}
          onEdit={(supplier) => {
            setEditingSupplier(supplier);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              title="Nenhum fornecedor encontrado"
              description="Ajuste os filtros ou cadastre um novo fornecedor."
              actionLabel="Novo fornecedor"
              icon={Building2}
            />
          </CardContent>
        </Card>
      )}

      <SupplierModal
        isOpen={isModalOpen}
        supplier={editingSupplier}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSupplier(null);
        }}
        onSave={handleSaveSupplier}
      />
    </section>
  );
}

type SupplierSummaryCardsProps = {
  suppliers: Supplier[];
};

function SupplierSummaryCards({ suppliers }: SupplierSummaryCardsProps) {
  const activeSuppliers = suppliers.filter((supplier) => supplier.status === 'ativo').length;
  const inactiveSuppliers = suppliers.filter((supplier) => supplier.status === 'inativo').length;

  const cards = [
    {
      label: 'Total',
      value: suppliers.length,
      helper: 'Fornecedores cadastrados',
      icon: Building2
    },
    {
      label: 'Ativos',
      value: activeSuppliers,
      helper: 'Disponiveis para operacao',
      icon: UserCheck
    },
    {
      label: 'Inativos',
      value: inactiveSuppliers,
      helper: 'Fora da operacao atual',
      icon: UserX
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-500">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold text-ink-900">{card.value}</p>
                <p className="mt-1 text-sm text-ink-500">{card.helper}</p>
              </div>
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <card.icon size={20} aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

type SupplierFiltersProps = {
  search: string;
  status: SupplierStatusFilter;
  type: SupplierTypeFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: SupplierStatusFilter) => void;
  onTypeChange: (value: SupplierTypeFilter) => void;
};

function SupplierFilters({
  search,
  status,
  type,
  onSearchChange,
  onStatusChange,
  onTypeChange
}: SupplierFiltersProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <label className="relative block w-full lg:max-w-md">
          <span className="sr-only">Buscar fornecedores</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
            aria-hidden="true"
          />
          <input
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-ink-900 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nome ou documento"
            type="search"
          />
        </label>

        <div className="grid gap-3 xl:grid-cols-2">
          <FilterGroup label="Status">
            {[
              { label: 'Todos', value: 'todos' as const },
              { label: 'Ativos', value: 'ativo' as const },
              { label: 'Inativos', value: 'inativo' as const }
            ].map((option) => (
              <FilterButton
                isActive={status === option.value}
                key={option.value}
                onClick={() => onStatusChange(option.value)}
              >
                {option.label}
              </FilterButton>
            ))}
          </FilterGroup>

          <FilterGroup label="Tipo">
            <FilterButton isActive={type === 'todos'} onClick={() => onTypeChange('todos')}>
              Todos
            </FilterButton>
            {supplierTypes.map((supplierType) => (
              <FilterButton
                isActive={type === supplierType}
                key={supplierType}
                onClick={() => onTypeChange(supplierType)}
              >
                {supplierTypeLabels[supplierType]}
              </FilterButton>
            ))}
          </FilterGroup>
        </div>
      </CardContent>
    </Card>
  );
}

type FilterGroupProps = {
  children: ReactNode;
  label: string;
};

function FilterGroup({ children, label }: FilterGroupProps) {
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

type SupplierTableProps = {
  suppliers: Supplier[];
  onDelete: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
};

function SupplierTable({ suppliers, onDelete, onEdit }: SupplierTableProps) {
  return (
    <>
      <div className="space-y-3 lg:hidden">
        <div>
          <h2 className="text-base font-semibold text-ink-900">Lista de fornecedores</h2>
          <p className="text-sm text-ink-500">{suppliers.length} fornecedores encontrados</p>
        </div>
        {suppliers.map((supplier) => (
          <SupplierMobileCard
            key={supplier.id}
            supplier={supplier}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>

      <Card className="hidden lg:block">
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Lista de fornecedores</h2>
          <p className="text-sm text-ink-500">{suppliers.length} fornecedores encontrados</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-3">Fornecedor</th>
                  <th className="px-3 py-3">Contato</th>
                  <th className="px-3 py-3">Tipo</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Observacoes</th>
                  <th className="px-3 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((supplier) => (
                  <tr className="align-top transition hover:bg-slate-50" key={supplier.id}>
                    <td className="px-3 py-4">
                      <p className="font-semibold text-ink-900">{supplier.name}</p>
                      <p className="mt-1 text-sm text-ink-500">{supplier.document || 'Sem documento'}</p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-sm text-ink-700">{supplier.email || 'Sem email'}</p>
                      <p className="mt-1 text-sm text-ink-500">{supplier.phone || 'Sem telefone'}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        WhatsApp: {supplier.whatsapp || 'Nao informado'}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-sm text-ink-700">
                      {supplierTypeLabels[supplier.type] ?? supplier.type}
                    </td>
                    <td className="px-3 py-4">
                      <SupplierStatusBadge status={supplier.status} />
                    </td>
                    <td className="max-w-64 px-3 py-4 text-sm leading-5 text-ink-700">
                      {supplier.notes || 'Sem observacoes.'}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          aria-label={`Editar ${supplier.name}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(supplier)}
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </Button>
                        <Button
                          aria-label={`Excluir ${supplier.name}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(supplier)}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

type SupplierMobileCardProps = {
  onDelete: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
  supplier: Supplier;
};

function SupplierMobileCard({ supplier, onDelete, onEdit }: SupplierMobileCardProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-ink-900">{supplier.name}</p>
            <p className="mt-1 text-sm text-ink-500">
              {supplierTypeLabels[supplier.type] ?? supplier.type}
            </p>
          </div>
          <SupplierStatusBadge status={supplier.status} />
        </div>
        <div className="grid gap-2 text-sm text-ink-600">
          <p>{supplier.document || 'Sem documento'}</p>
          <p>{supplier.email || 'Sem email'}</p>
          <p>{supplier.phone || 'Sem telefone'}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => onEdit(supplier)}>
            <Pencil size={16} aria-hidden="true" />
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(supplier)}>
            <Trash2 size={16} aria-hidden="true" />
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierStatusBadge({ status }: { status: SupplierStatus }) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center rounded-full px-3 text-xs font-semibold',
        status === 'ativo'
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
          : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
      )}
    >
      {supplierStatusLabels[status]}
    </span>
  );
}

type SupplierModalProps = {
  isOpen: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onSave: (values: SupplierInput) => Promise<void>;
};

function SupplierModal({ isOpen, supplier, onClose, onSave }: SupplierModalProps) {
  const [values, setValues] = useState<SupplierInput>(emptySupplierForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setValues(
      supplier
        ? {
            name: supplier.name,
            type: supplier.type,
            document: supplier.document,
            email: supplier.email,
            phone: supplier.phone,
            whatsapp: supplier.whatsapp,
            notes: supplier.notes,
            status: supplier.status
          }
        : emptySupplierForm
    );
  }, [isOpen, supplier]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      await onSave({
        ...values,
        name: values.name.trim(),
        document: values.document.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        whatsapp: values.whatsapp.trim(),
        notes: values.notes.trim()
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        aria-label="Fechar formulario"
        className="absolute inset-0 bg-slate-950/45"
        type="button"
        onClick={onClose}
      />
      <form
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">
              {supplier ? 'Editar fornecedor' : 'Novo fornecedor'}
            </h2>
            <p className="mt-1 text-sm text-ink-500">Dados basicos, contato e status.</p>
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

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <Field label="Nome" className="sm:col-span-2">
            <input
              className={inputClassName}
              required
              value={values.name}
              onChange={(event) => setValues({ ...values, name: event.target.value })}
            />
          </Field>
          <Field label="Tipo">
            <select
              className={inputClassName}
              value={values.type}
              onChange={(event) =>
                setValues({ ...values, type: event.target.value as SupplierType })
              }
            >
              {supplierTypes.map((supplierType) => (
                <option key={supplierType} value={supplierType}>
                  {supplierTypeLabels[supplierType]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className={inputClassName}
              value={values.status}
              onChange={(event) =>
                setValues({ ...values, status: event.target.value as SupplierStatus })
              }
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </Field>
          <Field label="Documento">
            <input
              className={inputClassName}
              value={values.document}
              onChange={(event) => setValues({ ...values, document: event.target.value })}
            />
          </Field>
          <Field label="Email">
            <input
              className={inputClassName}
              type="email"
              value={values.email}
              onChange={(event) => setValues({ ...values, email: event.target.value })}
            />
          </Field>
          <Field label="Telefone">
            <input
              className={inputClassName}
              value={values.phone}
              onChange={(event) => setValues({ ...values, phone: event.target.value })}
            />
          </Field>
          <Field label="WhatsApp">
            <input
              className={inputClassName}
              value={values.whatsapp}
              onChange={(event) => setValues({ ...values, whatsapp: event.target.value })}
            />
          </Field>
          <Field label="Observacoes" className="sm:col-span-2">
            <textarea
              className={cn(inputClassName, 'min-h-24 py-3')}
              value={values.notes}
              onChange={(event) => setValues({ ...values, notes: event.target.value })}
            />
          </Field>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar fornecedor'}
          </Button>
        </div>
      </form>
    </div>
  );
}

type FieldProps = {
  children: ReactNode;
  className?: string;
  label: string;
};

function Field({ children, className, label }: FieldProps) {
  return (
    <label className={cn('block', className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClassName =
  'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-50';
