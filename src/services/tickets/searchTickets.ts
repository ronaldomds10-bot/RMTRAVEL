import type { Ticket, TicketProviderSource, TicketSearchInput } from '../../types/ticket';
import { availableTicketProviders, providerRouter } from './providers/providerRouter';
import { TicketProviderError } from './providers/types';

export type TicketSearchApiResponse =
  | {
      data: Ticket;
      error: null;
    }
  | {
      data: null;
      error: string;
      code?: string;
      provider?: TicketProviderSource;
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
  const provider = getStringField(payload, 'provider');

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

  if (provider && !availableTicketProviders.includes(provider as TicketProviderSource)) {
    return 'Provider de busca invalido.';
  }

  return {
    locator: locator.toUpperCase(),
    surname,
    provider: provider ? (provider as TicketProviderSource) : 'mock'
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

  let ticket: Ticket | null;

  try {
    ticket = await providerRouter.searchByLocator(input);
  } catch (error) {
    if (error instanceof TicketProviderError) {
      return {
        status: error.code === 'not_configured' ? 501 : 502,
        body: {
          data: null,
          error: 'Servico indisponivel.',
          code: error.code
        }
      };
    }

    throw error;
  }

  if (!ticket) {
    return {
      status: 404,
      body: {
        data: null,
        error: 'Reserva nao encontrada.'
      }
    };
  }

  const { rawResponse: _rawResponse, ...safeTicket } = ticket;

  return {
    status: 200,
    body: {
      data: safeTicket,
      error: null
    }
  };
}
