import { tickets } from '../../../data/tickets';
import type { TicketSearchProvider } from './types';

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export const mockProvider: TicketSearchProvider = {
  provider: 'mock',
  async searchByLocator(input) {
    const locator = normalize(input.locator);
    const surname = normalize(input.surname);

    return (
      tickets.find(
        (ticket) => normalize(ticket.locator) === locator && normalize(ticket.surname) === surname
      ) ?? null
    );
  }
};
