import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleTicketSearch } from '../../src/services/tickets/searchTickets';

type TicketSearchRequest = IncomingMessage & {
  body?: unknown;
};

async function readJsonBody(request: TicketSearchRequest) {
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

export default async function handler(request: TicketSearchRequest, response: ServerResponse) {
  if (request.method !== 'POST') {
    sendJson(response, 405, {
      data: null,
      error: 'Metodo nao permitido.'
    });
    return;
  }

  try {
    const payload = await readJsonBody(request);
    const result = await handleTicketSearch(payload);
    sendJson(response, result.status, result.body);
  } catch {
    sendJson(response, 400, {
      data: null,
      error: 'Payload JSON invalido.'
    });
  }
}
