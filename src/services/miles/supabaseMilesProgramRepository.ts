import type {
  MilesProgramInput,
  MilesProgramRecord,
  MilesProgramsTableInsert,
  MilesProgramsTableRow,
  MilesProgramsTableUpdate
} from '../../types/miles';

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

type SupabaseMilesProgramsTable = {
  delete(): SupabaseDeleteQuery;
  insert(values: MilesProgramsTableInsert): SupabaseInsertQuery<MilesProgramsTableRow>;
  select(columns?: string): SupabaseSelectQuery<MilesProgramsTableRow>;
  update(values: MilesProgramsTableUpdate): SupabaseMutationQuery<MilesProgramsTableRow>;
};

export type SupabaseMilesProgramClient = {
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
  from(table: 'miles_programs'): SupabaseMilesProgramsTable;
};

export type SupabaseMilesProgramRepository = {
  listPrograms(): Promise<MilesProgramRecord[]>;
  createProgram(input: MilesProgramInput): Promise<MilesProgramRecord>;
  updateProgram(id: string, input: MilesProgramInput): Promise<MilesProgramRecord | null>;
  deleteProgram(id: string): Promise<boolean>;
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

async function getCurrentUserId(client: SupabaseMilesProgramClient) {
  const { data, error } = await client.auth.getUser();

  if (error) {
    throw createRepositoryError('Nao foi possivel identificar o usuario autenticado', error);
  }

  if (!data.user) {
    throw new Error('Usuario autenticado nao encontrado para persistir programas de milhas.');
  }

  return data.user.id;
}

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMilesProgramsTableInsert(
  input: MilesProgramInput,
  userId: string
): MilesProgramsTableInsert {
  return {
    user_id: userId,
    program_name: input.programName,
    type: input.type,
    balance: input.balance,
    account_holder: input.accountHolder,
    expiration_date: input.expirationDate || null,
    notes: input.notes || null,
    status: input.status
  };
}

function toMilesProgramsTableUpdate(input: MilesProgramInput): MilesProgramsTableUpdate {
  const { user_id: _userId, ...insertable } = toMilesProgramsTableInsert(input, 'unused');
  return insertable;
}

function toMilesProgramRecord(row: MilesProgramsTableRow): MilesProgramRecord {
  return {
    id: row.id,
    programName: row.program_name,
    type: row.type,
    balance: numberValue(row.balance),
    accountHolder: row.account_holder,
    expirationDate: row.expiration_date ?? '',
    notes: row.notes ?? '',
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createSupabaseMilesProgramRepository(
  client: SupabaseMilesProgramClient
): SupabaseMilesProgramRepository {
  return {
    async listPrograms() {
      const userId = await getCurrentUserId(client);
      const response = await client
        .from('miles_programs')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      assertNoError(response, 'Nao foi possivel listar programas de milhas');

      return (response.data ?? []).map(toMilesProgramRecord);
    },

    async createProgram(input) {
      const userId = await getCurrentUserId(client);
      const response = await client
        .from('miles_programs')
        .insert(toMilesProgramsTableInsert(input, userId))
        .select('*')
        .single();

      assertNoError(response, 'Nao foi possivel criar o programa de milhas');

      if (!response.data) {
        throw new Error('Supabase nao retornou o programa de milhas criado.');
      }

      return toMilesProgramRecord(response.data);
    },

    async updateProgram(id, input) {
      const userId = await getCurrentUserId(client);
      const response = await client
        .from('miles_programs')
        .update(toMilesProgramsTableUpdate(input))
        .eq('id', id)
        .eq('user_id', userId)
        .select('*')
        .maybeSingle();

      assertNoError(response, 'Nao foi possivel atualizar o programa de milhas');

      return response.data ? toMilesProgramRecord(response.data) : null;
    },

    async deleteProgram(id) {
      const userId = await getCurrentUserId(client);
      const response = await client.from('miles_programs').delete().eq('id', id).eq('user_id', userId);

      assertNoError(response, 'Nao foi possivel excluir o programa de milhas');

      return true;
    }
  };
}
