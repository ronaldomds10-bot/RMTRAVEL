import type { Ticket, TicketProviderSource, TicketStatus } from '../../types/ticket';

export type ImportAirline = 'azul' | 'gol' | 'latam' | 'iberia' | 'american';

export type ImportEmissionInput = {
  airline: ImportAirline;
  recordLocator: string;
  passengerLastName: string;
};

export type ImportedEmission = {
  passengerName: string;
  passengerLastName: string;
  airline: string;
  recordLocator: string;
  ticketNumber: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  baggageInfo: string;
  bookingStatus: string;
};

type ImportEmissionApiResponse =
  | {
      data: ImportedEmission;
      error: null;
    }
  | {
      data: null;
      error: string;
      code?: string;
      airline?: string;
    };

const ticketProviderByAirline: Record<ImportAirline, TicketProviderSource> = {
  azul: 'azul',
  gol: 'consolidator',
  latam: 'latam',
  iberia: 'gds',
  american: 'consolidator'
};

function normalizeStatus(status: string): TicketStatus {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus.includes('cancel')) {
    return 'cancelado';
  }

  if (normalizedStatus.includes('pend')) {
    return 'pendente';
  }

  if (normalizedStatus.includes('confirm')) {
    return 'confirmado';
  }

  return 'emitido';
}

export async function importEmission(input: ImportEmissionInput) {
  const response = await fetch('/api/tickets/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  });
  const result = (await response.json()) as ImportEmissionApiResponse;

  if (!response.ok || result.error || !result.data) {
    throw new Error(result.error ?? 'Nao foi possivel importar a emissao.');
  }

  return result.data;
}

export function importedEmissionToTicket(
  emission: ImportedEmission,
  selectedAirline: ImportAirline
): Ticket {
  return {
    id: emission.ticketNumber || `IMP-${emission.recordLocator}`,
    passenger: emission.passengerName,
    surname: emission.passengerLastName,
    locator: emission.recordLocator,
    airline: emission.airline,
    provider: ticketProviderByAirline[selectedAirline],
    status: normalizeStatus(emission.bookingStatus),
    amount: 0,
    currency: 'BRL',
    observations: `Emissao importada automaticamente. Status da reserva: ${emission.bookingStatus}.`,
    segments: [
      {
        id: `SEG-${emission.ticketNumber || emission.recordLocator}-1`,
        origin: {
          iata: emission.origin,
          city: emission.origin
        },
        destination: {
          iata: emission.destination,
          city: emission.destination
        },
        departure: {
          date: emission.departureDate,
          time: emission.departureTime
        },
        arrival: {
          date: emission.arrivalDate,
          time: emission.arrivalTime
        },
        flightNumber: emission.flightNumber,
        baggage: {
          carryOn: emission.baggageInfo,
          checked: emission.baggageInfo
        }
      }
    ],
    rawResponse: {
      source: 'importEmission',
      emission
    }
  };
}
