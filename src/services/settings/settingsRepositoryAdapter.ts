import type {
  CompanySettingsInput,
  CompanySettingsRecord,
  UserProfileInput,
  UserProfileRecord
} from '../../types/settings';
import type {
  SupabaseSettingsClient,
  SupabaseSettingsRepository
} from './supabaseSettingsRepository';

type SettingsRepository = {
  getUserProfile(): Promise<UserProfileRecord>;
  saveUserProfile(input: UserProfileInput, existingId?: string | null): Promise<UserProfileRecord>;
  getCompanySettings(): Promise<CompanySettingsRecord>;
  saveCompanySettings(
    input: CompanySettingsInput,
    existingId?: string | null
  ): Promise<CompanySettingsRecord>;
};

const hasConfiguredSupabase = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

let supabaseSettingsRepositoryPromise: Promise<SupabaseSettingsRepository | null> | null = null;

async function getSupabaseSettingsRepository() {
  if (!hasConfiguredSupabase) {
    return null;
  }

  supabaseSettingsRepositoryPromise ??= Promise.all([
    import('../../lib/supabase'),
    import('./supabaseSettingsRepository')
  ]).then(([supabaseModule, repositoryModule]) => {
    if (!supabaseModule.supabase) {
      return null;
    }

    return repositoryModule.createSupabaseSettingsRepository(
      supabaseModule.supabase as unknown as SupabaseSettingsClient
    );
  });

  return supabaseSettingsRepositoryPromise;
}

async function withSupabaseRepository<T>(
  operation: (repository: SettingsRepository) => Promise<T>
): Promise<T> {
  const supabaseSettingsRepository = await getSupabaseSettingsRepository();

  if (!supabaseSettingsRepository) {
    throw new Error('Supabase nao esta configurado para salvar configuracoes.');
  }

  return operation(supabaseSettingsRepository);
}

export const settingsRepository: SettingsRepository = {
  getUserProfile() {
    return withSupabaseRepository((repository) => repository.getUserProfile());
  },

  saveUserProfile(input, existingId) {
    return withSupabaseRepository((repository) =>
      repository.saveUserProfile(input, existingId)
    );
  },

  getCompanySettings() {
    return withSupabaseRepository((repository) => repository.getCompanySettings());
  },

  saveCompanySettings(input, existingId) {
    return withSupabaseRepository((repository) =>
      repository.saveCompanySettings(input, existingId)
    );
  }
};
