import type { IncomingMessage, ServerResponse } from 'node:http';
import { readJsonBody } from '../_lib/readJsonBody';
import { validateProviderEnv } from '../_lib/providerEnv';
import { hasValidSupabaseSession } from '../_lib/supabaseServerAuth';
import { handleTicketSearch } from '../../src/services/tickets/searchTickets';
import { availableTicketProviders } from '../../src/services/tickets/providers/providerRouter';
import type { TicketProviderSource, TicketSearchInput } from '../../src/types/ticket';

type TicketSearchRequest = IncomingMessage & {
  body?: unknown;
};

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

function getStringField(payload: unknown, field: keyof TicketSearchInput) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const value = (payload as Record<string, unknown>)[field];
  return typeof value === 'string' ? value.trim() : null;
}

function validatePayload(payload: unknown): TicketSearchInput | string {
  const locator = getStringField(payload, 'locator');
  const surname = getStringField(payload, 'surname');
  const provider = getStringField(payload, 'provider');

  if (!locator || !/^[a-z0-9]{3,12}$/i.test(locator)) {
    return 'Dados de busca invalidos.';
  }

  if (!surname || surname.length < 2 || surname.length > 80) {
    return 'Dados de busca invalidos.';
  }

  if (provider && !availableTicketProviders.includes(provider as TicketProviderSource)) {
    return 'Dados de busca invalidos.';
  }

  return {
    locator: locator.toUpperCase(),
    surname,
    provider: provider ? (provider as TicketProviderSource) : 'mock'
  };
}

export default async function handler(request: TicketSearchRequest, response: ServerResponse) {
  if (request.method !== 'POST') {
    sendJson(response, 405, {
      data: null,
      error: 'Metodo nao permitido.'
    });
    return;
  }

  try {
    const isAuthenticated = await hasValidSupabaseSession(request);

    if (!isAuthenticated) {
      sendJson(response, 401, {
        data: null,
        error: 'Nao autorizado.',
        code: 'unauthorized'
      });
      return;
    }

    const payload = await readJsonBody(request);
    const input = validatePayload(payload);

    if (typeof input === 'string') {
      sendJson(response, 400, {
        data: null,
        error: input,
        code: 'invalid_payload'
      });
      return;
    }

    const envStatus = validateProviderEnv(input.provider);

    if (!envStatus.ok) {
      sendJson(response, 501, {
        data: null,
        error: 'Servico indisponivel.',
        code: envStatus.code
      });
      return;
    }

    const result = await handleTicketSearch(input);

    if (result.status >= 500) {
      const code = result.body.error && 'code' in result.body ? result.body.code : 'provider_error';

      sendJson(response, result.status, {
        data: null,
        error: 'Servico indisponivel.',
        code
      });
      return;
    }

    sendJson(response, result.status, result.body);
  } catch {
    sendJson(response, 400, {
      data: null,
      error: 'Payload JSON invalido.',
      code: 'invalid_payload'
    });
  }
}
