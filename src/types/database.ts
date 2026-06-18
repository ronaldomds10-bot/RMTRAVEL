import type { Ticket } from './ticket';

export type TicketRecord = Ticket & {
  createdAt: string;
  updatedAt: string;
};

export type TicketsTableRow = {
  id: string;
  user_id: string;
  passenger_name: string;
  passenger_surname: string;
  locator: string;
  airline: string;
  provider: string;
  status: string;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string | null;
  total_amount: number;
  currency: string;
  baggage: unknown;
  segments: unknown;
  raw_data: unknown;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketsTableInsert = Omit<TicketsTableRow, 'id' | 'created_at' | 'updated_at'>;

export type TicketsTableUpdate = Partial<
  Omit<TicketsTableRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;
