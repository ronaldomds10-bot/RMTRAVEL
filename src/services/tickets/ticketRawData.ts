type RawObject = Record<string, unknown>;

function maskValue(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length <= 4) {
    return normalizedValue ? '***' : undefined;
  }

  return `${normalizedValue.slice(0, 2)}***${normalizedValue.slice(-2)}`;
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function createImportedEmissionRawData(input: {
  airline: string;
  recordLocator: string;
  ticketNumber: string;
}) {
  return {
    source: 'importEmission',
    airline: input.airline,
    recordLocator: maskValue(input.recordLocator),
    ticketNumber: maskValue(input.ticketNumber)
  };
}

export function sanitizeTicketRawResponse(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const raw = value as RawObject;
  const source = stringValue(raw.source);

  if (!source) {
    return null;
  }

  return {
    source,
    provider: stringValue(raw.provider),
    environment: stringValue(raw.environment),
    schemaVersion: typeof raw.schemaVersion === 'number' ? raw.schemaVersion : undefined,
    recordLocator: maskValue(raw.recordLocator ?? raw.locator),
    ticketNumber: maskValue(raw.ticketNumber)
  };
}
