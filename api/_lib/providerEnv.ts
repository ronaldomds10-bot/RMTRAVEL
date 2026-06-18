type ProviderSource =
  | 'mock'
  | 'latam'
  | 'azul'
  | 'smiles'
  | 'gds'
  | 'consolidator'
  | 'gol'
  | 'iberia'
  | 'american'
  | 'agencyApi';

type ProviderEnvStatus =
  | {
      ok: true;
      provider: ProviderSource;
    }
  | {
      ok: false;
      provider: Exclude<ProviderSource, 'mock'>;
      code: 'not_configured';
      message: string;
      missingEnvNames: string[];
    };

const providerEnvRequirements: Record<Exclude<ProviderSource, 'mock'>, string[]> = {
  latam: ['LATAM_API_BASE_URL', 'LATAM_CLIENT_ID', 'LATAM_CLIENT_SECRET'],
  azul: ['AZUL_API_BASE_URL', 'AZUL_CLIENT_ID', 'AZUL_CLIENT_SECRET'],
  smiles: ['SMILES_API_BASE_URL', 'SMILES_CLIENT_ID', 'SMILES_CLIENT_SECRET'],
  gds: ['GDS_API_BASE_URL', 'GDS_USERNAME', 'GDS_PASSWORD'],
  consolidator: ['CONSOLIDATOR_API_BASE_URL', 'CONSOLIDATOR_API_KEY'],
  gol: ['GOL_API_BASE_URL', 'GOL_CLIENT_ID', 'GOL_CLIENT_SECRET'],
  iberia: ['IBERIA_API_BASE_URL', 'IBERIA_CLIENT_ID', 'IBERIA_CLIENT_SECRET'],
  american: ['AMERICAN_API_BASE_URL', 'AMERICAN_CLIENT_ID', 'AMERICAN_CLIENT_SECRET'],
  agencyApi: ['AGENCY_API_BASE_URL', 'AGENCY_API_KEY']
};

const providerLabels: Record<Exclude<ProviderSource, 'mock'>, string> = {
  latam: 'LATAM',
  azul: 'AZUL',
  smiles: 'SMILES',
  gds: 'GDS',
  consolidator: 'CONSOLIDATOR',
  gol: 'GOL',
  iberia: 'IBERIA',
  american: 'AMERICAN',
  agencyApi: 'AGENCY_API'
};

export function isProviderSource(value: unknown): value is ProviderSource {
  return (
    value === 'mock' ||
    value === 'latam' ||
    value === 'azul' ||
    value === 'smiles' ||
    value === 'gds' ||
    value === 'consolidator' ||
    value === 'gol' ||
    value === 'iberia' ||
    value === 'american' ||
    value === 'agencyApi'
  );
}

function hasEnvValue(name: string) {
  return Boolean(process.env[name]?.trim());
}

export function validateProviderEnv(provider: ProviderSource = 'mock'): ProviderEnvStatus {
  if (provider === 'mock') {
    return {
      ok: true,
      provider
    };
  }

  const missingEnvNames = providerEnvRequirements[provider].filter((name) => !hasEnvValue(name));

  if (missingEnvNames.length === 0) {
    return {
      ok: true,
      provider
    };
  }

  return {
    ok: false,
    provider,
    code: 'not_configured',
    message: `Provider ${providerLabels[provider]} nao esta configurado no servidor.`,
    missingEnvNames
  };
}

export function getProviderFromPayload(payload: unknown): ProviderSource {
  if (!payload || typeof payload !== 'object') {
    return 'mock';
  }

  const provider = (payload as Record<string, unknown>).provider;
  return isProviderSource(provider) ? provider : 'mock';
}
