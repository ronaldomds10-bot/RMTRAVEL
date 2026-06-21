import { ArrowRightLeft, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { cn } from '../lib/cn';
import { milesProgramRepository } from '../services/miles/milesProgramRepositoryAdapter';
import { milesTransferRepository } from '../services/milesTransfers/supabaseMilesTransferRepository';
import type { MilesProgramRecord } from '../types/miles';
import {
  milesTransferStatusLabels,
  type MilesTransfer,
  type MilesTransferInput,
  type MilesTransferStatus
} from '../types/milesTransfer';

type StatusFilter = MilesTransferStatus | 'all';
type ProgramFilter = string;

const emptyTransferForm: MilesTransferInput = {
  fromProgramId: '',
  toProgramId: '',
  quantity: 0,
  bonusPercentage: 0,
  finalQuantity: 0,
  transferDate: new Date().toISOString().slice(0, 10),
  status: 'pending',
  notes: ''
};

export function MilesTransfersPage() {
  const [transfers, setTransfers] = useState<MilesTransfer[]>([]);
  const [programs, setPrograms] = useState<MilesProgramRecord[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [fromProgramId, setFromProgramId] = useState<ProgramFilter>('all');
  const [toProgramId, setToProgramId] = useState<ProgramFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<MilesTransfer | null>(null);

  useEffect(() => {
    refreshPage();
  }, []);

  const filteredTransfers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return transfers.filter((transfer) => {
      const matchesSearch =
        normalizedSearch.length === 0 || transfer.notes.toLowerCase().includes(normalizedSearch);
      const matchesStatus = status === 'all' || transfer.status === status;
      const matchesFrom = fromProgramId === 'all' || transfer.fromProgramId === fromProgramId;
      const matchesTo = toProgramId === 'all' || transfer.toProgramId === toProgramId;

      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });
  }, [fromProgramId, search, status, toProgramId, transfers]);

  const summary = useMemo(() => {
    const totalQuantity = transfers.reduce((total, transfer) => total + transfer.quantity, 0);
    const totalFinalQuantity = transfers.reduce(
      (total, transfer) => total + transfer.finalQuantity,
      0
    );

    return {
      totalQuantity,
      generatedBonus: Math.max(0, totalFinalQuantity - totalQuantity),
      pendingTransfers: transfers.filter((transfer) => transfer.status === 'pending').length,
      completedTransfers: transfers.filter((transfer) => transfer.status === 'completed').length
    };
  }, [transfers]);

  async function refreshPage() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [transferRecords, programRecords] = await Promise.all([
        milesTransferRepository.listTransfers(),
        milesProgramRepository.listPrograms()
      ]);
      setTransfers(transferRecords);
      setPrograms(programRecords);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel carregar transferencias de milhas.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleNewTransfer() {
    setEditingTransfer(null);
    setIsModalOpen(true);
  }

  async function handleSaveTransfer(values: MilesTransferInput) {
    setErrorMessage(null);
    setMessage(null);

    try {
      if (editingTransfer) {
        const updatedTransfer = await milesTransferRepository.updateTransfer(
          editingTransfer.id,
          values
        );
        setMessage(
          updatedTransfer
            ? 'Transferencia de milhas atualizada.'
            : 'Transferencia de milhas nao encontrada.'
        );
      } else {
        await milesTransferRepository.createTransfer(values);
        setMessage('Transferencia de milhas criada.');
      }

      setIsModalOpen(false);
      setEditingTransfer(null);
      await refreshPage();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel salvar a transferencia.'
      );
    }
  }

  async function handleDeleteTransfer(transfer: MilesTransfer) {
    const confirmed = window.confirm('Excluir esta transferencia de milhas?');

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setMessage(null);

    try {
      await milesTransferRepository.deleteTransfer(transfer.id);
      setMessage('Transferencia de milhas excluida.');
      await refreshPage();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel excluir a transferencia.'
      );
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Transferencia de milhas"
          description="Controle transferencias entre programas, bonus e status operacional."
          badge="Supabase"
        />
        <Button className="w-full sm:w-auto sm:shrink-0" onClick={handleNewTransfer}>
          <Plus size={16} aria-hidden="true" />
          Nova transferencia
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
        <SummaryCard label="Total transferido" value={formatMiles(summary.totalQuantity)} />
        <SummaryCard label="Bonus gerado" value={formatMiles(summary.generatedBonus)} />
        <SummaryCard label="Transferencias pendentes" value={summary.pendingTransfers.toString()} />
        <SummaryCard label="Concluidas" value={summary.completedTransfers.toString()} />
      </div>

      <Filters
        fromProgramId={fromProgramId}
        programs={programs}
        search={search}
        status={status}
        toProgramId={toProgramId}
        onFromProgramChange={setFromProgramId}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onToProgramChange={setToProgramId}
      />

      {isLoading ? (
        <Card>
          <CardContent>
            <div className="flex min-h-48 items-center justify-center text-sm font-semibold text-ink-500">
              Carregando transferencias de milhas...
            </div>
          </CardContent>
        </Card>
      ) : filteredTransfers.length > 0 ? (
        <TransfersTable
          transfers={filteredTransfers}
          onDelete={handleDeleteTransfer}
          onEdit={(transfer) => {
            setEditingTransfer(transfer);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              icon={ArrowRightLeft}
              title="Nenhuma transferencia encontrada"
              description="Ajuste os filtros ou cadastre uma nova transferencia de milhas."
              actionLabel="Nova transferencia"
            />
          </CardContent>
        </Card>
      )}

      <TransferModal
        isOpen={isModalOpen}
        programs={programs}
        transfer={editingTransfer}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransfer(null);
        }}
        onSave={handleSaveTransfer}
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
  fromProgramId: ProgramFilter;
  programs: MilesProgramRecord[];
  search: string;
  status: StatusFilter;
  toProgramId: ProgramFilter;
  onFromProgramChange: (value: ProgramFilter) => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onToProgramChange: (value: ProgramFilter) => void;
};

