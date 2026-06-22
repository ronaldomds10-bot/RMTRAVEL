import type {
  TicketRecord,
  TicketsTableInsert,
  TicketsTableRow,
  TicketsTableUpdate
} from '../../types/database';
import type {
  Ticket,
  TicketProviderSource,
  TicketSegment,
  TicketStatus
} from '../../types/ticket';

type SupabaseRepositoryErrorDetails = {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
};

type SupabaseResponse<T> = {
  data: T | null;
  error: SupabaseRepositoryErrorDetails | null;
};

type SupabaseListResponse<T> = {
  data: T[] | null;
  error: SupabaseRepositoryErrorDetails | null;
};

type SupabaseSelectQuery<T> = PromiseLike<SupabaseListResponse<T>> & {
  eq(column: string, value: string): SupabaseSelectQuery<T>;
  maybeSingle(): PromiseLike<SupabaseResponse<T>>;
  order(column: string, options: { ascending: boolean }): SupabaseSelectQuery<T>;
};

type SupabaseRpcQuery<T> = {
  maybeSingle(): PromiseLike<SupabaseResponse<T>>;
};

type SupabaseMutationQuery<T> = {
  eq(column: string, value: string): SupabaseMutationQuery<T>;
  select(columns?: string): {
    maybeSingle(): PromiseLike<SupabaseResponse<T>>;
    single(): PromiseLike<SupabaseResponse<T>>;
  };
};

type SupabaseInsertQuery<T> = {
  select(columns?: string): {
    single(): PromiseLike<SupabaseResponse<T>>;
  };
};

type SupabaseDeleteQuery = PromiseLike<SupabaseResponse<null>> & {
  eq(column: string, value: string): SupabaseDeleteQuery;
};

type SupabaseTicketsTable = {
  delete(): SupabaseDeleteQuery;
  insert(values: TicketsTableInsert): SupabaseInsertQuery<TicketsTableRow>;
  select(columns?: string): SupabaseSelectQuery<TicketsTableRow>;
  update(values: TicketsTableUpdate): SupabaseMutationQuery<TicketsTableRow>;
};

export type SupabaseTicketClient = {
  auth: {
    getUser(): Promise<{
      data: {
        user: {
          id: string;
        } | null;
      };
      error: SupabaseRepositoryErrorDetails | null;
    }>;
  };
  from(table: 'tickets'): SupabaseTicketsTable;
  rpc(
    fn: 'get_public_ticket_by_token',
    args: { lookup_public_token: string }
  ): SupabaseRpcQuery<Omit<TicketsTableRow, 'user_id' | 'raw_data'>>;
};

export type SupabaseTicketRepository = {
  listTickets(): Promise<TicketRecord[]>;
  getTicketById(id: string): Promise<TicketRecord | null>;
  getTicketByPublicToken(publicToken: string): Promise<TicketRecord | null>;
  createTicket(ticket: Ticket): Promise<TicketRecord>;
  updateTicket(id: string, ticket: Ticket): Promise<TicketRecord | null>;
  deleteTicket(id: string): Promise<boolean>;
};

function createRepositoryError(action: string, error: SupabaseRepositoryErrorDetails) {
  const detail = error.details ? ` (${error.details})` : '';
  return new Error(`${action}: ${error.message}${detail}`);
}

function assertNoError<T>(
  response: SupabaseResponse<T> | SupabaseListResponse<T>,
  action: string
) {
  if (response.error) {
    throw createRepositoryError(action, response.error);
  }
}

async function getCurrentUserId(client: SupabaseTicketClient) {
  const { data, error } = await client.auth.getUser();

  if (error) {
    throw createRepositoryError('Nao foi possivel identificar o usuario autenticado', error);
  }

  if (!data.user) {
    throw new Error('Usuario autenticado nao encontrado para persistir bilhetes.');
  }

  return data.user.id;
}

function parseTicketDateTime(date: string, time: string) {
  const [day, month, year] = date.split('/').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  if (!day || !month || !year || Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error(`Data ou horario invalido no bilhete: ${date} ${time}`);
  }

  return new Date(Date.UTC(year, month - 1, day, hour, minute)).toISOString();
}

function getFirstSegment(ticket: Ticket) {
  const [segment] = ticket.segments;

  if (!segment) {
    throw new Error('Bilhete sem segmentos nao pode ser persistido.');
  }

  return segment;
}

function getLastSegment(ticket: Ticket) {
  return ticket.segments[ticket.segments.length - 1];
}

