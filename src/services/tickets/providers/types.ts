import type { Ticket, TicketProviderSource, TicketSearchInput } from '../../../types/ticket';

export type TicketProviderErrorCode = 'not_configured' | 'provider_error';

export class TicketProviderError extends Error {
  code: TicketProviderErrorCode;
  provider: TicketProviderSource;

  constructor(code: TicketProviderErrorCode, provider: TicketProviderSource, message: string) {
    super(message);
    this.name = 'TicketProviderError';
    this.code = code;
    this.provider = provider;
  }
}

export interface TicketSearchProvider {
  provider: TicketProviderSource;
  searchByLocator(input: TicketSearchInput): Promise<Ticket | null>;
}

export function createNotConfiguredProvider(
  provider: Exclude<TicketProviderSource, 'mock'>
): TicketSearchProvider {
  return {
    provider,
    async searchByLocator() {
      throw new TicketProviderError(
        'not_configured',
        provider,
        `Provider ${provider} ainda nao esta configurado.`
      );
    }
  };
}
