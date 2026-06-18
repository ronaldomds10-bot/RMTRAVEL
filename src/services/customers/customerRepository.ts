import { customers as mockCustomers } from '../../data/mock';
import type { Customer, CustomerRecord } from '../../types/customer';

const STORAGE_KEY = 'rmtravel:customers';
let memoryRecords: CustomerRecord[] = seedRecords();

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function cloneRecords(records: CustomerRecord[]) {
  return records.map((record) => structuredClone(record));
}

function seedRecords() {
  const now = new Date().toISOString();
  return mockCustomers.map((customer) => ({
    ...structuredClone(customer),
    createdAt: now,
    updatedAt: now
  }));
}

function readRecords() {
  if (!canUseLocalStorage()) {
    return cloneRecords(memoryRecords);
  }

  const rawRecords = window.localStorage.getItem(STORAGE_KEY);

  if (!rawRecords) {
    const records = seedRecords();
    writeRecords(records);
    return records;
  }

  try {
    return JSON.parse(rawRecords) as CustomerRecord[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    const records = seedRecords();
    writeRecords(records);
    return records;
  }
}

function writeRecords(records: CustomerRecord[]) {
  if (!canUseLocalStorage()) {
    memoryRecords = cloneRecords(records);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function toCustomerRecord(customer: Customer, existing?: CustomerRecord): CustomerRecord {
  const now = new Date().toISOString();

  return {
    ...structuredClone(customer),
    id: existing?.id ?? customer.id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}

function createCustomerId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `CUS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }

  return `CUS-${Date.now().toString(36).toUpperCase()}`;
}

export async function listCustomers() {
  return readRecords().sort((a, b) => a.personal.fullName.localeCompare(b.personal.fullName));
}

export async function getCustomerById(id: string) {
  return readRecords().find((record) => record.id === id) ?? null;
}

export async function createCustomer(customer: Customer) {
  const records = readRecords();
  const record = toCustomerRecord({
    ...customer,
    id: customer.id || createCustomerId()
  });

  writeRecords([record, ...records]);

  return record;
}

export async function updateCustomer(id: string, customer: Customer) {
  const records = readRecords();
  const recordIndex = records.findIndex((record) => record.id === id);

  if (recordIndex === -1) {
    return null;
  }

  const updatedRecord = toCustomerRecord({ ...customer, id }, records[recordIndex]);
  records[recordIndex] = updatedRecord;
  writeRecords(records);

  return updatedRecord;
}

export async function deleteCustomer(id: string) {
  const records = readRecords();
  const nextRecords = records.filter((record) => record.id !== id);

  if (nextRecords.length === records.length) {
    return false;
  }

  writeRecords(nextRecords);
  return true;
}