function toTicketsTableInsert(ticket: Ticket, userId: string): TicketsTableInsert {
  const firstSegment = getFirstSegment(ticket);
  const lastSegment = getLastSegment(ticket);

  return {
    user_id: userId,
    passenger_name: ticket.passenger,
    passenger_surname: ticket.surname,
    locator: ticket.locator,
    airline: ticket.airline,
    provider: ticket.provider,
    status: ticket.status,
    origin: firstSegment.origin.iata,
    destination: lastSegment.destination.iata,
    departure_date: parseTicketDateTime(firstSegment.departure.date, firstSegment.departure.time),
    return_date:
      ticket.segments.length > 1
        ? parseTicketDateTime(lastSegment.arrival.date, lastSegment.arrival.time)
        : null,
    total_amount: ticket.amount,
    currency: ticket.currency,
    baggage: ticket.segments.map((segment) => ({
      segmentId: segment.id,
      flightNumber: segment.flightNumber,
      baggage: segment.baggage
    })),
    segments: ticket.segments,
    raw_data: ticket.rawResponse ?? null,
    notes: ticket.observations
  };
}

function toTicketsTableUpdate(ticket: Ticket): TicketsTableUpdate {
  const { user_id: _userId, ...insertable } = toTicketsTableInsert(ticket, 'unused');
  return insertable;
}

function isTicketSegmentArray(value: unknown): value is TicketSegment[] {
  return (
    Array.isArray(value) &&
    value.every(
      (segment) =>
        segment &&
        typeof segment === 'object' &&
        'origin' in segment &&
        'destination' in segment &&
        'departure' in segment &&
        'arrival' in segment
    )
  );
}

function toTicketRecord(row: TicketsTableRow): TicketRecord {
  const segments = isTicketSegmentArray(row.segments) ? row.segments : [];

  return {
    id: row.id,
    publicToken: row.public_token,
    passenger: row.passenger_name,
    surname: row.passenger_surname,
    locator: row.locator,
    airline: row.airline,
    provider: row.provider as TicketProviderSource,
    status: row.status as TicketStatus,
    amount: Number(row.total_amount),
    currency: row.currency as 'BRL',
    observations: row.notes ?? '',
    segments,
    rawResponse: row.raw_data ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function findExistingTicket(
  client: SupabaseTicketClient,
  ticket: Ticket
): Promise<TicketRecord | null> {
  const response = await client
    .from('tickets')
    .select('*')
    .eq('locator', ticket.locator)
    .eq('passenger_surname', ticket.surname)
    .maybeSingle();

  assertNoError(response, 'Nao foi possivel verificar duplicidade do bilhete');

  return response.data ? toTicketRecord(response.data) : null;
}

export function createSupabaseTicketRepository(
  client: SupabaseTicketClient
): SupabaseTicketRepository {
  return {
    async listTickets() {
      const response = await client
        .from('tickets')
        .select('*')
        .order('updated_at', { ascending: false });

      assertNoError(response, 'Nao foi possivel listar bilhetes no Supabase');

      return (response.data ?? []).map(toTicketRecord);
    },

    async getTicketById(id) {
      const response = await client
        .from('tickets')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      assertNoError(response, 'Nao foi possivel buscar o bilhete no Supabase');

      return response.data ? toTicketRecord(response.data) : null;
    },

    async getTicketByPublicToken(publicToken) {
      const response = await client
        .rpc('get_public_ticket_by_token', { lookup_public_token: publicToken })
        .maybeSingle();

      assertNoError(response, 'Nao foi possivel buscar o bilhete publico no Supabase');

      return response.data ? toTicketRecord({ ...response.data, user_id: '', raw_data: null }) : null;
    },

    async createTicket(ticket) {
      const existingTicket = await findExistingTicket(client, ticket);

      if (existingTicket) {
        return existingTicket;
      }

      const userId = await getCurrentUserId(client);
      const response = await client
        .from('tickets')
        .insert(toTicketsTableInsert(ticket, userId))
        .select('*')
        .single();

      assertNoError(response, 'Nao foi possivel criar o bilhete no Supabase');

      if (!response.data) {
        throw new Error('Supabase nao retornou o bilhete criado.');
      }

      return toTicketRecord(response.data);
    },

    async updateTicket(id, ticket) {
      const response = await client
        .from('tickets')
        .update(toTicketsTableUpdate(ticket))
        .eq('id', id)
        .select('*')
        .maybeSingle();

      assertNoError(response, 'Nao foi possivel atualizar o bilhete no Supabase');

      return response.data ? toTicketRecord(response.data) : null;
    },

    async deleteTicket(id) {
      const response = await client.from('tickets').delete().eq('id', id);

      assertNoError(response, 'Nao foi possivel remover o bilhete no Supabase');

      return true;
    }
  };
}
