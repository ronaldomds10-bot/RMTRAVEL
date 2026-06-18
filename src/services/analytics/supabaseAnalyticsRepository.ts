import type { AnalyticsMovement, AnalyticsSummary } from '../../types/analytics';

type SupabaseRepositoryErrorDetails = {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
};

type SupabaseListResponse<T> = {
  data: T[] | null;
  error: SupabaseRepositoryErrorDetails | null;
};

type SupabaseSelectQuery<T> = PromiseLike<SupabaseListResponse<T>> & {
  eq(column: string, value: string): SupabaseSelectQuery<T>;
  order(column: string, options: { ascending: boolean }): SupabaseSelectQuery<T>;
};

type AnalyticsTicketRow = {
  id: string;
  passenger_name: string;
  passenger_surname: string;
  locator: string;
  status: string;
  total_amount: number | string;
  updated_at: string;
};

type AnalyticsCustomerRow = {
  id: string;
  name: string;
  status: string | null;
  updated_at: string;
};

type AnalyticsSaleRow = {
  id: string;
  customer_name: string;
  ticket_locator: string | null;
  sale_amount: number | string;
  status: string;
  updated_at: string;
};

type SupabaseAnalyticsTableMap = {
  tickets: AnalyticsTicketRow;
  customers: AnalyticsCustomerRow;
  sales: AnalyticsSaleRow;
};

export type SupabaseAnalyticsClient = {
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
  from<TableName extends keyof SupabaseAnalyticsTableMap>(
    table: TableName
  ): {
    select(columns?: string): SupabaseSelectQuery<SupabaseAnalyticsTableMap[TableName]>;
  };
};

export type SupabaseAnalyticsRepository = {
  getAnalyticsSummary(): Promise<AnalyticsSummary>;
};

function createRepositoryError(action: string, error: SupabaseRepositoryErrorDetails) {
  const detail = error.details ? ` (${error.details})` : '';
  return new Error(`${action}: ${error.message}${detail}`);
}

function assertNoError<T>(response: SupabaseListResponse<T>, action: string) {
  if (response.error) {
    throw createRepositoryError(action, response.error);
  }
}

async function getCurrentUserId(client: SupabaseAnalyticsClient) {
  const { data, error } = await client.auth.getUser();

  if (error) {
    throw createRepositoryError('Nao foi possivel identificar o usuario autenticado', error);
  }

  if (!data.user) {
    throw new Error('Usuario autenticado nao encontrado para carregar analises.');
  }

  return data.user.id;
}

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toSaleMovement(row: AnalyticsSaleRow): AnalyticsMovement {
  return {
    id: row.id,
    type: 'sale',
    title: row.customer_name,
    description: row.ticket_locator ? `Venda vinculada ao localizador ${row.ticket_locator}` : 'Venda registrada',
    amount: numberValue(row.sale_amount),
    status: row.status,
    updatedAt: row.updated_at
  };
}

function toTicketMovement(row: AnalyticsTicketRow): AnalyticsMovement {
  return {
    id: row.id,
    type: 'ticket',
    title: `${row.passenger_name} ${row.passenger_surname}`.trim(),
    description: `Bilhete ${row.locator}`,
    amount: numberValue(row.total_amount),
    status: row.status,
    updatedAt: row.updated_at
  };
}

export function createSupabaseAnalyticsRepository(
  client: SupabaseAnalyticsClient
): SupabaseAnalyticsRepository {
  return {
    async getAnalyticsSummary() {
      const userId = await getCurrentUserId(client);

      const [ticketsResponse, customersResponse, salesResponse] = await Promise.all([
        client
          .from('tickets')
          .select('id, passenger_name, passenger_surname, locator, status, total_amount, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false }),
        client
          .from('customers')
          .select('id, name, status, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false }),
        client
          .from('sales')
          .select('id, customer_name, ticket_locator, sale_amount, status, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
      ]);

      assertNoError(ticketsResponse, 'Nao foi possivel carregar bilhetes para analise');
      assertNoError(customersResponse, 'Nao foi possivel carregar clientes para analise');
      assertNoError(salesResponse, 'Nao foi possivel carregar vendas para analise');

      const tickets = ticketsResponse.data ?? [];
      const customers = customersResponse.data ?? [];
      const sales = salesResponse.data ?? [];
      const totalRevenue = sales.reduce((total, sale) => total + numberValue(sale.sale_amount), 0);
      const latestMovements = [...sales.map(toSaleMovement), ...tickets.map(toTicketMovement)]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 6);

      return {
        totalTickets: tickets.length,
        totalCustomers: customers.length,
        totalSales: sales.length,
        totalRevenue,
        averageTicket: sales.length > 0 ? totalRevenue / sales.length : 0,
        latestMovements
      };
    }
  };
}
