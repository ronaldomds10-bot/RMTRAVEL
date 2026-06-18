import type { TicketProviderSource, TicketSearchInput } from '../../../types/ticket';
import { azulProvider } from './azulProvider';
import { consolidatorProvider } from './consolidatorProvider';
import { gdsProvider } from './gdsProvider';
import { latamProvider } from './latamProvider';
import { mockProvider } from './mockProvider';
import { smilesProvider } from './smilesProvider';
import type { TicketSearchProvider } from './types';

const providers: Record<TicketProviderSource, TicketSearchProvider> = {
  mock: mockProvider,
  latam: latamProvider,
  smiles: smilesProvider,
  azul: azulProvider,
  gds: gdsProvider,
  consolidator: consolidatorProvider
};

export const availableTicketProviders = Object.keys(providers) as TicketProviderSource[];

export function getTicketProvider(provider: TicketProviderSource = 'mock') {
  return providers[provider];
}

export const providerRouter: TicketSearchProvider = {
  provider: 'mock',
  async searchByLocator(input: TicketSearchInput) {
    const provider = getTicketProvider(input.provider ?? 'mock');
    return provider.searchByLocator(input);
  }
};
