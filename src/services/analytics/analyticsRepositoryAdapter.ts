import type { AnalyticsSummary } from '../../types/analytics';
import type {
  SupabaseAnalyticsClient,
  SupabaseAnalyticsRepository
} from './supabaseAnalyticsRepository';

type AnalyticsRepository = {
  getAnalyticsSummary(): Promise<AnalyticsSummary>;
};

let supabaseAnalyticsRepositoryPromise: Promise<SupabaseAnalyticsRepository | null> | null = null;

const hasConfiguredSupabase = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

async function getSupabaseAnalyticsRepository() {
  if (!hasConfiguredSupabase) {
    return null;
  }

  supabaseAnalyticsRepositoryPromise ??= Promise.all([
    import('../../lib/supabase'),
    import('./supabaseAnalyticsRepository')
  ]).then(([supabaseModule, repositoryModule]) => {
    if (!supabaseModule.supabase) {
      return null;
    }

    return repositoryModule.createSupabaseAnalyticsRepository(
      supabaseModule.supabase as unknown as SupabaseAnalyticsClient
    );
  });

  return supabaseAnalyticsRepositoryPromise;
}

async function withSupabaseRepository<T>(
  operation: (repository: AnalyticsRepository) => Promise<T>
): Promise<T> {
  const supabaseAnalyticsRepository = await getSupabaseAnalyticsRepository();

  if (!supabaseAnalyticsRepository) {
    throw new Error('Supabase nao esta configurado para carregar analises.');
  }

  return operation(supabaseAnalyticsRepository);
}

export const analyticsRepository: AnalyticsRepository = {
  getAnalyticsSummary() {
    return withSupabaseRepository((repository) => repository.getAnalyticsSummary());
  }
};
