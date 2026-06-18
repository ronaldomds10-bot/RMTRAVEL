import type { Ticket, TicketSearchInput } from '../../types/ticket';

export interface TicketProvider {
  searchByLocator(input: TicketSearchInput): Promise<Ticket | null>;
}
