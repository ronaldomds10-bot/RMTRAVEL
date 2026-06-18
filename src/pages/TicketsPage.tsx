import { FileText, Loader2, Plane, RefreshCw, Save, Search, XCircle } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { tickets } from '../data/tickets';
import { formatCurrency } from '../lib/formatters';
import { ticketProvider } from '../services/tickets';
import { generateTicketPdf } from '../services/tickets/ticketPdf';
import {
  getTicketRepositoryDiagnostics,
  ticketRepository,
  type TicketRepositoryDiagnostics
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
  const [input, setInput] = useState<TicketSearchInput>({ surname: '', locator: '' });
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [savedTickets, setSavedTickets] = useState<TicketRecord[]>([]);
  const [repositoryDiagnostics, setRepositoryDiagnostics] = useState<TicketRepositoryDiagnostics>(
    getTicketRepositoryDiagnostics()
  );
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const exampleTicket = tickets[0];
  const isLoading = searchStatus === 'loading';
  const hasTypedSearch = input.surname.trim().length > 0 || input.locator.trim().length > 0;
  const canSearch = input.surname.trim().length > 0 && input.locator.trim().length > 0 && !isLoading;

  useEffect(() => {
    refreshSavedTickets();
  }, []);

  async function refreshSavedTickets() {
    const records = await ticketRepository.listTickets();
    setSavedTickets(records);
    setRepositoryDiagnostics(getTicketRepositoryDiagnostics());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateSearchInput(input);

    if (validationError) {
      setSearchStatus('validation-error');
      setSearchMessage(validationError);
      return;
    }

    try {
      setSearchStatus('loading');
      setSearchMessage(null);
      setSaveMessage(null);
      setPdfError(null);
      setSelectedTicket(null);

      const result = await ticketProvider.searchByLocator(input);

      if (!result) {
        setSearchStatus('not-found');
        setSearchMessage('Nenhuma reserva foi encontrada para esse localizador e sobrenome.');
        return;
      }

      setSelectedTicket(result);
      setSearchStatus('success');
      setSearchMessage(null);
    } catch (error) {
      setSelectedTicket(null);
      setSearchStatus('endpoint-error');
      setSearchMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel consultar a reserva agora. Tente novamente.'
      );
    }
  }

  function updateInput(field: keyof TicketSearchInput, value: string) {
    const shouldClearPreviousResult = field === 'locator' && value !== input.locator;

    setInput((current) => ({ ...current, [field]: value }));

    if (shouldClearPreviousResult) {
      setSelectedTicket(null);
      setSearchStatus('idle');
      setSearchMessage(null);
      setSaveMessage(null);
      setPdfError(null);
      return;
    }

    if (searchStatus === 'validation-error') {
      setSearchStatus(selectedTicket ? 'success' : 'idle');
      setSearchMessage(null);
    }
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

    const alreadySaved = savedTickets.some(
      (ticket) =>
        ticket.locator.toLowerCase() === selectedTicket.locator.toLowerCase() &&
        ticket.surname.toLowerCase() === selectedTicket.surname.toLowerCase()
    );
    const record = await ticketRepository.createTicket(selectedTicket);
    await refreshSavedTickets();
    const nextDiagnostics = getTicketRepositoryDiagnostics();
    setRepositoryDiagnostics(nextDiagnostics);

    setSaveMessage(
      alreadySaved
        ? `Reserva ${record.locator} ja estava salva.`
        : `Reserva ${record.locator} salva no repositório ${nextDiagnostics.activeRepository === 'supabase' ? 'Supabase' : 'local'}.`
    );
  }

  async function handleGeneratePdf() {
    try {
      setPdfError(null);
      await generateTicketPdf({ ticket: selectedTicket });
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : 'Nao foi possivel gerar o PDF.');
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Bilhetes"
        description="Consulta simulada por localizador e sobrenome para preparar a futura busca automatica de reservas."
        badge="Busca mockada"
      />

      <RepositoryDiagnosticsBanner diagnostics={repositoryDiagnostics} />

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Buscar reserva</h2>
          <p className="text-sm text-ink-500">
            Use localizador e sobrenome para simular o retorno dos detalhes do bilhete.
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
                placeholder={exampleTicket.locator}
              />
            </label>
            <label>
              <span className="text-sm font-semibold text-ink-700">Sobrenome</span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                disabled={isLoading}
                value={input.surname}
                onChange={(event) => updateInput('surname', event.target.value)}
                placeholder={exampleTicket.surname}
              />
            </label>
            <div className="flex items-end">
              <Button className="w-full lg:w-auto" disabled={!canSearch} type="submit">
                {isLoading ? (
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                ) : (
                  <Search size={16} aria-hidden="true" />
                )}
                {isLoading ? 'Buscando...' : 'Buscar reserva'}
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
                  Estamos consultando o endpoint interno com os dados informados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && selectedTicket ? (
        <TicketDetails
          ticket={selectedTicket}
          onGeneratePdf={handleGeneratePdf}
          onSaveTicket={handleSaveTicket}
          pdfError={pdfError}
          saveMessage={saveMessage}
        />
      ) : null}

      {!isLoading && !selectedTicket && searchStatus === 'not-found' ? (
        <Card>
          <CardContent>
            <EmptyState
              title="Reserva nao encontrada"
              description="Conferimos localizador e sobrenome, mas nenhum bilhete mockado corresponde aos dados informados. Revise os campos ou teste RM7LIS + Costa."
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
              description={searchMessage ?? 'O endpoint interno retornou um erro inesperado. Revise os dados e tente novamente.'}
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
              title="Aguardando consulta"
              description="Preencha os campos para visualizar os dados completos de uma reserva mockada."
              actionLabel={`${exampleTicket.locator} / ${exampleTicket.surname}`}
              icon={Plane}
            />
          </CardContent>
        </Card>
      ) : null}

      <SavedTicketsList tickets={savedTickets} repositoryMode={repositoryDiagnostics.activeRepository} />
    </section>
  );
}

