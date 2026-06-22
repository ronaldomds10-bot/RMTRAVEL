import { Edit, Plus, RefreshCw, Save, Trash2, WalletCards, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { cn } from '../lib/cn';
import { milesProgramRepository } from '../services/miles/milesProgramRepositoryAdapter';
import {
  milesProgramTypes,
  type MilesProgramInput,
  type MilesProgramRecord,
  type MilesProgramStatus,
  type MilesProgramSummary,
  type MilesProgramType
} from '../types/miles';

const emptyProgramForm: MilesProgramInput = {
  programName: '',
  type: 'LATAM Pass',
  balance: 0,
  accountHolder: '',
  expirationDate: '',
  notes: '',
  status: 'active'
};

export function MilesPage() {
  const [programs, setPrograms] = useState<MilesProgramRecord[]>([]);
  const [formValues, setFormValues] = useState<MilesProgramInput>(emptyProgramForm);
  const [editingProgram, setEditingProgram] = useState<MilesProgramRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    refreshPrograms();
  }, []);

  const summary = useMemo<MilesProgramSummary>(() => {
    const lastUpdatedAt = programs.reduce<string | null>((latest, program) => {
      if (!latest) {
        return program.updatedAt;
      }

      return program.updatedAt.localeCompare(latest) > 0 ? program.updatedAt : latest;
    }, null);

    return {
      totalPrograms: programs.length,
      totalBalance: programs.reduce((total, program) => total + program.balance, 0),
      activePrograms: programs.filter((program) => program.status === 'active').length,
      lastUpdatedAt
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

  function updateField<Field extends keyof MilesProgramInput>(
    field: Field,
    value: MilesProgramInput[Field]
  ) {
    setFormValues((current) => ({
      ...current,
      [field]: value
    }));
    setMessage(null);
    setErrorMessage(null);
  }

  function startEditing(program: MilesProgramRecord) {
    setEditingProgram(program);
    setFormValues({
      programName: program.programName,
      type: program.type,
      balance: program.balance,
      accountHolder: program.accountHolder,
      expirationDate: program.expirationDate,
      notes: program.notes,
      status: program.status
    });
    setMessage(null);
    setErrorMessage(null);
  }

  function resetForm() {
    setEditingProgram(null);
    setFormValues(emptyProgramForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formValues.programName.trim()) {
      setErrorMessage('Informe o nome do programa.');
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);
      setErrorMessage(null);

      if (editingProgram) {
        await milesProgramRepository.updateProgram(editingProgram.id, normalizedFormValues(formValues));
        setMessage('Programa de milhas atualizado.');
      } else {
        await milesProgramRepository.createProgram(normalizedFormValues(formValues));
        setMessage('Programa de milhas criado.');
      }

      resetForm();
      await refreshPrograms();
    } catch {
      setErrorMessage('Nao foi possivel salvar o programa de milhas.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(program: MilesProgramRecord) {
    const confirmed = window.confirm(`Excluir o programa ${program.programName}?`);

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage(null);
      setMessage(null);
      await milesProgramRepository.deleteProgram(program.id);
      setMessage('Programa de milhas excluido.');
      if (editingProgram?.id === program.id) {
        resetForm();
      }
      await refreshPrograms();
    } catch {
      setErrorMessage('Nao foi possivel excluir o programa de milhas.');
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Milhas"
          description="Organize os programas de milhas usados nas suas emissões."
        />
        <Button
          className="w-full sm:w-auto sm:shrink-0"
          disabled={isLoading}
          onClick={refreshPrograms}
          variant="secondary"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-ink-600">
          Carregando programas de milhas...
        </div>
      ) : null}

      {message ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Programas cadastrados" value={summary.totalPrograms.toString()} />
        <SummaryCard label="Milhas/pontos estimados" value={formatMiles(summary.totalBalance)} />
        <SummaryCard label="Programas ativos" value={summary.activePrograms.toString()} />
        <SummaryCard
          label="Última atualização"
          value={
            summary.lastUpdatedAt
              ? new Date(summary.lastUpdatedAt).toLocaleDateString('pt-BR')
              : '-'
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.75fr)]">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-ink-900">Programas de milhas</h2>
            <p className="text-sm text-ink-500">
              Lista dos programas cadastrados para o usuario autenticado.
            </p>
          </CardHeader>
          <CardContent>
            {!isLoading && programs.length === 0 ? (
              <EmptyState
                icon={WalletCards}
                title="Nenhum programa cadastrado"
                description="Cadastre o primeiro programa para acompanhar saldos, titulares e validade."
                actionLabel="Cadastrar programa"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                  <thead>
                    <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="px-3 py-3">Programa</th>
                      <th className="px-3 py-3">Titular</th>
                      <th className="px-3 py-3">Saldo</th>
                      <th className="px-3 py-3">Validade</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {programs.map((program) => (
                      <tr key={program.id}>
                        <td className="px-3 py-4">
                          <p className="font-semibold text-ink-900">{program.programName}</p>
                          <p className="mt-1 text-xs text-ink-500">{program.type}</p>
                        </td>
                        <td className="px-3 py-4 text-ink-700">{program.accountHolder || '-'}</td>
                        <td className="px-3 py-4 font-semibold text-ink-900">
                          {formatMiles(program.balance)}
                        </td>
                        <td className="px-3 py-4 text-ink-700">
                          {program.expirationDate
                            ? new Date(`${program.expirationDate}T00:00:00`).toLocaleDateString(
                                'pt-BR'
                              )
                            : '-'}
                        </td>
                        <td className="px-3 py-4">
                          <Badge tone={program.status === 'active' ? 'green' : 'slate'}>
                            {program.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => startEditing(program)}
                            >
                              <Edit size={15} aria-hidden="true" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(program)}
                            >
                              <Trash2 size={15} aria-hidden="true" />
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink-900">
                {editingProgram ? 'Editar programa' : 'Novo programa'}
              </h2>
              <p className="text-sm text-ink-500">
                Dados do programa, titular, saldo e validade.
              </p>
            </div>
            {editingProgram ? (
              <Button size="sm" variant="ghost" onClick={resetForm}>
                <X size={16} aria-hidden="true" />
                Cancelar
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <TextField
                label="Nome do programa"
                value={formValues.programName}
                disabled={isSaving}
                onChange={(value) => updateField('programName', value)}
              />
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-ink-900" htmlFor="programType">
                  Tipo
                </label>
                <select
                  className={inputClassName}
                  id="programType"
                  value={formValues.type}
                  disabled={isSaving}
                  onChange={(event) => updateField('type', event.target.value as MilesProgramType)}
                >
                  {milesProgramTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <TextField
                label="Saldo"
                type="number"
                value={formValues.balance.toString()}
                disabled={isSaving}
                onChange={(value) => updateField('balance', Number(value) || 0)}
              />
              <TextField
                label="Titular da conta"
                value={formValues.accountHolder}
                disabled={isSaving}
                onChange={(value) => updateField('accountHolder', value)}
              />
              <TextField
                label="Validade"
                type="date"
                value={formValues.expirationDate}
                disabled={isSaving}
                onChange={(value) => updateField('expirationDate', value)}
              />
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-ink-900" htmlFor="programStatus">
                  Status
                </label>
                <select
                  className={inputClassName}
                  id="programStatus"
                  value={formValues.status}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField('status', event.target.value as MilesProgramStatus)
                  }
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-ink-900" htmlFor="programNotes">
                  Observações
                </label>
                <textarea
                  className={cn(inputClassName, 'min-h-24 resize-y py-3')}
                  id="programNotes"
                  value={formValues.notes}
                  disabled={isSaving}
                  onChange={(event) => updateField('notes', event.target.value)}
                />
              </div>
              <Button className="w-full" disabled={isSaving} type="submit">
                {editingProgram ? (
                  <Save size={16} aria-hidden="true" />
                ) : (
                  <Plus size={16} aria-hidden="true" />
                )}
                {isSaving ? 'Salvando' : editingProgram ? 'Salvar alterações' : 'Criar programa'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
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

function TextField({
  label,
  type = 'text',
  value,
  disabled,
  onChange
}: {
  label: string;
  type?: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-ink-900" htmlFor={id}>
        {label}
      </label>
      <input
        className={inputClassName}
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        min={type === 'number' ? 0 : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function normalizedFormValues(values: MilesProgramInput): MilesProgramInput {
  return {
    ...values,
    programName: values.programName.trim(),
    balance: Math.max(0, Number(values.balance) || 0),
    accountHolder: values.accountHolder.trim(),
    notes: values.notes.trim()
  };
}

function formatMiles(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0
  }).format(value);
}

const inputClassName =
  'min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-ink-500';
