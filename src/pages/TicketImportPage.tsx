import { CheckCircle2, ExternalLink, FileText, Loader2, Plane, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { cn } from '../lib/cn';
import {
  importEmission,
  importedEmissionToTicket,
  type ImportAirline
} from '../services/tickets/importEmission';
import { generateTicketPdf } from '../services/tickets/ticketPdf';
import { ticketRepository } from '../services/tickets/ticketRepositoryAdapter';
import type { TicketRecord } from '../types/database';

type AirlineOption = {
  id: ImportAirline;
  label: string;
  description: string;
};

const airlineOptions: AirlineOption[] = [
  { id: 'azul', label: 'Azul', description: 'Importacao via provider Azul.' },
  { id: 'gol', label: 'GOL', description: 'Importacao via provider GOL.' },
  { id: 'latam', label: 'LATAM', description: 'Importacao via provider LATAM.' },
  { id: 'iberia', label: 'Iberia', description: 'Importacao via provider Iberia.' },
  {
    id: 'american',
    label: 'American Airlines',
    description: 'Importacao via provider American.'
  }
];

type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

export function TicketImportPage() {
  const [selectedAirline, setSelectedAirline] = useState<ImportAirline>('azul');
  const [recordLocator, setRecordLocator] = useState('');
  const [passengerLastName, setPassengerLastName] = useState('');
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [savedTicket, setSavedTicket] = useState<TicketRecord | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const isLoading = status === 'loading';
  const canSubmit = recordLocator.trim().length > 0 && passengerLastName.trim().length > 0 && !isLoading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setStatus('error');
      setMessage('Informe companhia, codigo da reserva e sobrenome para importar.');
      return;
    }

    try {
      setStatus('loading');
      setMessage(null);
      setSavedTicket(null);

      const emission = await importEmission({
        airline: selectedAirline,
        recordLocator,
        passengerLastName
      });
      const ticket = importedEmissionToTicket(emission, selectedAirline);
      const record = await ticketRepository.createTicket(ticket);

      setSavedTicket(record);
      setStatus('success');
      setMessage(`Emissao ${record.locator} importada e salva em bilhetes.`);
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel importar a emissao neste momento.'
      );
    }
  }

  async function handleGeneratePdf() {
    if (!savedTicket) {
      setMessage('Importe uma emissao antes de gerar o PDF.');
      return;
    }

    try {
      setIsGeneratingPdf(true);
      setMessage(null);
      await generateTicketPdf({ ticket: savedTicket });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel gerar o PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Importe sua emissão com o código da reserva"
        description="Agora é possível importar suas emissões diretamente com os dados das companhias aéreas"
        badge="Importar emissão"
      />

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Companhia aérea</h2>
          <p className="text-sm text-ink-500">
            Selecione a companhia e informe o localizador com o sobrenome do passageiro.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {airlineOptions.map((airline) => {
                const isSelected = selectedAirline === airline.id;

                return (
                  <button
                    className={cn(
                      'min-h-32 rounded-lg border bg-white p-4 text-left transition hover:border-brand-300 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700',
                      isSelected
                        ? 'border-brand-500 bg-brand-50 shadow-sm ring-2 ring-brand-100'
                        : 'border-slate-200'
                    )}
                    disabled={isLoading}
                    key={airline.id}
                    onClick={() => setSelectedAirline(airline.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid size-10 place-items-center rounded-lg bg-slate-100 text-brand-700">
                        <Plane size={18} aria-hidden="true" />
                      </div>
                      {isSelected ? <CheckCircle2 className="text-brand-700" size={18} /> : null}
                    </div>
                    <p className="mt-4 text-sm font-semibold text-ink-900">{airline.label}</p>
                    <p className="mt-1 text-xs leading-5 text-ink-500">{airline.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
              <label>
                <span className="text-sm font-semibold text-ink-700">record_locator</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm uppercase text-ink-900 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                  disabled={isLoading}
                  onChange={(event) => setRecordLocator(event.target.value.toUpperCase())}
                  placeholder="RM7LIS"
                  value={recordLocator}
                />
              </label>
              <label>
                <span className="text-sm font-semibold text-ink-700">passenger_last_name</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                  disabled={isLoading}
                  onChange={(event) => setPassengerLastName(event.target.value)}
                  placeholder="Costa"
                  value={passengerLastName}
                />
              </label>
              <div className="flex items-end">
                <Button className="w-full lg:w-auto" disabled={!canSubmit} type="submit">
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                  ) : (
                    <Search size={16} aria-hidden="true" />
                  )}
                  {isLoading ? 'Buscando...' : 'Buscar emissão'}
                </Button>
              </div>
            </div>
          </form>

          {message ? (
            <div
              className={cn(
                'mt-5 rounded-lg border px-4 py-3 text-sm',
                status === 'success'
                  ? 'border-brand-200 bg-brand-50 text-brand-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              )}
              role="status"
            >
              <p className="font-semibold">
                {status === 'success' ? 'Emissao importada' : 'Importacao indisponivel'}
              </p>
              <p className="mt-1">{message}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {savedTicket ? (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink-900">
                {savedTicket.passenger} {savedTicket.surname}
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                {savedTicket.airline} · Localizador {savedTicket.locator}
              </p>
            </div>
            <Badge tone="green">{savedTicket.status}</Badge>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <InfoBlock label="Bilhete" value={savedTicket.id} />
              <InfoBlock label="Voo" value={savedTicket.segments[0]?.flightNumber ?? 'N/A'} />
              <InfoBlock
                label="Rota"
                value={`${savedTicket.segments[0]?.origin.iata ?? '-'} → ${
                  savedTicket.segments[0]?.destination.iata ?? '-'
                }`}
              />
            </div>
            <Link to={`/ticket/${savedTicket.id}`}>
              <Button className="w-full" variant="secondary">
                <ExternalLink size={16} aria-hidden="true" />
                Abrir público
              </Button>
            </Link>
            <Button className="w-full" disabled={isGeneratingPdf} onClick={handleGeneratePdf}>
              <FileText size={16} aria-hidden="true" />
              {isGeneratingPdf ? 'Gerando...' : 'Gerar PDF'}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}

type InfoBlockProps = {
  label: string;
  value: string;
};

function InfoBlock({ label, value }: InfoBlockProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-ink-900">{value}</p>
    </div>
  );
}
