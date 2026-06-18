import type {
  FinancialData,
  FinancialSaleRecord,
  FinancialSaleStatus
} from '../../types/financial';

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

type FinancialSaleRow = {
  id: string;
  customer_name: string;
  ticket_locator: string | null;
  sale_amount: number | string | null;
  cost_amount: number | string | null;
  profit_amount: number | string | null;
  payment_method: string | null;
  status: FinancialSaleStatus;
  created_at: string;
  updated_at: string;
};

type SupabaseFinancialTableMap = {
  sales: FinancialSaleRow;
};

export type SupabaseFinancialClient = {
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
  from<TableName extends keyof SupabaseFinancialTableMap>(
    table: TableName
  ): {
    select(columns?: string): SupabaseSelectQuery<SupabaseFinancialTableMap[TableName]>;
  };
};

export type SupabaseFinancialRepository = {
  getFinancialData(): Promise<FinancialData>;
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

async function getCurrentUserId(client: SupabaseFinancialClient) {
  const { data, error } = await client.auth.getUser();

  if (error) {
    throw createRepositoryError('Nao foi possivel identificar o usuario autenticado', error);
  }

  if (!data.user) {
    throw new Error('Usuario autenticado nao encontrado para carregar financeiro.');
  }

  return data.user.id;
}

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toFinancialSale(row: FinancialSaleRow): FinancialSaleRecord {
  const saleAmount = numberValue(row.sale_amount);
  const costAmount = numberValue(row.cost_amount);
  const profitAmount =
    row.profit_amount === null ? saleAmount - costAmount : numberValue(row.profit_amount);

  return {
    id: row.id,
    customerName: row.customer_name,
    ticketLocator: row.ticket_locator,
    saleAmount,
    costAmount,
    profitAmount,
    paymentMethod: row.payment_method,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function summarizeSales(sales: FinancialSaleRecord[]) {
  const totalRevenue = sales.reduce((total, sale) => total + sale.saleAmount, 0);
  const totalCost = sales.reduce((total, sale) => total + sale.costAmount, 0);
  const totalProfit = sales.reduce((total, sale) => total + sale.profitAmount, 0);
  const paidCount = sales.filter((sale) => sale.status === 'pago' || sale.status === 'emitido').length;
  const pendingCount = sales.filter(
    (sale) => sale.status === 'orcamento' || sale.status === 'aguardando_pagamento'
  ).length;

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    marginPercent: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    paidCount,
    pendingCount,
    salesCount: sales.length
  };
}

export function createSupabaseFinancialRepository(
  client: SupabaseFinancialClient
): SupabaseFinancialRepository {
  return {
    async getFinancialData() {
      const userId = await getCurrentUserId(client);

      const salesResponse = await client
        .from('sales')
        .select(
          'id, customer_name, ticket_locator, sale_amount, cost_amount, profit_amount, payment_method, status, created_at, updated_at'
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      assertNoError(salesResponse, 'Nao foi possivel carregar vendas para o financeiro');

      const sales = (salesResponse.data ?? []).map(toFinancialSale);

      return {
        summary: summarizeSales(sales),
        sales
      };
    }
  };
}
