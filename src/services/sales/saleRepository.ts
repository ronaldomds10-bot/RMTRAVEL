import type { Sale, SaleInput } from '../../types/sale';

const STORAGE_KEY = 'rmtravel:sales';
let memoryRecords: Sale[] = seedSales();

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

function readRecords() {
  if (!canUseLocalStorage()) {
    return cloneRecords(memoryRecords);
  }

  const rawRecords = window.localStorage.getItem(STORAGE_KEY);

  if (!rawRecords) {
    const records = seedSales();
    writeRecords(records);
    return records;
  }

  try {
    return JSON.parse(rawRecords) as Sale[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    const records = seedSales();
    writeRecords(records);
    return records;
  }
}

function writeRecords(records: Sale[]) {
  if (!canUseLocalStorage()) {
    memoryRecords = cloneRecords(records);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function createSaleId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `SAL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }

  return `SAL-${Date.now().toString(36).toUpperCase()}`;
}

function toSaleRecord(input: SaleInput, existing?: Sale): Sale {
  const now = new Date().toISOString();
  const costAmount = Number(input.costAmount) || 0;
  const saleAmount = Number(input.saleAmount) || 0;

  return {
    ...structuredClone(input),
    id: existing?.id ?? input.id ?? createSaleId(),
    costAmount,
    saleAmount,
    profitAmount: saleAmount - costAmount,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}

export async function listSales() {
  return readRecords().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createSale(input: SaleInput) {
  const records = readRecords();
  const record = toSaleRecord(input);
  writeRecords([record, ...records]);

  return record;
}

export async function updateSale(id: string, input: SaleInput) {
  const records = readRecords();
  const recordIndex = records.findIndex((record) => record.id === id);

  if (recordIndex === -1) {
    return null;
  }

  const record = toSaleRecord(input, records[recordIndex]);
  records[recordIndex] = record;
  writeRecords(records);

  return record;
}

export async function deleteSale(id: string) {
  const records = readRecords();
  const nextRecords = records.filter((record) => record.id !== id);

  if (records.length === nextRecords.length) {
    return false;
  }

  writeRecords(nextRecords);
  return true;
}
