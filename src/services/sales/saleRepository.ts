import { hasSupabaseConfig, supabase } from '../../lib/supabase';
import type { Sale, SaleInput, SalePaymentMethod, SaleStatus } from '../../types/sale';

const STORAGE_KEY = 'rmtravel:sales';
let memoryRecords: Sale[] = seedSales();

type SalesTableRow = {
  id: string;
  user_id: string;
  customer_id: string | null;
  ticket_id: string | null;
  customer_name: string;
  ticket_locator: string | null;
  origin: string | null;
  destination: string | null;
  cost_amount: number | string | null;
  sale_amount: number | string | null;
  profit_amount: number | string | null;
  payment_method: string | null;
  status: string;
  notes: string | null;
  raw_data: unknown;
  created_at: string;
  updated_at: string;
};

type SalesTableInsert = {
  user_id: string;
  customer_id: string | null;
  ticket_id: string | null;
  customer_name: string;
  ticket_locator: string | null;
  origin: string | null;
  destination: string | null;
  cost_amount: number;
  sale_amount: number;
  payment_method: string | null;
  status: SaleStatus;
  notes: string | null;
  raw_data: Record<string, unknown>;
};

type SalesTableUpdate = Omit<SalesTableInsert, 'user_id'>;

const saleStatusValues: SaleStatus[] = [
  'orcamento',
  'aguardando_pagamento',
  'pago',
  'emitido',
  'cancelado'
];

const paymentMethodValues: SalePaymentMethod[] = [
  'Pix',
  'Cartao',
  'Boleto',
  'Transferencia',
  'Dinheiro'
];

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function cloneRecords(records: Sale[]) {
  return records.map((record) => structuredClone(record));
}

function seedSales(): Sale[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'SAL-1001',
      customerId: 'CUS-1001',
      customerName: 'Marina Costa',
      customerPhone: '+55 11 98231-4470',
      ticketId: 'TCK-2001',
      ticketLabel: 'RM7LIS - TAP Air Portugal',
      origin: 'GRU',
      destination: 'LIS',
      costAmount: 4200,
      saleAmount: 4820,
      profitAmount: 620,
      paymentMethod: 'Pix',
      status: 'pago',
      notes: 'Venda confirmada para Lisboa.',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'SAL-1002',
      customerId: 'CUS-1003',
      customerName: 'Rafael Nogueira',
      customerPhone: '+55 31 99120-7711',
      ticketId: 'TCK-2002',
      ticketLabel: 'RM8BUE - LATAM Airlines',
      origin: 'CNF',
      destination: 'AEP',
      costAmount: 1560,
      saleAmount: 1890,
      profitAmount: 330,
      paymentMethod: 'Cartao',
      status: 'aguardando_pagamento',
      notes: 'Aguardando confirmacao do cartao.',
      createdAt: now,
      updatedAt: now
    }
  ];
}

