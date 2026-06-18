import type { SiteConfiguration, SiteConfigurationRecord } from '../../types/site';
import type { SupabaseSiteClient, SupabaseSiteRepository } from './supabaseSiteRepository';

type SiteRepository = {
  getSiteConfiguration(): Promise<SiteConfigurationRecord | null>;
  saveSiteConfiguration(
    configuration: SiteConfiguration,
    existingId?: string | null
  ): Promise<SiteConfigurationRecord>;
};

export type SiteRepositoryDiagnostics = {
  configuredRepository: 'supabase' | 'unconfigured';
  activeRepository: 'supabase' | 'unconfigured';
};

const hasConfiguredSupabase = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

let supabaseSiteRepositoryPromise: Promise<SupabaseSiteRepository | null> | null = null;
let diagnostics: SiteRepositoryDiagnostics = {
  configuredRepository: hasConfiguredSupabase ? 'supabase' : 'unconfigured',
  activeRepository: hasConfiguredSupabase ? 'supabase' : 'unconfigured'
};

async function getSupabaseSiteRepository() {
  if (!hasConfiguredSupabase) {
    diagnostics = {
      configuredRepository: 'unconfigured',
      activeRepository: 'unconfigured'
    };
    return null;
  }

  supabaseSiteRepositoryPromise ??= Promise.all([
    import('../../lib/supabase'),
    import('./supabaseSiteRepository')
  ]).then(([supabaseModule, repositoryModule]) => {
    if (!supabaseModule.supabase) {
      return null;
    }

    return repositoryModule.createSupabaseSiteRepository(
      supabaseModule.supabase as unknown as SupabaseSiteClient
    );
  });

  return supabaseSiteRepositoryPromise;
}

async function withSupabaseRepository<T>(
  operation: (repository: SiteRepository) => Promise<T>
): Promise<T> {
  const supabaseSiteRepository = await getSupabaseSiteRepository();

  if (!supabaseSiteRepository) {
    throw new Error('Supabase nao esta configurado para carregar e salvar o site.');
  }

  diagnostics = {
    configuredRepository: 'supabase',
    activeRepository: 'supabase'
  };

  return operation(supabaseSiteRepository);
}

export function getSiteRepositoryDiagnostics() {
  return diagnostics;
}

export const siteRepository: SiteRepository = {
  getSiteConfiguration() {
    return withSupabaseRepository((repository) => repository.getSiteConfiguration());
  },

  saveSiteConfiguration(configuration, existingId) {
    return withSupabaseRepository((repository) =>
      repository.saveSiteConfiguration(configuration, existingId)
    );
  }
};