type RepositoryDiagnosticsBannerProps = {
  diagnostics: TicketRepositoryDiagnostics;
};

function RepositoryDiagnosticsBanner({ diagnostics }: RepositoryDiagnosticsBannerProps) {
  const usingSupabase = diagnostics.activeRepository === 'supabase';

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-ink-900">Repositório de bilhetes</p>
        <p className="mt-1 text-sm text-ink-500">
          {usingSupabase
            ? 'Persistência conectada ao Supabase.'
            : 'Persistência usando armazenamento local de fallback.'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={usingSupabase ? 'green' : 'amber'}>
          {usingSupabase ? 'Supabase' : 'Local fallback'}
        </Badge>
        {diagnostics.isFallbackActive ? (
          <span className="text-xs font-medium text-amber-700">
            Dados salvos localmente até o Supabase ficar disponível.
          </span>
        ) : null}
      </div>
    </div>
  );
}

function validateSearchInput(input: TicketSearchInput) {
  const locator = input.locator.trim();
  const surname = input.surname.trim();

  if (!locator) {
    return 'Informe o localizador para buscar a reserva.';
  }

  if (!surname) {
    return 'Informe o sobrenome do passageiro para buscar a reserva.';
  }

  if (locator.length < 4 || locator.length > 10) {
    return 'O localizador deve ter entre 4 e 10 caracteres.';
  }

  if (surname.length < 2 || surname.length > 80) {
    return 'O sobrenome deve ter entre 2 e 80 caracteres.';
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
  onGeneratePdf: () => void;
  onSaveTicket: () => void;
  pdfError: string | null;
  saveMessage: string | null;
};

function TicketDetails({
  ticket,
  onGeneratePdf,
  onSaveTicket,
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
              Localizador {ticket.locator} · {ticket.airline} · Provider {ticket.provider}
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
          <p className="text-sm text-ink-500">Dados mockados para futura integracao.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="Passageiro" value={`${ticket.passenger} ${ticket.surname}`} />
          <InfoRow label="Companhia" value={ticket.airline} />
          <InfoRow label="Provider" value={ticket.provider} />
          <InfoRow label="Valor" value={formatCurrency(ticket.amount)} />
          <InfoRow label="Observacoes" value={ticket.observations} />
          {ticket.rawResponse ? <InfoRow label="Raw response" value="Disponivel no mock" /> : null}
          {saveMessage ? <p className="text-sm font-medium text-brand-700">{saveMessage}</p> : null}
          {pdfError ? <p className="text-sm font-medium text-red-600">{pdfError}</p> : null}
          <Button className="w-full" onClick={onSaveTicket}>
            <Save size={16} aria-hidden="true" />
            Salvar bilhete
          </Button>
          <Button className="w-full" variant="secondary" onClick={onGeneratePdf}>
            <FileText size={16} aria-hidden="true" />
            Gerar PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

type SavedTicketsListProps = {
  tickets: TicketRecord[];
  repositoryMode: 'supabase' | 'local';
};

function SavedTicketsList({ tickets, repositoryMode }: SavedTicketsListProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-ink-900">Bilhetes salvos</h2>
        <p className="text-sm text-ink-500">
          Registros carregados do repositório {repositoryMode === 'supabase' ? 'Supabase' : 'local'}.
        </p>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <EmptyState
            title="Nenhum bilhete salvo"
            description="Busque uma reserva mockada e use Salvar bilhete para registrar localmente."
            actionLabel="Persistencia local"
            icon={Save}
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="hidden grid-cols-[1.2fr_1fr_1fr_0.8fr] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
              <span>Passageiro</span>
              <span>Localizador</span>
              <span>Companhia</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-slate-200">
              {tickets.map((ticket) => (
                <div
                  className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.2fr_1fr_1fr_0.8fr] md:items-center"
                  key={`${ticket.locator}-${ticket.surname}`}
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
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