function readLocalRecords() {
  if (!canUseLocalStorage()) {
    return cloneRecords(memoryRecords);
  }

  const rawRecords = window.localStorage.getItem(STORAGE_KEY);

  if (!rawRecords) {
    const records = seedSales();
    writeLocalRecords(records);
    return records;
  }

  try {
    return JSON.parse(rawRecords) as Sale[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    const records = seedSales();
    writeLocalRecords(records);
    return records;
  }
}

function writeLocalRecords(records: Sale[]) {
  if (!canUseLocalStorage()) {
    memoryRecords = cloneRecords(records);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function createLocalSaleId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `SAL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }

  return `SAL-${Date.now().toString(36).toUpperCase()}`;
}

function toLocalSaleRecord(input: SaleInput, existing?: Sale): Sale {
  const now = new Date().toISOString();
  const costAmount = numberValue(input.costAmount);
  const saleAmount = numberValue(input.saleAmount);

  return {
    ...structuredClone(input),
    id: existing?.id ?? input.id ?? createLocalSaleId(),
    costAmount,
    saleAmount,
    profitAmount: saleAmount - costAmount,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function ticketLocatorFromLabel(label: string) {
  return label.split(' - ')[0]?.trim() || null;
}

function saleRawData(input: SaleInput) {
  return {
    customerPhone: input.customerPhone,
    ticketLabel: input.ticketLabel,
    customerId: input.customerId,
    ticketId: input.ticketId
  };
}

function toSalesTableInsert(input: SaleInput, userId: string): SalesTableInsert {
  return {
    user_id: userId,
    customer_id: isUuid(input.customerId) ? input.customerId : null,
    ticket_id: isUuid(input.ticketId) ? input.ticketId : null,
    customer_name: input.customerName,
    ticket_locator: ticketLocatorFromLabel(input.ticketLabel),
    origin: input.origin || null,
    destination: input.destination || null,
    cost_amount: numberValue(input.costAmount),
    sale_amount: numberValue(input.saleAmount),
    payment_method: input.paymentMethod || null,
    status: input.status,
    notes: input.notes || null,
    raw_data: saleRawData(input)
  };
}

function toSalesTableUpdate(input: SaleInput): SalesTableUpdate {
  const { user_id: _userId, ...values } = toSalesTableInsert(input, 'unused');
  return values;
}

function rawDataValue(row: SalesTableRow) {
  return row.raw_data && typeof row.raw_data === 'object'
    ? (row.raw_data as Record<string, unknown>)
    : {};
}

function stringRawValue(rawData: Record<string, unknown>, key: string) {
  const value = rawData[key];
  return typeof value === 'string' ? value : '';
}

function normalizeSaleStatus(value: string): SaleStatus {
  return saleStatusValues.includes(value as SaleStatus) ? (value as SaleStatus) : 'orcamento';
}

function normalizePaymentMethod(value: string | null): SalePaymentMethod {
  return paymentMethodValues.includes(value as SalePaymentMethod)
    ? (value as SalePaymentMethod)
    : 'Pix';
}

function toSale(row: SalesTableRow): Sale {
  const rawData = rawDataValue(row);
  const costAmount = numberValue(row.cost_amount);
  const saleAmount = numberValue(row.sale_amount);

  return {
    id: row.id,
    customerId: row.customer_id ?? stringRawValue(rawData, 'customerId'),
    customerName: row.customer_name,
    customerPhone: stringRawValue(rawData, 'customerPhone'),
    ticketId: row.ticket_id ?? stringRawValue(rawData, 'ticketId'),
    ticketLabel: stringRawValue(rawData, 'ticketLabel') || row.ticket_locator || '',
    origin: row.origin ?? '',
    destination: row.destination ?? '',
    costAmount,
    saleAmount,
    profitAmount:
      row.profit_amount === null ? saleAmount - costAmount : numberValue(row.profit_amount),
    paymentMethod: normalizePaymentMethod(row.payment_method),
    status: normalizeSaleStatus(row.status),
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function requireSupabase() {
  if (!hasSupabaseConfig || !supabase) {
    return null;
  }

  return supabase;
}

async function getCurrentUserId() {
  const client = requireSupabase();

  if (!client) {
    return null;
  }

  const { data, error } = await client.auth.getUser();

  if (error) {
    throw new Error(`Nao foi possivel identificar o usuario autenticado: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('Usuario autenticado nao encontrado para persistir vendas.');
  }

  return data.user.id;
}

async function listLocalSales() {
  return readLocalRecords().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function createLocalSale(input: SaleInput) {
  const records = readLocalRecords();
  const record = toLocalSaleRecord(input);
  writeLocalRecords([record, ...records]);

  return record;
}

async function updateLocalSale(id: string, input: SaleInput) {
  const records = readLocalRecords();
  const recordIndex = records.findIndex((record) => record.id === id);

  if (recordIndex === -1) {
    return null;
  }

  const record = toLocalSaleRecord(input, records[recordIndex]);
  records[recordIndex] = record;
  writeLocalRecords(records);

  return record;
}

async function deleteLocalSale(id: string) {
  const records = readLocalRecords();
  const nextRecords = records.filter((record) => record.id !== id);

  if (records.length === nextRecords.length) {
    return false;
  }

  writeLocalRecords(nextRecords);
  return true;
}

export async function listSales() {
  const client = requireSupabase();
  const userId = await getCurrentUserId();

  if (!client || !userId) {
    return listLocalSales();
  }

  const { data, error } = await client
    .from('sales')
    .select(
      'id, user_id, customer_id, ticket_id, customer_name, ticket_locator, origin, destination, cost_amount, sale_amount, profit_amount, payment_method, status, notes, raw_data, created_at, updated_at'
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Nao foi possivel listar vendas no Supabase: ${error.message}`);
  }

  return ((data ?? []) as SalesTableRow[]).map(toSale);
}

export async function createSale(input: SaleInput) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();

  if (!client || !userId) {
    return createLocalSale(input);
  }

  const { data, error } = await client
    .from('sales')
    .insert(toSalesTableInsert(input, userId))
    .select(
      'id, user_id, customer_id, ticket_id, customer_name, ticket_locator, origin, destination, cost_amount, sale_amount, profit_amount, payment_method, status, notes, raw_data, created_at, updated_at'
    )
    .single();

  if (error) {
    throw new Error(`Nao foi possivel criar venda no Supabase: ${error.message}`);
  }

  if (!data) {
    throw new Error('Supabase nao retornou a venda criada.');
  }

  return toSale(data as SalesTableRow);
}

export async function updateSale(id: string, input: SaleInput) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();

  if (!client || !userId) {
    return updateLocalSale(id, input);
  }

  const { data, error } = await client
    .from('sales')
    .update(toSalesTableUpdate(input))
    .eq('id', id)
    .eq('user_id', userId)
    .select(
      'id, user_id, customer_id, ticket_id, customer_name, ticket_locator, origin, destination, cost_amount, sale_amount, profit_amount, payment_method, status, notes, raw_data, created_at, updated_at'
    )
    .maybeSingle();

  if (error) {
    throw new Error(`Nao foi possivel atualizar venda no Supabase: ${error.message}`);
  }

  return data ? toSale(data as SalesTableRow) : null;
}

export async function deleteSale(id: string) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();

  if (!client || !userId) {
    return deleteLocalSale(id);
  }

  const { error } = await client.from('sales').delete().eq('id', id).eq('user_id', userId);

  if (error) {
    throw new Error(`Nao foi possivel remover venda no Supabase: ${error.message}`);
  }

  return true;
}
