import type {
  Customer,
  CustomerDocumentType,
  CustomerRecord,
  CustomerStatus,
  CustomerTag,
  CustomerType
} from '../../types/customer';

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

type CustomerTableRow = {
  id: string;
  user_id: string;
  name: string;
  document: string | null;
  customer_type: string;
  email: string | null;
  phone: string | null;
  preferred_channel: string;
  city: string | null;
  state: string | null;
  country: string | null;
  status: string;
  tags: unknown;
  travel_profile: unknown;
  financial: unknown;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type CustomerTableInsert = Omit<CustomerTableRow, 'id' | 'created_at' | 'updated_at'>;
type CustomerTableUpdate = Partial<
  Omit<CustomerTableRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

type SupabaseCustomersTable = {
  delete(): SupabaseDeleteQuery;
  insert(values: CustomerTableInsert): SupabaseInsertQuery<CustomerTableRow>;
  select(columns?: string): SupabaseSelectQuery<CustomerTableRow>;
  update(values: CustomerTableUpdate): SupabaseMutationQuery<CustomerTableRow>;
};

export type SupabaseCustomerClient = {
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
  from(table: 'customers'): SupabaseCustomersTable;
};

export type SupabaseCustomerRepository = {
  listCustomers(): Promise<CustomerRecord[]>;
  getCustomerById(id: string): Promise<CustomerRecord | null>;
  createCustomer(customer: Customer): Promise<CustomerRecord>;
  updateCustomer(id: string, customer: Customer): Promise<CustomerRecord | null>;
  deleteCustomer(id: string): Promise<boolean>;
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

async function getCurrentUserId(client: SupabaseCustomerClient) {
  const { data, error } = await client.auth.getUser();

  if (error) {
    throw createRepositoryError('Nao foi possivel identificar o usuario autenticado', error);
  }

  if (!data.user) {
    throw new Error('Usuario autenticado nao encontrado para persistir clientes.');
  }

  return data.user.id;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function booleanValue(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toCustomerTableInsert(customer: Customer, userId: string): CustomerTableInsert {
  return {
    user_id: userId,
    name: customer.personal.fullName,
    document: customer.personal.documentNumber,
    customer_type: customer.personal.type,
    email: customer.contact.email,
    phone: customer.contact.phone,
    preferred_channel: customer.contact.preferredChannel,
    city: customer.address.city,
    state: customer.address.state,
    country: customer.address.country,
    status: customer.travelProfile.status,
    tags: customer.travelProfile.tags,
    travel_profile: {
      documentType: customer.personal.documentType,
      lastInteraction: customer.travelProfile.lastInteraction,
      nextAction: customer.travelProfile.nextAction,
      tripInProgress: customer.travelProfile.tripInProgress,
      preferredDestinations: customer.travelProfile.preferredDestinations
    },
    financial: customer.financial,
    notes: customer.notes
  };
}

function toCustomerTableUpdate(customer: Customer): CustomerTableUpdate {
  const { user_id: _userId, ...insertable } = toCustomerTableInsert(customer, 'unused');
  return insertable;
}

function toCustomerRecord(row: CustomerTableRow): CustomerRecord {
  const travelProfile = objectValue(row.travel_profile);
  const financial = objectValue(row.financial);

  return {
    id: row.id,
    personal: {
      fullName: row.name,
      documentType: stringValue(travelProfile.documentType, 'CPF') as CustomerDocumentType,
      documentNumber: row.document ?? '',
      type: row.customer_type as CustomerType
    },
    contact: {
      email: row.email ?? '',
      phone: row.phone ?? '',
      preferredChannel: row.preferred_channel as Customer['contact']['preferredChannel']
    },
    address: {
      city: row.city ?? '',
      state: row.state ?? '',
      country: row.country ?? 'Brasil'
    },
    travelProfile: {
      status: row.status as CustomerStatus,
      tags: stringArray(row.tags) as CustomerTag[],
      lastInteraction: stringValue(travelProfile.lastInteraction),
      nextAction: stringValue(travelProfile.nextAction),
      tripInProgress: booleanValue(travelProfile.tripInProgress),
      preferredDestinations: stringArray(travelProfile.preferredDestinations)
    },
    financial: {
      openAmount: numberValue(financial.openAmount),
      currency: stringValue(financial.currency, 'BRL') as 'BRL',
      hasPendingPayment: booleanValue(financial.hasPendingPayment)
    },
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createSupabaseCustomerRepository(
  client: SupabaseCustomerClient
): SupabaseCustomerRepository {
  return {
    async listCustomers() {
      const response = await client
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      assertNoError(response, 'Nao foi possivel listar clientes no Supabase');

      return (response.data ?? []).map(toCustomerRecord);
    },

    async getCustomerById(id) {
      const response = await client
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      assertNoError(response, 'Nao foi possivel buscar o cliente no Supabase');

      return response.data ? toCustomerRecord(response.data) : null;
    },

    async createCustomer(customer) {
      const userId = await getCurrentUserId(client);
      const response = await client
        .from('customers')
        .insert(toCustomerTableInsert(customer, userId))
        .select('*')
        .single();

      assertNoError(response, 'Nao foi possivel criar o cliente no Supabase');

      if (!response.data) {
        throw new Error('Supabase nao retornou o cliente criado.');
      }

      return toCustomerRecord(response.data);
    },

    async updateCustomer(id, customer) {
      const userId = await getCurrentUserId(client);
      const response = await client
        .from('customers')
        .update(toCustomerTableUpdate(customer))
        .eq('id', id)
        .eq('user_id', userId)
        .select('*')
        .maybeSingle();

      assertNoError(response, 'Nao foi possivel atualizar o cliente no Supabase');

      return response.data ? toCustomerRecord(response.data) : null;
    },

    async deleteCustomer(id) {
      const userId = await getCurrentUserId(client);
      const response = await client.from('customers').delete().eq('id', id).eq('user_id', userId);

      assertNoError(response, 'Nao foi possivel remover o cliente no Supabase');

      return true;
    }
  };
}
