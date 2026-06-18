import type { IncomingMessage, ServerResponse } from 'node:http';

type TicketSearchInput = {
  locator: string;
  surname: string;
};

type Ticket = {
  id: string;
  passenger: string;
  surname: string;
  locator: string;
  airline: string;
  provider: 'mock' | 'latam' | 'smiles' | 'azul' | 'gds' | 'consolidator';
  status: 'confirmado' | 'pendente' | 'cancelado' | 'emitido';
  amount: number;
  currency: 'BRL';
  observations: string;
  segments: Array<{
    id: string;
    origin: {
      iata: string;
      city: string;
      terminal?: string;
    };
    destination: {
      iata: string;
      city: string;
      terminal?: string;
    };
    departure: {
      date: string;
      time: string;
    };
    arrival: {
      date: string;
      time: string;
    };
    flightNumber: string;
    fareClass?: string;
    baggage: {
      carryOn: string;
      checked: string;
      notes?: string;
    };
  }>;
  rawResponse?: unknown;
};

type TicketSearchRequest = IncomingMessage & {
  body?: unknown;
};

const tickets: Ticket[] = [
  {
    id: 'TCK-2001',
    passenger: 'Marina',
    surname: 'Costa',
    locator: 'RM7LIS',
    airline: 'TAP Air Portugal',
    provider: 'mock',
    status: 'emitido',
    amount: 4820,
    currency: 'BRL',
    observations: 'Assento corredor solicitado. Verificar documentacao para conexao.',
    segments: [
      {
        id: 'SEG-2001-1',
        origin: { iata: 'GRU', city: 'Sao Paulo', terminal: '3' },
        destination: { iata: 'LIS', city: 'Lisboa', terminal: '1' },
        departure: { date: '24/07/2026', time: '22:05' },
        arrival: { date: '25/07/2026', time: '11:35' },
        flightNumber: 'TP084',
        fareClass: 'Economy Classic',
        baggage: {
          carryOn: '1 bagagem de mao de 10kg',
          checked: '1 mala despachada de 23kg',
          notes: 'Franquia incluida na tarifa.'
        }
      },
      {
        id: 'SEG-2001-2',
        origin: { iata: 'LIS', city: 'Lisboa', terminal: '1' },
        destination: { iata: 'ORY', city: 'Paris', terminal: '3' },
        departure: { date: '29/07/2026', time: '14:15' },
        arrival: { date: '29/07/2026', time: '17:45' },
        flightNumber: 'TP436',
        fareClass: 'Economy Classic',
        baggage: {
          carryOn: '1 bagagem de mao de 10kg',
          checked: '1 mala despachada de 23kg'
        }
      }
    ],
    rawResponse: {
      source: 'mock',
      locator: 'RM7LIS',
      schemaVersion: 1
    }
  },
  {
    id: 'TCK-2002',
    passenger: 'Rafael',
    surname: 'Nogueira',
    locator: 'RM8BUE',
    airline: 'LATAM Airlines',
    provider: 'latam',
    status: 'confirmado',
    amount: 1890,
    currency: 'BRL',
    observations: 'Cliente pediu opcoes de hotel proximas ao centro.',
    segments: [
      {
        id: 'SEG-2002-1',
        origin: { iata: 'CNF', city: 'Belo Horizonte', terminal: '1' },
        destination: { iata: 'AEP', city: 'Buenos Aires' },
        departure: { date: '12/08/2026', time: '08:40' },
        arrival: { date: '12/08/2026', time: '15:10' },
        flightNumber: 'LA8120',
        fareClass: 'Light',
        baggage: {
          carryOn: '1 bagagem de mao de 10kg',
          checked: 'Sem bagagem despachada',
          notes: 'Adicionar mala antes da emissao se necessario.'
        }
      }
    ],
    rawResponse: {
      source: 'latam',
      environment: 'mock'
    }
  },
  {
    id: 'TCK-2003',
    passenger: 'Camila',
    surname: 'Rocha',
    locator: 'RM9MIA',
    airline: 'American Airlines',
    provider: 'consolidator',
    status: 'pendente',
    amount: 5360,
    currency: 'BRL',
    observations: 'Reserva aguardando validacao de milhas antes da emissao.',
    segments: [
      {
        id: 'SEG-2003-1',
        origin: { iata: 'FOR', city: 'Fortaleza' },
        destination: { iata: 'MIA', city: 'Miami' },
        departure: { date: '03/09/2026', time: '01:20' },
        arrival: { date: '03/09/2026', time: '08:55' },
        flightNumber: 'AA776',
        fareClass: 'Main Cabin',
        baggage: {
          carryOn: '1 bagagem de mao + item pessoal',
          checked: '2 malas despachadas de 23kg'
        }
      }
    ],
    rawResponse: {
      source: 'consolidator',
      pendingMilesValidation: true
    }
  }
];

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

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function getStringField(payload: unknown, field: keyof TicketSearchInput) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const value = (payload as Record<string, unknown>)[field];
  return typeof value === 'string' ? value.trim() : null;
}

function validateTicketSearchInput(payload: unknown): TicketSearchInput | string {
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

function searchByLocator(input: TicketSearchInput) {
  const locator = normalize(input.locator);
  const surname = normalize(input.surname);

  return (
    tickets.find(
      (ticket) => normalize(ticket.locator) === locator && normalize(ticket.surname) === surname
    ) ?? null
  );
}

async function handleTicketSearch(payload: unknown) {
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

  const ticket = searchByLocator(input);

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
