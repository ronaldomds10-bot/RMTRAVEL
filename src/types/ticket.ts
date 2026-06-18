export type TicketSearchInput = {
  surname: string;
  locator: string;
  provider?: TicketProviderSource;
};

export type TicketStatus = 'confirmado' | 'pendente' | 'cancelado' | 'emitido';
export type TicketProviderSource = 'mock' | 'latam' | 'smiles' | 'azul' | 'gds' | 'consolidator';

export type Airport = {
  iata: string;
  city: string;
  terminal?: string;
};

export type SegmentDateTime = {
  date: string;
  time: string;
};

export type SegmentBaggage = {
  carryOn: string;
  checked: string;
  notes?: string;
};

export type TicketSegment = {
  id: string;
  origin: Airport;
  destination: Airport;
  departure: SegmentDateTime;
  arrival: SegmentDateTime;
  flightNumber: string;
  fareClass?: string;
  baggage: SegmentBaggage;
};

export type Ticket = {
  id: string;
  passenger: string;
  surname: string;
  locator: string;
  airline: string;
  provider: TicketProviderSource;
  status: TicketStatus;
  amount: number;
  currency: 'BRL';
  observations: string;
  segments: TicketSegment[];
  rawResponse?: unknown;
};
