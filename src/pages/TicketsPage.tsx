import {
  Edit,
  Eye,
  FileText,
  Loader2,
  MessageCircle,
  Plane,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UploadCloud,
  X,
  XCircle
} from 'lucide-react';
import { FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { formatCurrency } from '../lib/formatters';
import { generateTicketPdf } from '../services/tickets/ticketPdf';
import {
  ticketRepository
} from '../services/tickets/ticketRepositoryAdapter';
import type { TicketRecord } from '../types/database';
import type { Airport, Ticket, TicketSearchInput, TicketStatus } from '../types/ticket';

const statusTone: Record<TicketStatus, 'green' | 'blue' | 'amber' | 'slate'> = {
  confirmado: 'green',
  emitido: 'blue',
  pendente: 'amber',
  cancelado: 'slate'
};

type SearchStatus = 'idle' | 'loading' | 'success' | 'not-found' | 'validation-error' | 'endpoint-error';

export function TicketsPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState<TicketSearchInput>({ surname: '', locator: '' });
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [savedTickets, setSavedTickets] = useState<TicketRecord[]>([]);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [ticketActionMessage, setTicketActionMessage] = useState<string | null>(null);
  const [viewingTicket, setViewingTicket] = useState<TicketRecord | null>(null);
  const [editingTicket, setEditingTicket] = useState<TicketRecord | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSavingTicket, setIsSavingTicket] = useState(false);

  const isLoading = searchStatus === 'loading';
  const hasTypedSearch = input.surname.trim().length > 0 || input.locator.trim().length > 0;
  const canSearch = hasTypedSearch && !isLoading;
  const filteredSavedTickets = useMemo(() => {
    const locator = input.locator.trim().toLowerCase();
    const surname = input.surname.trim().toLowerCase();

    if (!locator && !surname) {
      return savedTickets;
    }

    return savedTickets.filter((ticket) => {
      const matchesLocator =
        !locator ||
        ticket.locator.toLowerCase().includes(locator) ||
        ticket.id.toLowerCase().includes(locator) ||
        ticket.airline.toLowerCase().includes(locator);
      const matchesSurname =
        !surname ||
        ticket.surname.toLowerCase().includes(surname) ||
        ticket.passenger.toLowerCase().includes(surname);

      return matchesLocator && matchesSurname;
    });
  }, [input.locator, input.surname, savedTickets]);
  const selectedSavedTicket = useMemo(() => {
    if (!selectedTicket) {
      return null;
    }

    return (
      savedTickets.find(
        (ticket) =>
          ticket.locator.toLowerCase() === selectedTicket.locator.toLowerCase() &&
          ticket.surname.toLowerCase() === selectedTicket.surname.toLowerCase()
      ) ?? null
    );
  }, [savedTickets, selectedTicket]);
  const isSelectedTicketSaved = Boolean(selectedSavedTicket);

  useEffect(() => {
    refreshSavedTickets();
  }, []);

  async function refreshSavedTickets() {
    const records = await ticketRepository.listTickets();
    setSavedTickets(records);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateSearchInput(input);

    if (validationError) {
      setSearchStatus('validation-error');
      setSearchMessage(validationError);
      return;
    }

    setSelectedTicket(null);
    setSaveMessage(null);
    setPdfError(null);

    if (filteredSavedTickets.length === 0) {
      setSearchStatus('not-found');
      setSearchMessage('Nenhum bilhete cadastrado corresponde aos filtros informados.');
      return;
    }

    setSearchStatus('success');
    setSearchMessage(null);
  }

  function updateInput(field: keyof TicketSearchInput, value: string) {
    setInput((current) => ({ ...current, [field]: value }));
    setSelectedTicket(null);
    setSearchStatus('idle');
    setSearchMessage(null);
    setSaveMessage(null);
    setPdfError(null);
  }

  function clearSearch() {
    setInput({ surname: '', locator: '' });
    setSearchStatus('idle');
    setSelectedTicket(null);
    setSearchMessage(null);
    setSaveMessage(null);
    setPdfError(null);
  }

  async function handleSaveTicket() {
    if (!selectedTicket) {
      setSaveMessage('Busque uma reserva antes de salvar.');
      return;
    }

    if (isSelectedTicketSaved) {
      setSaveMessage(`Reserva ${selectedTicket.locator} ja esta salva.`);
      return;
    }

    try {
      setIsSavingTicket(true);
      const record = await ticketRepository.createTicket(selectedTicket);
      setSelectedTicket(record);
      await refreshSavedTickets();
      const alreadySaved = false;

    setSaveMessage(
      alreadySaved
        ? `Reserva ${record.locator} ja estava salva.`
        : `Reserva ${record.locator} salva em bilhetes.`
      );
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Nao foi possivel salvar o bilhete.');
    } finally {
      setIsSavingTicket(false);
    }
  }

  async function handleGeneratePdf(ticket: Ticket | null = selectedSavedTicket ?? selectedTicket) {
    try {
      setPdfError(null);
      setIsGeneratingPdf(true);
      await generateTicketPdf({ ticket });
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : 'Nao foi possivel gerar o PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  function handleWhatsApp(ticket: Ticket) {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(createTicketWhatsAppMessage(ticket))}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  async function handleDeleteTicket(ticket: TicketRecord) {
    const confirmed = window.confirm(
      `Excluir o bilhete ${ticket.locator} de ${ticket.passenger} ${ticket.surname}?`
    );

    if (!confirmed) {
      return;
    }

    const deleted = await ticketRepository.deleteTicket(ticket.id);
    await refreshSavedTickets();
    setViewingTicket((current) => (current?.id === ticket.id ? null : current));
    setEditingTicket((current) => (current?.id === ticket.id ? null : current));
    setTicketActionMessage(
      deleted
        ? `Bilhete ${ticket.locator} excluido.`
        : `Bilhete ${ticket.locator} nao foi encontrado para exclusao.`
    );
  }

  async function handleUpdateTicket(ticket: TicketRecord, changes: EditableTicketFields) {
    const updatedTicket: Ticket = {
      ...ticket,
      passenger: changes.passenger.trim(),
      surname: changes.surname.trim(),
      locator: changes.locator.trim().toUpperCase(),
      airline: changes.airline.trim(),
      status: changes.status,
      amount: Number(changes.amount),
      observations: changes.observations.trim()
    };

    const updatedRecord = await ticketRepository.updateTicket(ticket.id, updatedTicket);
    await refreshSavedTickets();

    if (updatedRecord) {
      setEditingTicket(null);
      setViewingTicket((current) => (current?.id === ticket.id ? updatedRecord : current));
      setTicketActionMessage(`Bilhete ${updatedRecord.locator} atualizado.`);
      return;
    }

    setTicketActionMessage(`Nao foi possivel atualizar o bilhete ${ticket.locator}.`);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Bilhetes"
          description="Consulte, edite e acompanhe os bilhetes ja cadastrados."
        />
        <Button className="w-full sm:w-auto" onClick={() => navigate('/platform/tickets/import')}>
          <UploadCloud size={16} aria-hidden="true" />
          Importar emissao
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Buscar bilhetes</h2>
          <p className="text-sm text-ink-500">
            Use localizador, companhia, nome ou sobrenome para filtrar bilhetes ja cadastrados.
          </p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-[1fr_1fr_auto_auto]" onSubmit={handleSubmit}>
            <label>
              <span className="text-sm font-semibold text-ink-700">Localizador</span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm uppercase text-ink-900 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                disabled={isLoading}
                value={input.locator}
                onChange={(event) => updateInput('locator', event.target.value.toUpperCase())}
                placeholder="RM7LIS"
              />
            </label>
            <label>
              <span className="text-sm font-semibold text-ink-700">Sobrenome</span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                disabled={isLoading}
                value={input.surname}
                onChange={(event) => updateInput('surname', event.target.value)}
                placeholder="Costa"
              />
            </label>
            <div className="flex items-end">
              <Button className="w-full lg:w-auto" disabled={!canSearch} type="submit">
                {isLoading ? (
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                ) : (
                  <Search size={16} aria-hidden="true" />
                )}
                {isLoading ? 'Buscando...' : 'Buscar bilhetes'}
              </Button>
            </div>
            <div className="flex items-end">
              <Button
                className="w-full lg:w-auto"
                disabled={isLoading || (!hasTypedSearch && searchStatus === 'idle')}
                onClick={clearSearch}
                type="button"
                variant="secondary"
              >
                <RefreshCw size={16} aria-hidden="true" />
                Limpar busca
              </Button>
            </div>
          </form>
          {searchMessage ? (
            <SearchMessage status={searchStatus} message={searchMessage} />
          ) : null}
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent>
            <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-brand-200 bg-brand-50 px-4 py-10 text-center">
              <div className="max-w-md">
                <div className="mx-auto grid size-12 place-items-center rounded-lg bg-white text-brand-700 shadow-sm ring-1 ring-brand-100">
                  <Loader2 className="animate-spin" size={22} aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-base font-semibold text-ink-900">Buscando reserva</h2>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Estamos consultando os dados informados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && selectedTicket ? (
        <TicketDetails
          ticket={selectedTicket}
          isGeneratingPdf={isGeneratingPdf}
          isSaved={isSelectedTicketSaved}
          isSaving={isSavingTicket}
          onGeneratePdf={() => handleGeneratePdf()}
          onSaveTicket={handleSaveTicket}
          onWhatsApp={() => handleWhatsApp(selectedSavedTicket ?? selectedTicket)}
          pdfError={pdfError}
          saveMessage={saveMessage}
        />
      ) : null}

      {!isLoading && !selectedTicket && searchStatus === 'not-found' ? (
        <Card>
          <CardContent>
            <EmptyState
              title="Reserva nao encontrada"
              description="Nenhum bilhete cadastrado corresponde aos filtros informados. Revise a busca ou importe uma emissao."
              actionLabel="Sem resultado"
              icon={Search}
            />
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !selectedTicket && searchStatus === 'endpoint-error' ? (
        <Card>
          <CardContent>
            <EmptyState
              title="Nao foi possivel buscar a reserva"
              description={searchMessage ?? 'Nao foi possivel concluir a consulta. Revise os dados e tente novamente.'}
              actionLabel="Erro de consulta"
              icon={XCircle}
            />
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !selectedTicket && searchStatus === 'idle' ? (
        <Card>
          <CardContent>
            <EmptyState
              title="Busque nos bilhetes cadastrados"
              description="Preencha os campos para filtrar a lista de bilhetes salvos."
              actionLabel="Lista de bilhetes"
              icon={Search}
            />
          </CardContent>
        </Card>
      ) : null}

      <SavedTicketsList
        actionMessage={ticketActionMessage}
        tickets={filteredSavedTickets}
        onDeleteTicket={handleDeleteTicket}
        onEditTicket={setEditingTicket}
        onGeneratePdf={handleGeneratePdf}
        onViewTicket={setViewingTicket}
        onWhatsApp={handleWhatsApp}
      />

      {viewingTicket ? (
        <TicketViewModal
          ticket={viewingTicket}
          onClose={() => setViewingTicket(null)}
          onEdit={() => {
            setEditingTicket(viewingTicket);
            setViewingTicket(null);
          }}
          onGeneratePdf={() => handleGeneratePdf(viewingTicket)}
          onWhatsApp={() => handleWhatsApp(viewingTicket)}
        />
      ) : null}

      {editingTicket ? (
        <TicketEditModal
          ticket={editingTicket}
          onClose={() => setEditingTicket(null)}
          onSave={handleUpdateTicket}
        />
      ) : null}
    </section>
  );
}

