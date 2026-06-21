import { Pencil, Plus, Search, ShoppingCart, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { cn } from '../lib/cn';
import { milesProgramRepository } from '../services/miles/milesProgramRepositoryAdapter';
import { milesPurchaseRepository } from '../services/milesPurchases/supabaseMilesPurchaseRepository';
import { supplierRepository } from '../services/suppliers/supabaseSupplierRepository';
import type { MilesProgramRecord } from '../types/miles';
import {
  milesPurchaseStatusLabels,
  type MilesPurchase,
  type MilesPurchaseInput,
  type MilesPurchaseStatus
} from '../types/milesPurchase';
import type { Supplier } from '../types/supplier';

type StatusFilter = MilesPurchaseStatus | 'all';
type ProgramFilter = string;

const emptyPurchaseForm: MilesPurchaseInput = {
  programId: '',
  supplierId: '',
  quantity: 0,
  unitCost: 0,
  totalCost: 0,
  purchaseDate: new Date().toISOString().slice(0, 10),
  status: 'pending',
  notes: ''
};

export function MilesPurchasesPage() {
  const [purchases, setPurchases] = useState<MilesPurchase[]>([]);
  const [programs, setPrograms] = useState<MilesProgramRecord[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [programId, setProgramId] = useState<ProgramFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<MilesPurchase | null>(null);

  useEffect(() => {
    refreshPage();
  }, []);

  const filteredPurchases = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return purchases.filter((purchase) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [purchase.notes, purchase.supplierName].join(' ').toLowerCase().includes(normalizedSearch);
      const matchesStatus = status === 'all' || purchase.status === status;
      const matchesProgram = programId === 'all' || purchase.programId === programId;

      return matchesSearch && matchesStatus && matchesProgram;
    });
  }, [programId, purchases, search, status]);

  const summary = useMemo(() => {
    const totalQuantity = purchases.reduce((total, purchase) => total + purchase.quantity, 0);
    const totalCost = purchases.reduce((total, purchase) => total + purchase.totalCost, 0);
    const averageCostPerThousand = totalQuantity > 0 ? totalCost / (totalQuantity / 1000) : 0;

    return {
      totalQuantity,
      totalCost,
      averageCostPerThousand,
      pendingPurchases: purchases.filter((purchase) => purchase.status === 'pending').length
    };
  }, [purchases]);

  async function refreshPage() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [purchaseRecords, programRecords, supplierRecords] = await Promise.all([
        milesPurchaseRepository.listPurchases(),
        milesProgramRepository.listPrograms(),
        supplierRepository.listSuppliers().catch(() => [])
      ]);
      setPurchases(purchaseRecords);
      setPrograms(programRecords);
      setSuppliers(supplierRecords);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel carregar compras de milhas.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleNewPurchase() {
    setEditingPurchase(null);
    setIsModalOpen(true);
  }

  async function handleSavePurchase(values: MilesPurchaseInput) {
    setErrorMessage(null);
    setMessage(null);

    try {
      if (editingPurchase) {
        const updatedPurchase = await milesPurchaseRepository.updatePurchase(editingPurchase.id, values);
        setMessage(
          updatedPurchase ? 'Compra de milhas atualizada.' : 'Compra de milhas nao encontrada.'
        );
      } else {
        await milesPurchaseRepository.createPurchase(values);
        setMessage('Compra de milhas criada.');
      }

      setIsModalOpen(false);
      setEditingPurchase(null);
      await refreshPage();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel salvar a compra.');
    }
  }

  async function handleDeletePurchase(purchase: MilesPurchase) {
    const confirmed = window.confirm('Excluir esta compra de milhas?');

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setMessage(null);

    try {
      await milesPurchaseRepository.deletePurchase(purchase.id);
      setMessage('Compra de milhas excluida.');
      await refreshPage();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel excluir a compra.');
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Compras de milhas"
          description="Controle compras, fornecedores, custos e status por programa."
          badge="Supabase"
        />
        <Button className="w-full sm:w-auto sm:shrink-0" onClick={handleNewPurchase}>
          <Plus size={16} aria-hidden="true" />
          Nova compra
        </Button>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {errorMessage}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total comprado" value={formatMiles(summary.totalQuantity)} />
        <SummaryCard label="Custo total" value={formatCurrency(summary.totalCost)} />
        <SummaryCard
          label="Custo medio por milheiro"
          value={formatCurrency(summary.averageCostPerThousand)}
        />
        <SummaryCard label="Compras pendentes" value={summary.pendingPurchases.toString()} />
      </div>

      <Filters
        programs={programs}
        programId={programId}
        search={search}
        status={status}
        onProgramChange={setProgramId}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      {isLoading ? (
        <Card>
          <CardContent>
            <div className="flex min-h-48 items-center justify-center text-sm font-semibold text-ink-500">
              Carregando compras de milhas...
            </div>
          </CardContent>
        </Card>
      ) : filteredPurchases.length > 0 ? (
        <PurchasesTable
          purchases={filteredPurchases}
          onDelete={handleDeletePurchase}
          onEdit={(purchase) => {
            setEditingPurchase(purchase);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              icon={ShoppingCart}
              title="Nenhuma compra encontrada"
              description="Ajuste os filtros ou cadastre uma nova compra de milhas."
              actionLabel="Nova compra"
            />
          </CardContent>
        </Card>
      )}

      <PurchaseModal
        isOpen={isModalOpen}
        programs={programs}
        purchase={editingPurchase}
        suppliers={suppliers}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPurchase(null);
        }}
        onSave={handleSavePurchase}
      />
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        <p className="mt-3 break-words text-2xl font-semibold text-ink-900">{value}</p>
      </CardContent>
    </Card>
  );
}

