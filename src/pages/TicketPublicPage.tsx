import { Download, MessageCircle, Plane } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { tickets } from '../data/tickets';
import { formatCurrency } from '../lib/formatters';
import { generateTicketPdf } from '../services/tickets/ticketPdf';
import { ticketRepository } from '../services/tickets/ticketRepositoryAdapter';
import type { Ticket, TicketSegment, TicketStatus } from '../types/ticket';

const statusTone: Record<TicketStatus, 'green' | 'blue' | 'amber' | 'slate'> = {
  confirmado: 'green',
  emitido: 'blue',
  pendente: 'amber',
  cancelado: 'slate'
};

export function TicketPublicPage() {
  const { id } = useParams();
  const normalizedId = (id ?? '').trim().toLowerCase();
  const mockTicket =
    tickets.find(
      (item) =>
        item.id.toLowerCase() === normalizedId || item.locator.toLowerCase() === normalizedId
    ) ?? null;
  const [savedTicket, setSavedTicket] = useState<Ticket | null>(null);
  const [isLoadingSavedTicket, setIsLoadingSavedTicket] = useState(!mockTicket);
  const ticket = mockTicket ?? savedTicket;

  useEffect(() => {
    if (!normalizedId || mockTicket) {
      setIsLoadingSavedTicket(false);
      setSavedTicket(null);
      return;
    }

    let isMounted = true;
    setIsLoadingSavedTicket(true);

    ticketRepository
      .listTickets()
      .then((records) => {
        if (!isMounted) {
          return;
        }

        setSavedTicket(
          records.find(
            (record) =>
              record.id.toLowerCase() === normalizedId ||
              record.locator.toLowerCase() === normalizedId
          ) ?? null
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingSavedTicket(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [mockTicket, normalizedId]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-ink-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-brand-700 text-sm font-bold text-white">
              RM
            </div>
            <div>
              <p className="text-lg font-semibold text-ink-900">RMTRAVEL</p>
              <p className="text-sm text-ink-500">Visualizacao publica do bilhete</p>
            </div>
          </div>
          <Link className="text-sm font-semibold text-brand-700 hover:text-brand-800" to="/platform/tickets">
            Voltar para consulta
          </Link>
        </header>

        {isLoadingSavedTicket ? (
          <TicketLoading />
        ) : ticket ? (
          <TicketPublicDetails ticket={ticket} />
        ) : (
          <TicketNotFound searchedId={id ?? ''} />
        )}
      </div>
    </main>
  );
}

function TicketLoading() {
  return (
    <Card>
      <CardContent className="flex min-h-80 items-center justify-center text-center">
        <div>
          <div className="mx-auto grid size-12 place-items-center rounded-lg bg-white text-brand-700 shadow-sm ring-1 ring-slate-200">
            <Plane className="animate-pulse" size={22} aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm font-semibold text-ink-900">Carregando bilhete</p>
        </div>
      </CardContent>
    </Card>
  );
}

type TicketPublicDetailsProps = {
  ticket: Ticket;
};

function TicketPublicDetails({ ticket }: TicketPublicDetailsProps) {
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  async function handleDownloadPdf() {
    try {
      setPdfError(null);
      setIsGeneratingPdf(true);
      await generateTicketPdf({ ticket });
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : 'Nao foi possivel baixar o PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <>
      <Card>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-brand-700">Bilhete RMTRAVEL</p>
              <h1 className="mt-2 text-3xl font-semibold text-ink-900">
                {ticket.passenger} {ticket.surname}
              </h1>
              <p className="mt-2 text-sm text-ink-500">
                Dados publicos do bilhete para conferencia da reserva.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Highlight label="Localizador" value={ticket.locator} />
              <Highlight label="Companhia" value={ticket.airline} />
              <Highlight label="Status" value={ticket.status} />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={statusTone[ticket.status]}>{ticket.status}</Badge>
              <Badge tone="slate">{ticket.provider}</Badge>
            </div>
            <div className="mt-5 space-y-3">
              <Button className="w-full" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                <Download size={16} aria-hidden="true" />
                {isGeneratingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
              </Button>
              <Button className="w-full" variant="secondary">
                <MessageCircle size={16} aria-hidden="true" />
                WhatsApp
              </Button>
            </div>
            {pdfError ? <p className="mt-3 text-sm font-medium text-red-600">{pdfError}</p> : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-ink-900">Trechos da reserva</h2>
            <p className="text-sm text-ink-500">Ida, volta e conexoes exibidas por segmento.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticket.segments.map((segment, index) => (
              <SegmentCard
                key={segment.id}
                segment={segment}
                label={resolveSegmentLabel(index, ticket.segments.length)}
              />
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-ink-900">Resumo</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Passageiro" value={`${ticket.passenger} ${ticket.surname}`} />
              <InfoRow label="Localizador" value={ticket.locator} />
              <InfoRow label="Companhia" value={ticket.airline} />
              <InfoRow label="Valor" value={formatCurrency(ticket.amount)} />
              <InfoRow label="Bilhete" value={ticket.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-ink-900">Observacoes</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-ink-700">{ticket.observations}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

type TicketNotFoundProps = {
  searchedId: string;
};

function TicketNotFound({ searchedId }: TicketNotFoundProps) {
  return (
    <Card>
      <CardContent className="flex min-h-80 items-center justify-center text-center">
        <div className="max-w-md">
          <div className="mx-auto grid size-12 place-items-center rounded-lg bg-white text-brand-700 shadow-sm ring-1 ring-slate-200">
            <Plane size={22} aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-ink-900">Bilhete nao encontrado</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Nao encontramos nenhum bilhete mockado para "{searchedId || 'sem identificador'}".
            Voce pode testar com TCK-2001 ou RM7LIS.
          </p>
          <Link to="/platform/tickets">
            <Button className="mt-5" variant="secondary">Voltar para consulta</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

type SegmentCardProps = {
  segment: TicketSegment;
  label: string;
};

function SegmentCard({ segment, label }: SegmentCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-white text-brand-700 shadow-sm ring-1 ring-slate-200">
            <Plane size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">{label}</p>
            <p className="text-sm text-ink-500">Voo {segment.flightNumber}</p>
          </div>
        </div>
        <Badge tone="blue">{segment.fareClass ?? 'Classe nao informada'}</Badge>
      </div>

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <RouteBlock
          label="Origem"
          iata={segment.origin.iata}
          city={segment.origin.city}
          terminal={segment.origin.terminal}
          date={segment.departure.date}
          time={segment.departure.time}
        />
        <div className="flex items-center gap-3 text-brand-700 md:px-6">
          <div className="h-px w-12 bg-brand-200" />
          <Plane size={20} aria-hidden="true" />
          <div className="h-px w-12 bg-brand-200" />
        </div>
        <RouteBlock
          alignRight
          label="Destino"
          iata={segment.destination.iata}
          city={segment.destination.city}
          terminal={segment.destination.terminal}
          date={segment.arrival.date}
          time={segment.arrival.time}
        />
      </div>

      <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 text-sm md:grid-cols-2">
        <InfoRow label="Bagagem de mao" value={segment.baggage.carryOn} />
        <InfoRow label="Bagagem despachada" value={segment.baggage.checked} />
        {segment.baggage.notes ? (
          <div className="md:col-span-2">
            <InfoRow label="Observacao de bagagem" value={segment.baggage.notes} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

type RouteBlockProps = {
  label: string;
  iata: string;
  city: string;
  terminal?: string;
  date: string;
  time: string;
  alignRight?: boolean;
};

function RouteBlock({ label, iata, city, terminal, date, time, alignRight = false }: RouteBlockProps) {
  return (
    <div className={alignRight ? 'md:text-right' : undefined}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-ink-900">{iata}</p>
      <p className="mt-1 text-sm text-ink-700">
        {city}
        {terminal ? ` | Terminal ${terminal}` : ''}
      </p>
      <p className="mt-1 text-sm text-ink-500">
        {date} | {time}
      </p>
    </div>
  );
}

type HighlightProps = {
  label: string;
  value: string;
};

function Highlight({ label, value }: HighlightProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink-900">{value}</p>
    </div>
  );
}

function resolveSegmentLabel(index: number, total: number) {
  if (total === 1) {
    return 'Trecho unico';
  }

  if (index === 0) {
    return 'Ida';
  }

  if (index === total - 1) {
    return 'Volta';
  }

  return `Conexao ${index}`;
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