function Filters({
  fromProgramId,
  programs,
  search,
  status,
  toProgramId,
  onFromProgramChange,
  onSearchChange,
  onStatusChange,
  onToProgramChange
}: FiltersProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <label className="relative block w-full lg:max-w-md">
          <span className="sr-only">Buscar transferencias</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
            aria-hidden="true"
          />
          <input
            className={inputClassNameSearch}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por observacao"
            type="search"
          />
        </label>

        <div className="grid gap-3 xl:grid-cols-3">
          <FilterGroup label="Status">
            <FilterButton isActive={status === 'all'} onClick={() => onStatusChange('all')}>
              Todos
            </FilterButton>
            {Object.entries(milesTransferStatusLabels).map(([value, label]) => (
              <FilterButton
                isActive={status === value}
                key={value}
                onClick={() => onStatusChange(value as MilesTransferStatus)}
              >
                {label}
              </FilterButton>
            ))}
          </FilterGroup>

          <ProgramSelect
            label="Origem"
            programs={programs}
            value={fromProgramId}
            onChange={onFromProgramChange}
          />
          <ProgramSelect
            label="Destino"
            programs={programs}
            value={toProgramId}
            onChange={onToProgramChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ProgramSelect({
  label,
  programs,
  value,
  onChange
}: {
  label: string;
  programs: MilesProgramRecord[];
  value: ProgramFilter;
  onChange: (value: ProgramFilter) => void;
}) {
  return (
    <FilterGroup label={label}>
      <select
        className={cn(inputClassName, 'max-w-full sm:w-72')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="all">Todos</option>
        {programs.map((program) => (
          <option key={program.id} value={program.id}>
            {program.programName}
          </option>
        ))}
      </select>
    </FilterGroup>
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

type TransfersTableProps = {
  transfers: MilesTransfer[];
  onDelete: (transfer: MilesTransfer) => void;
  onEdit: (transfer: MilesTransfer) => void;
};

function TransfersTable({ transfers, onDelete, onEdit }: TransfersTableProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-ink-900">Lista de transferencias</h2>
        <p className="text-sm text-ink-500">{transfers.length} transferencias encontradas</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-3 py-3">Origem</th>
                <th className="px-3 py-3">Destino</th>
                <th className="px-3 py-3">Quantidade</th>
                <th className="px-3 py-3">Bonus</th>
                <th className="px-3 py-3">Final</th>
                <th className="px-3 py-3">Data</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Observacao</th>
                <th className="px-3 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.map((transfer) => (
                <tr className="align-top transition hover:bg-slate-50" key={transfer.id}>
                  <td className="px-3 py-4 font-semibold text-ink-900">
                    {transfer.fromProgramName || 'Sem origem'}
                  </td>
                  <td className="px-3 py-4 font-semibold text-ink-900">
                    {transfer.toProgramName || 'Sem destino'}
                  </td>
                  <td className="px-3 py-4 text-ink-700">{formatMiles(transfer.quantity)}</td>
                  <td className="px-3 py-4 text-ink-700">
                    {formatPercent(transfer.bonusPercentage)}
                  </td>
                  <td className="px-3 py-4 font-semibold text-ink-900">
                    {formatMiles(transfer.finalQuantity)}
                  </td>
                  <td className="px-3 py-4 text-ink-700">{formatDate(transfer.transferDate)}</td>
                  <td className="px-3 py-4">
                    <StatusBadge status={transfer.status} />
                  </td>
                  <td className="max-w-64 px-3 py-4 text-ink-700">
                    {transfer.notes || 'Sem observacao.'}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        aria-label="Editar transferencia"
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(transfer)}
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </Button>
                      <Button
                        aria-label="Excluir transferencia"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(transfer)}
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

function StatusBadge({ status }: { status: MilesTransferStatus }) {
  const tone = status === 'completed' ? 'green' : status === 'pending' ? 'amber' : 'slate';

  return <Badge tone={tone}>{milesTransferStatusLabels[status]}</Badge>;
}

type TransferModalProps = {
  isOpen: boolean;
  programs: MilesProgramRecord[];
  transfer: MilesTransfer | null;
  onClose: () => void;
  onSave: (values: MilesTransferInput) => Promise<void>;
};

function TransferModal({ isOpen, programs, transfer, onClose, onSave }: TransferModalProps) {
  const [values, setValues] = useState<MilesTransferInput>(emptyTransferForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setValues(
      transfer
        ? {
            fromProgramId: transfer.fromProgramId,
            toProgramId: transfer.toProgramId,
            quantity: transfer.quantity,
            bonusPercentage: transfer.bonusPercentage,
            finalQuantity: transfer.finalQuantity,
            transferDate: transfer.transferDate,
            status: transfer.status,
            notes: transfer.notes
          }
        : {
            ...emptyTransferForm,
            fromProgramId: programs[0]?.id ?? '',
            toProgramId: programs[1]?.id ?? programs[0]?.id ?? ''
          }
    );
  }, [isOpen, programs, transfer]);

  if (!isOpen) {
    return null;
  }

  function updateFinalQuantity(quantity: number, bonusPercentage: number) {
    const normalizedQuantity = Math.max(0, Number(quantity) || 0);
    const normalizedBonus = Math.max(0, Number(bonusPercentage) || 0);

    return normalizedQuantity + normalizedQuantity * (normalizedBonus / 100);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      await onSave({
        ...values,
        quantity: Math.max(0, Number(values.quantity) || 0),
        bonusPercentage: Math.max(0, Number(values.bonusPercentage) || 0),
        finalQuantity: updateFinalQuantity(values.quantity, values.bonusPercentage),
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
              {transfer ? 'Editar transferencia' : 'Nova transferencia'}
            </h2>
            <p className="mt-1 text-sm text-ink-500">Origem, destino, quantidade e bonus.</p>
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
          <Field label="Programa origem">
            <select
              className={inputClassName}
              value={values.fromProgramId}
              onChange={(event) => setValues({ ...values, fromProgramId: event.target.value })}
            >
              <option value="">Sem origem</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.programName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Programa destino">
            <select
              className={inputClassName}
              value={values.toProgramId}
              onChange={(event) => setValues({ ...values, toProgramId: event.target.value })}
            >
              <option value="">Sem destino</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.programName}
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
                  finalQuantity: updateFinalQuantity(quantity, values.bonusPercentage)
                });
              }}
            />
          </Field>
          <Field label="Bonus percentual">
            <input
              className={inputClassName}
              min={0}
              step="0.01"
              type="number"
              value={values.bonusPercentage}
              onChange={(event) => {
                const bonusPercentage = Number(event.target.value) || 0;
                setValues({
                  ...values,
                  bonusPercentage,
                  finalQuantity: updateFinalQuantity(values.quantity, bonusPercentage)
                });
              }}
            />
          </Field>
          <Field label="Quantidade final">
            <input className={inputClassName} readOnly value={formatMiles(values.finalQuantity)} />
          </Field>
          <Field label="Data da transferencia">
            <input
              className={inputClassName}
              required
              type="date"
              value={values.transferDate}
              onChange={(event) => setValues({ ...values, transferDate: event.target.value })}
            />
          </Field>
          <Field label="Status">
            <select
              className={inputClassName}
              value={values.status}
              onChange={(event) =>
                setValues({ ...values, status: event.target.value as MilesTransferStatus })
              }
            >
              {Object.entries(milesTransferStatusLabels).map(([value, label]) => (
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
            {isSaving ? 'Salvando...' : 'Salvar transferencia'}
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

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2
  }).format(value)}%`;
}

const inputClassName =
  'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-ink-500';

const inputClassNameSearch =
  'h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-ink-900 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-50';
