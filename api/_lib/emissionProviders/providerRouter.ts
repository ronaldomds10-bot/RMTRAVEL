import { validateProviderEnv } from '../providerEnv';
import { agencyApiProvider } from './agencyApiProvider';
import { americanProvider } from './americanProvider';
import { azulProvider } from './azulProvider';
import { golProvider } from './golProvider';
import { iberiaProvider } from './iberiaProvider';
import { latamProvider } from './latamProvider';
import {
  EmissionProviderError,
  type EmissionProvider,
  type ImportAirline,
  type ImportEmissionInput
} from './types';

const providers: Record<ImportAirline, EmissionProvider> = {
  azul: azulProvider,
  gol: golProvider,
  latam: latamProvider,
  iberia: iberiaProvider,
  american: americanProvider
};

export const availableEmissionAirlines = Object.keys(providers) as ImportAirline[];

export function getEmissionProvider(airline: ImportAirline) {
  return providers[airline] ?? agencyApiProvider;
}

export const providerRouter: EmissionProvider = {
  airline: 'agencyApi',
  async importEmission(input: ImportEmissionInput) {
    const envStatus = validateProviderEnv(input.airline);

    if (!envStatus.ok) {
      throw new EmissionProviderError('not_configured', input.airline);
    }

    return getEmissionProvider(input.airline).importEmission(input);
  }
};
