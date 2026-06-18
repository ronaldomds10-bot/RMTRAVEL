import type { FinancialData } from '../../types/financial';
import type {
  SupabaseFinancialClient,
  SupabaseFinancialRepository
} from './supabaseFinancialRepository';

type FinancialRepository = {
  getFinancialData(): Promise<FinancialData>;
};

let supabaseFinancialRepositoryPromise: Promise<SupabaseFinancialRepository | null> | null = null;

const hasConfiguredSupabase = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

async function getSupabaseFinancialRepository() {
  if (!hasConfiguredSupabase) {
    return null;
  }

  supabaseFinancialRepositoryPromise ??= Promise.all([
    import('../../lib/supabase'),
    import('./supabaseFinancialRepository')
  ]).then(([supabaseModule, repositoryModule]) => {
    if (!supabaseModule.supabase) {
      return null;
    }

    return repositoryModule.createSupabaseFinancialRepository(
      supabaseModule.supabase as unknown as SupabaseFinancialClient
    );
  });

  return supabaseFinancialRepositoryPromise;
}

async function withSupabaseRepository<T>(
  operation: (repository: FinancialRepository) => Promise<T>
): Promise<T> {
  const supabaseFinancialRepository = await getSupabaseFinancialRepository();

  if (!supabaseFinancialRepository) {
    throw new Error('Supabase nao esta configurado para carregar financeiro.');
  }

  return operation(supabaseFinancialRepository);
}

export const financialRepository: FinancialRepository = {
  getFinancialData() {
    return withSupabaseRepository((repository) => repository.getFinancialData());
  }
};
