import type { Ticket } from '../../types/ticket';
import type { TicketRecord } from '../../types/database';
import { createPublicToken } from './publicToken';
import { sanitizeTicketRawResponse } from './ticketRawData';

const STORAGE_KEY = 'rmtravel:tickets';
let memoryRecords: TicketRecord[] = [];

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function cloneRecords(records: TicketRecord[]) {
  return records.map((record) => structuredClone(record));
}

function ensurePublicTokens(records: TicketRecord[]) {
  let changed = false;
  const nextRecords = records.map((record) => {
    const sanitizedRawResponse = sanitizeTicketRawResponse(record.rawResponse) ?? undefined;
    const hasSanitizedRawResponse =
      JSON.stringify(record.rawResponse ?? null) === JSON.stringify(sanitizedRawResponse ?? null);

    if (record.publicToken && hasSanitizedRawResponse) {
      return record;
    }

    changed = true;
    return {
      ...record,
      publicToken: record.publicToken ?? createPublicToken(),
      rawResponse: sanitizedRawResponse
    };
  });

  return { records: nextRecords, changed };
}

function readRecords() {
  if (!canUseLocalStorage()) {
    const result = ensurePublicTokens(memoryRecords);

    if (result.changed) {
      memoryRecords = cloneRecords(result.records);
    }

    return cloneRecords(result.records);
  }

  const rawRecords = window.localStorage.getItem(STORAGE_KEY);

  if (!rawRecords) {
    return [];
  }

  try {
    const result = ensurePublicTokens(JSON.parse(rawRecords) as TicketRecord[]);

    if (result.changed) {
      writeRecords(result.records);
    }

    return result.records;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function writeRecords(records: TicketRecord[]) {
  if (!canUseLocalStorage()) {
    memoryRecords = cloneRecords(records);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function toTicketRecord(ticket: Ticket, existing?: TicketRecord): TicketRecord {
  const now = new Date().toISOString();

  return {
    ...structuredClone(ticket),
    publicToken: existing?.publicToken ?? ticket.publicToken ?? createPublicToken(),
    rawResponse: sanitizeTicketRawResponse(ticket.rawResponse) ?? undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}

function hasSameLocatorAndSurname(record: TicketRecord, ticket: Ticket) {
  return (
    normalize(record.locator) === normalize(ticket.locator) &&
    normalize(record.surname) === normalize(ticket.surname)
  );
}

export async function listTickets() {
  return readRecords().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getTicketById(id: string) {
  return readRecords().find((record) => record.id === id) ?? null;
}

export async function getTicketByPublicToken(publicToken: string) {
  return readRecords().find((record) => record.publicToken === publicToken) ?? null;
}

export async function createTicket(ticket: Ticket) {
  const records = readRecords();
  const existing = records.find((record) => hasSameLocatorAndSurname(record, ticket));

  if (existing) {
    return existing;
  }

  const record = toTicketRecord(ticket);
  writeRecords([record, ...records]);

  return record;
}

export async function updateTicket(id: string, ticket: Ticket) {
  const records = readRecords();
  const recordIndex = records.findIndex((record) => record.id === id);

  if (recordIndex === -1) {
    return null;
  }

  const duplicate = records.find(
    (record) => record.id !== id && hasSameLocatorAndSurname(record, ticket)
  );

  if (duplicate) {
    return duplicate;
  }

  const updatedRecord = toTicketRecord(ticket, records[recordIndex]);
  records[recordIndex] = updatedRecord;
  writeRecords(records);

  return updatedRecord;
}

export async function deleteTicket(id: string) {
  const records = readRecords();
  const nextRecords = records.filter((record) => record.id !== id);

  if (nextRecords.length === records.length) {
    return false;
  }

  writeRecords(nextRecords);
  return true;
}