function validateSearchInput(input: TicketSearchInput) {
  const locator = input.locator.trim();
  const surname = input.surname.trim();

  if (!locator && !surname) {
    return 'Informe localizador, companhia, nome ou sobrenome para buscar bilhetes.';
  }

  if (locator && locator.length < 2) {
    return 'O campo localizador deve ter pelo menos 2 caracteres.';
  }

  if (surname && surname.length < 2) {
    return 'O campo nome ou sobrenome deve ter pelo menos 2 caracteres.';
  }

  return null;
}

type SearchMessageProps = {
  status: SearchStatus;
  message: string;
};

function SearchMessage({ status, message }: SearchMessageProps) {
  const isValidation = status === 'validation-error';

  return (
    <div
      className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
        isValidation
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
      role="status"
    >
      <p className="font-semibold">{isValidation ? 'Revise os campos' : 'Consulta nao concluida'}</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}

type TicketDetailsProps = {
  ticket: Ticket;
  isGeneratingPdf: boolean;
  isSaved: boolean;
  isSaving: boolean;
  onGeneratePdf: () => void;
  onSaveTicket: () => void;
  onWhatsApp: () => void;
  pdfError: string | null;
  saveMessage: string | null;
};

function TicketDetails({
  ticket,
  isGeneratingPdf,
  isSaved,
  isSaving,
  onGeneratePdf,
  onSaveTicket,
  onWhatsApp,
  pdfError,
  saveMessage
}: TicketDetailsProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">
              {ticket.passenger} {ticket.surname}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Localizador {ticket.locator} · {ticket.airline}
            </p>
          </div>
          <Badge tone={statusTone[ticket.status]}>{ticket.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.segments.map((segment) => (
            <div
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              key={segment.id}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <RoutePoint
                  label="Origem"
                  airport={segment.origin}
                  date={segment.departure.date}
                  time={segment.departure.time}
                />
                <div className="flex items-center gap-3 text-brand-700 md:px-6">
                  <div className="h-px w-12 bg-brand-200" />
                  <Plane size={20} aria-hidden="true" />
                  <div className="h-px w-12 bg-brand-200" />
                </div>
                <RoutePoint
                  label="Destino"
                  airport={segment.destination}
                  date={segment.arrival.date}
                  time={segment.arrival.time}
                  alignRight
                />
              </div>

              <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 text-sm md:grid-cols-3">
                <InfoRow
                  label="Voo"
                  value={`${segment.flightNumber}${segment.fareClass ? ` · ${segment.fareClass}` : ''}`}
                />
                <InfoRow label="Bagagem de mao" value={segment.baggage.carryOn} />
                <InfoRow
                  label="Bagagem despachada"
                  value={`${segment.baggage.checked}${segment.baggage.notes ? ` · ${segment.baggage.notes}` : ''}`}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Resumo da reserva</h2>
          <p className="text-sm text-ink-500">Principais informações da reserva.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="Passageiro" value={`${ticket.passenger} ${ticket.surname}`} />
          <InfoRow label="Companhia" value={ticket.airline} />
          <InfoRow label="Valor" value={formatCurrency(ticket.amount)} />
          <InfoRow label="Observacoes" value={ticket.observations} />
          {saveMessage ? <p className="text-sm font-medium text-brand-700">{saveMessage}</p> : null}
          {pdfError ? <p className="text-sm font-medium text-red-600">{pdfError}</p> : null}
          <Button className="w-full" disabled={isSaved || isSaving} onClick={onSaveTicket}>
            <Save size={16} aria-hidden="true" />
            {isSaved ? 'Bilhete salvo' : isSaving ? 'Salvando...' : 'Salvar bilhete'}
          </Button>
          <Button className="w-full" variant="secondary" onClick={onWhatsApp}>
            <MessageCircle size={16} aria-hidden="true" />
            WhatsApp
          </Button>
          <Button className="w-full" variant="secondary" onClick={onGeneratePdf} disabled={isGeneratingPdf}>
            <FileText size={16} aria-hidden="true" />
            {isGeneratingPdf ? 'Gerando PDF...' : 'Gerar PDF'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

type SavedTicketsListProps = {
  actionMessage: string | null;
  tickets: TicketRecord[];
  onDeleteTicket: (ticket: TicketRecord) => void;
  onEditTicket: (ticket: TicketRecord) => void;
  onGeneratePdf: (ticket: TicketRecord) => void;
  onViewTicket: (ticket: TicketRecord) => void;
  onWhatsApp: (ticket: TicketRecord) => void;
};

function SavedTicketsList({
  actionMessage,
  tickets,
  onDeleteTicket,
  onEditTicket,
  onGeneratePdf,
  onViewTicket,
  onWhatsApp
}: SavedTicketsListProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-ink-900">Bilhetes salvos</h2>
        {actionMessage ? <p className="text-sm font-medium text-brand-700">{actionMessage}</p> : null}
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <EmptyState
            title="Nenhum bilhete salvo"
            description="Importe uma emissao para registrar o primeiro bilhete."
            actionLabel="Sem bilhetes"
            icon={Save}
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="hidden grid-cols-[1.2fr_0.8fr_0.9fr_0.7fr_1.5fr] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
              <span>Passageiro</span>
              <span>Localizador</span>
              <span>Companhia</span>
              <span>Status</span>
              <span>Acoes</span>
            </div>
            <div className="divide-y divide-slate-200">
              {tickets.map((ticket) => (
                <div
                  className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.2fr_0.8fr_0.9fr_0.7fr_1.5fr] md:items-center"
                  key={ticket.id}
                >
                  <div>
                    <p className="font-semibold text-ink-900">
                      {ticket.passenger} {ticket.surname}
                    </p>
                    <p className="text-xs text-ink-500">Salvo em {formatDateTime(ticket.createdAt)}</p>
                  </div>
                  <p className="font-semibold text-ink-900">{ticket.locator}</p>
                  <p className="text-ink-700">{ticket.airline}</p>
                  <div>
                    <Badge tone={statusTone[ticket.status]}>{ticket.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onViewTicket(ticket)}>
                      <Eye size={14} aria-hidden="true" />
                      Ver
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => onEditTicket(ticket)}>
                      <Edit size={14} aria-hidden="true" />
                      Editar
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => onWhatsApp(ticket)}>
                      <MessageCircle size={14} aria-hidden="true" />
                      WhatsApp
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => onGeneratePdf(ticket)}>
                      <FileText size={14} aria-hidden="true" />
                      PDF
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDeleteTicket(ticket)}>
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
  );
}

function createTicketWhatsAppMessage(ticket: Ticket) {
  const firstSegment = ticket.segments[0];
  const route = firstSegment
    ? `${firstSegment.origin.iata} -> ${firstSegment.destination.iata} em ${firstSegment.departure.date} ${firstSegment.departure.time}`
    : 'Trecho nao informado';

  return [
    `Bilhete RMTRAVEL - ${ticket.passenger} ${ticket.surname}`,
    `Localizador: ${ticket.locator}`,
    `Companhia: ${ticket.airline}`,
    `Status: ${ticket.status}`,
    `Trecho: ${route}`,
    `Valor: ${formatCurrency(ticket.amount)}`
  ].join('\n');
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
            className="grid size-9 place-items-center rounded-lg text-ink-500 transition hover:bg-slate-100 hover:text-ink-900"
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

type TicketViewModalProps = {
  ticket: TicketRecord;
  onClose: () => void;
  onEdit: () => void;
  onGeneratePdf: () => void;
  onWhatsApp: () => void;
};

function TicketViewModal({
  ticket,
  onClose,
  onEdit,
  onGeneratePdf,
  onWhatsApp
}: TicketViewModalProps) {
  return (
    <ModalShell title={`Bilhete ${ticket.locator}`} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-ink-900">
              {ticket.passenger} {ticket.surname}
            </p>
            <p className="mt-1 text-sm text-ink-500">
              {ticket.airline} | Salvo em {formatDateTime(ticket.createdAt)}
            </p>
          </div>
          <Badge tone={statusTone[ticket.status]}>{ticket.status}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoRow label="Localizador" value={ticket.locator} />
          <InfoRow label="Valor" value={formatCurrency(ticket.amount)} />
          <InfoRow label="Atualizado em" value={formatDateTime(ticket.updatedAt)} />
          <InfoRow label="Bilhete" value={ticket.id} />
        </div>

        <div className="space-y-3">
          {ticket.segments.map((segment) => (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={segment.id}>
              <p className="text-sm font-semibold text-ink-900">Voo {segment.flightNumber}</p>
              <p className="mt-2 text-sm text-ink-700">
                {segment.origin.iata} &gt; {segment.destination.iata} | {segment.departure.date} {segment.departure.time}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                Bagagem: {segment.baggage.carryOn} / {segment.baggage.checked}
              </p>
            </div>
          ))}
        </div>

        <InfoRow label="Observacoes" value={ticket.observations || 'Sem observacoes.'} />

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          <Button variant="secondary" onClick={onEdit}>
            <Edit size={16} aria-hidden="true" />
            Editar
          </Button>
          <Button variant="secondary" onClick={onWhatsApp}>
            <MessageCircle size={16} aria-hidden="true" />
            WhatsApp
          </Button>
          <Button onClick={onGeneratePdf}>
            <FileText size={16} aria-hidden="true" />
            Gerar PDF
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

type EditableTicketFields = {
  passenger: string;
  surname: string;
  locator: string;
  airline: string;
  status: TicketStatus;
  amount: string;
  observations: string;
};

type TicketEditModalProps = {
  ticket: TicketRecord;
  onClose: () => void;
  onSave: (ticket: TicketRecord, changes: EditableTicketFields) => Promise<void>;
};

const fieldClass =
  'mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-50';

function TicketEditModal({ ticket, onClose, onSave }: TicketEditModalProps) {
  const [fields, setFields] = useState<EditableTicketFields>({
    passenger: ticket.passenger,
    surname: ticket.surname,
    locator: ticket.locator,
    airline: ticket.airline,
    status: ticket.status,
    amount: String(ticket.amount),
    observations: ticket.observations
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amount = Number(fields.amount);
  const canSubmit =
    fields.passenger.trim().length > 0 &&
    fields.surname.trim().length > 0 &&
    fields.locator.trim().length >= 4 &&
    fields.airline.trim().length > 0 &&
    Number.isFinite(amount) &&
    amount >= 0 &&
    !isSubmitting;

  function updateField<Field extends keyof EditableTicketFields>(
    field: Field,
    value: EditableTicketFields[Field]
  ) {
    setFields((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    await onSave(ticket, fields);
    setIsSubmitting(false);
  }

  return (
    <ModalShell title={`Editar ${ticket.locator}`} onClose={onClose}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="text-sm font-semibold text-ink-700">Nome</span>
            <input
              className={fieldClass}
              value={fields.passenger}
              onChange={(event) => updateField('passenger', event.target.value)}
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-ink-700">Sobrenome</span>
            <input
              className={fieldClass}
              value={fields.surname}
              onChange={(event) => updateField('surname', event.target.value)}
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-ink-700">Localizador</span>
            <input
              className={`${fieldClass} uppercase`}
              value={fields.locator}
              onChange={(event) => updateField('locator', event.target.value.toUpperCase())}
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-ink-700">Companhia</span>
            <input
              className={fieldClass}
              value={fields.airline}
              onChange={(event) => updateField('airline', event.target.value)}
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-ink-700">Status</span>
            <select
              className={fieldClass}
              value={fields.status}
              onChange={(event) => updateField('status', event.target.value as TicketStatus)}
            >
              {(Object.keys(statusTone) as TicketStatus[]).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold text-ink-700">Valor</span>
            <input
              className={fieldClass}
              min="0"
              step="0.01"
              type="number"
              value={fields.amount}
              onChange={(event) => updateField('amount', event.target.value)}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-ink-700">Observacoes</span>
          <textarea
            className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
            value={fields.observations}
            onChange={(event) => updateField('observations', event.target.value)}
          />
        </label>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!canSubmit} type="submit">
            <Save size={16} aria-hidden="true" />
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

type RoutePointProps = {
  label: string;
  airport: Airport;
  date: string;
  time: string;
  alignRight?: boolean;
};

function RoutePoint({ label, airport, date, time, alignRight = false }: RoutePointProps) {
  return (
    <div className={alignRight ? 'md:text-right' : undefined}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink-900">{airport.iata}</p>
      <p className="mt-1 text-sm text-ink-700">
        {airport.city}
        {airport.terminal ? ` · Terminal ${airport.terminal}` : ''}
      </p>
      <p className="mt-1 text-sm text-ink-500">
        {date} · {time}
      </p>
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
