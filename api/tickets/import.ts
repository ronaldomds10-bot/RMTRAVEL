import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  availableEmissionAirlines,
  providerRouter
} from '../_lib/emissionProviders/providerRouter';
import {
  EmissionProviderError,
  type ImportAirline,
  type ImportEmissionInput
} from '../_lib/emissionProviders/types';

type ImportEmissionRequest = IncomingMessage & {
  body?: unknown;
};

async function readJsonBody(request: ImportEmissionRequest) {
  if (request.body !== undefined) {
    return request.body;
  }

  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

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
    return 'Selecione uma companhia aérea para importar a emissão.';
  }

  if (!recordLocator) {
    return 'Informe o código da reserva.';
  }

  if (!passengerLastName) {
    return 'Informe o sobrenome do passageiro.';
  }

  if (recordLocator.length < 4 || recordLocator.length > 10) {
    return 'O código da reserva deve ter entre 4 e 10 caracteres.';
  }

  if (passengerLastName.length < 2 || passengerLastName.length > 80) {
    return 'O sobrenome deve ter entre 2 e 80 caracteres.';
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
      error: 'Método não permitido.'
    });
    return;
  }

  try {
    const payload = await readJsonBody(request);
    const input = validateImportInput(payload);

    if (typeof input === 'string') {
      sendJson(response, 400, {
        data: null,
        error: input
      });
      return;
    }

    const emission = await providerRouter.importEmission(input);

    if (!emission) {
      sendJson(response, 404, {
        data: null,
        error: 'Emissão não encontrada para os dados informados.'
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
        error: error.message,
        code: error.code,
        airline: error.airline
      });
      return;
    }

    console.error('[RMTRAVEL] Ticket import API error', error);
    sendJson(response, 400, {
      data: null,
      error: 'Payload JSON inválido.'
    });
  }
}