type FiltersProps = {
  programs: MilesProgramRecord[];
  programId: ProgramFilter;
  search: string;
  status: StatusFilter;
  onProgramChange: (value: ProgramFilter) => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
};

function Filters({
  programs,
  programId,
  search,
  status,
  onProgramChange,
  onSearchChange,
  onStatusChange
}: FiltersProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <label className="relative block w-full lg:max-w-md">
          <span className="sr-only">Buscar compras</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
            aria-hidden="true"
          />
          <input
            className={inputClassNameSearch}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por observacao ou fornecedor"
            type="search"
          />
        </label>

        <div className="grid gap-3 xl:grid-cols-2">
          <FilterGroup label="Status">
            <FilterButton isActive={status === 'all'} onClick={() => onStatusChange('all')}>
              Todos
            </FilterButton>
            {Object.entries(milesPurchaseStatusLabels).map(([value, label]) => (
              <FilterButton
                isActive={status === value}
                key={value}
                onClick={() => onStatusChange(value as MilesPurchaseStatus)}
              >
                {label}
              </FilterButton>
            ))}
          </FilterGroup>

          <FilterGroup label="Programa">
            <select
              className={cn(inputClassName, 'max-w-full sm:w-72')}
              value={programId}
              onChange={(event) => onProgramChange(event.target.value)}
            >
              <option value="all">Todos</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.programName}
                </option>
              ))}
            </select>
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

type PurchasesTableProps = {
  purchases: MilesPurchase[];
  onDelete: (purchase: MilesPurchase) => void;
  onEdit: (purchase: MilesPurchase) => void;
};

function PurchasesTable({ purchases, onDelete, onEdit }: PurchasesTableProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-ink-900">Lista de compras</h2>
        <p className="text-sm text-ink-500">{purchases.length} compras encontradas</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-3 py-3">Programa</th>
                <th className="px-3 py-3">Fornecedor</th>
                <th className="px-3 py-3">Quantidade</th>
                <th className="px-3 py-3">Custos</th>
                <th className="px-3 py-3">Data</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Observacao</th>
                <th className="px-3 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map((purchase) => (
                <tr className="align-top transition hover:bg-slate-50" key={purchase.id}>
                  <td className="px-3 py-4 font-semibold text-ink-900">
                    {purchase.programName || 'Sem programa'}
                  </td>
                  <td className="px-3 py-4 text-ink-700">
                    {purchase.supplierName || 'Sem fornecedor'}
                  </td>
                  <td className="px-3 py-4 font-semibold text-ink-900">
                    {formatMiles(purchase.quantity)}
                  </td>
                  <td className="px-3 py-4">
                    <p className="font-semibold text-ink-900">{formatCurrency(purchase.totalCost)}</p>
                    <p className="mt-1 text-xs text-ink-500">
                      {formatCurrency(purchase.unitCost)} / milheiro
                    </p>
                  </td>
                  <td className="px-3 py-4 text-ink-700">{formatDate(purchase.purchaseDate)}</td>
                  <td className="px-3 py-4">
                    <StatusBadge status={purchase.status} />
                  </td>
                  <td className="max-w-64 px-3 py-4 text-ink-700">
                    {purchase.notes || 'Sem observacao.'}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        aria-label="Editar compra"
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(purchase)}
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </Button>
                      <Button
                        aria-label="Excluir compra"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(purchase)}
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
  );
}

