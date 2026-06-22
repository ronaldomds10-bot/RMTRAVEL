import type { IncomingMessage, ServerResponse } from 'node:http';
import { readJsonBody } from '../_lib/readJsonBody';
import {
  availableEmissionAirlines,
  providerRouter
} from '../_lib/emissionProviders/providerRouter';
import {
  EmissionProviderError,
  type ImportAirline,
  type ImportEmissionInput
} from '../_lib/emissionProviders/types';
import { hasValidSupabaseSession } from '../_lib/supabaseServerAuth';

type ImportEmissionRequest = IncomingMessage & {
  body?: unknown;
};

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

function getStringField(payload: unknown, field: keyof ImportEmissionInput) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const value = (payload as Record<string, unknown>)[field];
  return typeof value === 'string' ? value.trim() : null;
}

function validateImportInput(payload: unknown): ImportEmissionInput | string {
  const airline = getStringField(payload, 'airline');
  const recordLocator = getStringField(payload, 'recordLocator');
  const passengerLastName = getStringField(payload, 'passengerLastName');

  if (!airline || !availableEmissionAirlines.includes(airline as ImportAirline)) {
    return 'Dados de importacao invalidos.';
  }

  if (!recordLocator || !/^[a-z0-9]{3,12}$/i.test(recordLocator)) {
    return 'Dados de importacao invalidos.';
  }

  if (!passengerLastName || passengerLastName.length < 2 || passengerLastName.length > 80) {
    return 'Dados de importacao invalidos.';
  }

  return {
    airline: airline as ImportAirline,
    recordLocator: recordLocator.toUpperCase(),
    passengerLastName
  };
}

export default async function handler(request: ImportEmissionRequest, response: ServerResponse) {
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
    const input = validateImportInput(payload);

    if (typeof input === 'string') {
      sendJson(response, 400, {
        data: null,
        error: input,
        code: 'invalid_payload'
      });
      return;
    }

    const emission = await providerRouter.importEmission(input);

    if (!emission) {
      sendJson(response, 404, {
        data: null,
        error: 'Emissao nao encontrada para os dados informados.'
      });
      return;
    }

    sendJson(response, 200, {
      data: emission,
      error: null
    });
  } catch (error) {
    if (error instanceof EmissionProviderError) {
      sendJson(response, error.code === 'not_configured' ? 501 : 502, {
        data: null,
        error: 'Servico indisponivel.',
        code: error.code
      });
      return;
    }

    sendJson(response, 400, {
      data: null,
      error: 'Payload JSON invalido.',
      code: 'invalid_payload'
    });
  }
}
