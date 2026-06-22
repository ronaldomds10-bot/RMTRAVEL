import type { TicketProvider } from './TicketProvider';
import type { TicketSearchApiResponse } from './searchTickets';
import { getAuthenticatedJsonHeaders } from '../authHeaders';

export const apiTicketProvider: TicketProvider = {
  provider: 'mock',
  async searchByLocator(input) {
    const response = await fetch('/api/tickets/search', {
      method: 'POST',
      headers: await getAuthenticatedJsonHeaders(),
      body: JSON.stringify(input)
    });

    const result = (await response.json()) as TicketSearchApiResponse;

    if (response.status === 404) {
      return null;
    }

    if (!response.ok || result.error) {
      throw new Error(result.error ?? 'Nao foi possivel buscar a reserva.');
    }

    return result.data;
  }
};