function StatusBadge({ status }: { status: MilesPurchaseStatus }) {
  const tone = status === 'completed' ? 'green' : status === 'pending' ? 'amber' : 'slate';

  return <Badge tone={tone}>{milesPurchaseStatusLabels[status]}</Badge>;
}

type PurchaseModalProps = {
  isOpen: boolean;
  programs: MilesProgramRecord[];
  purchase: MilesPurchase | null;
  suppliers: Supplier[];
  onClose: () => void;
  onSave: (values: MilesPurchaseInput) => Promise<void>;
};

function PurchaseModal({
  isOpen,
  programs,
  purchase,
  suppliers,
  onClose,
  onSave
}: PurchaseModalProps) {
  const [values, setValues] = useState<MilesPurchaseInput>(emptyPurchaseForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setValues(
      purchase
        ? {
            programId: purchase.programId,
            supplierId: purchase.supplierId,
            quantity: purchase.quantity,
            unitCost: purchase.unitCost,
            totalCost: purchase.totalCost,
            purchaseDate: purchase.purchaseDate,
            status: purchase.status,
            notes: purchase.notes
          }
        : {
            ...emptyPurchaseForm,
            programId: programs[0]?.id ?? '',
            supplierId: suppliers[0]?.id ?? ''
          }
    );
  }, [isOpen, programs, purchase, suppliers]);

  if (!isOpen) {
    return null;
  }

  function updateCosts(quantity: number, unitCost: number) {
    return Math.max(0, quantity / 1000) * Math.max(0, unitCost);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      await onSave({
        ...values,
        quantity: Math.max(0, Number(values.quantity) || 0),
        unitCost: Math.max(0, Number(values.unitCost) || 0),
        totalCost: updateCosts(values.quantity, values.unitCost),
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
              {purchase ? 'Editar compra' : 'Nova compra'}
            </h2>
            <p className="mt-1 text-sm text-ink-500">Programa, fornecedor, quantidade e custo.</p>
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
          <Field label="Programa">
            <select
              className={inputClassName}
              value={values.programId}
              onChange={(event) => setValues({ ...values, programId: event.target.value })}
            >
              <option value="">Sem programa</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.programName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fornecedor">
            <select
              className={inputClassName}
              value={values.supplierId}
              onChange={(event) => setValues({ ...values, supplierId: event.target.value })}
            >
              <option value="">Sem fornecedor</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantidade">
            <input
              className={inputClassName}
              min={0}
              type="number"
              value={values.quantity}
              onChange={(event) => {
                const quantity = Number(event.target.value) || 0;
                setValues({
                  ...values,
                  quantity,
                  totalCost: updateCosts(quantity, values.unitCost)
                });
              }}
            />
          </Field>
          <Field label="Custo por milheiro">
            <input
              className={inputClassName}
              min={0}
              step="0.01"
              type="number"
              value={values.unitCost}
              onChange={(event) => {
                const unitCost = Number(event.target.value) || 0;
                setValues({
                  ...values,
                  unitCost,
                  totalCost: updateCosts(values.quantity, unitCost)
                });
              }}
            />
          </Field>
          <Field label="Custo total">
            <input className={inputClassName} readOnly value={formatCurrency(values.totalCost)} />
          </Field>
          <Field label="Data da compra">
            <input
              className={inputClassName}
              required
              type="date"
              value={values.purchaseDate}
              onChange={(event) => setValues({ ...values, purchaseDate: event.target.value })}
            />
          </Field>
          <Field label="Status">
            <select
              className={inputClassName}
              value={values.status}
              onChange={(event) =>
                setValues({ ...values, status: event.target.value as MilesPurchaseStatus })
              }
            >
              {Object.entries(milesPurchaseStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Observacao" className="sm:col-span-2">
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
            {isSaving ? 'Salvando...' : 'Salvar compra'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  children,
  className,
  label
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency'
  }).format(value);
}

const inputClassName =
  'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-ink-500';

const inputClassNameSearch =
  'h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-ink-900 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-50';
