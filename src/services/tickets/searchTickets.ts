import type { Ticket, TicketSearchInput } from '../../types/ticket';
import { mockTicketProvider } from './mockTicketProvider';

export type TicketSearchApiResponse =
  | {
      data: Ticket;
      error: null;
    }
  | {
      data: null;
      error: string;
    };

export type TicketSearchApiResult = {
  status: number;
  body: TicketSearchApiResponse;
};

function getStringField(payload: unknown, field: keyof TicketSearchInput) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const value = (payload as Record<string, unknown>)[field];
  return typeof value === 'string' ? value.trim() : null;
}

export function validateTicketSearchInput(payload: unknown): TicketSearchInput | string {
  const locator = getStringField(payload, 'locator');
  const surname = getStringField(payload, 'surname');

  if (!locator) {
    return 'Localizador e obrigatorio.';
  }

  if (!surname) {
    return 'Sobrenome e obrigatorio.';
  }

  if (locator.length < 4 || locator.length > 10) {
    return 'Localizador deve ter entre 4 e 10 caracteres.';
  }

  if (surname.length < 2 || surname.length > 80) {
    return 'Sobrenome deve ter entre 2 e 80 caracteres.';
  }

  return {
    locator: locator.toUpperCase(),
    surname
  };
}

export async function handleTicketSearch(payload: unknown): Promise<TicketSearchApiResult> {
  const input = validateTicketSearchInput(payload);

  if (typeof input === 'string') {
    return {
      status: 400,
      body: {
        data: null,
        error: input
      }
    };
  }

  const ticket = await mockTicketProvider.searchByLocator(input);

  if (!ticket) {
    return {
      status: 404,
      body: {
        data: null,
        error: 'Reserva nao encontrada.'
      }
    };
  }

  return {
    status: 200,
    body: {
      data: ticket,
      error: null
    }
  };
}
