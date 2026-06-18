import type { MilesProgramInput, MilesProgramRecord } from '../../types/miles';
import type {
  SupabaseMilesProgramClient,
  SupabaseMilesProgramRepository
} from './supabaseMilesProgramRepository';

type MilesProgramRepository = {
  listPrograms(): Promise<MilesProgramRecord[]>;
  createProgram(input: MilesProgramInput): Promise<MilesProgramRecord>;
  updateProgram(id: string, input: MilesProgramInput): Promise<MilesProgramRecord | null>;
  deleteProgram(id: string): Promise<boolean>;
};

const hasConfiguredSupabase = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

let supabaseMilesProgramRepositoryPromise: Promise<SupabaseMilesProgramRepository | null> | null =
  null;

async function getSupabaseMilesProgramRepository() {
  if (!hasConfiguredSupabase) {
    return null;
  }

  supabaseMilesProgramRepositoryPromise ??= Promise.all([
    import('../../lib/supabase'),
    import('./supabaseMilesProgramRepository')
  ]).then(([supabaseModule, repositoryModule]) => {
    if (!supabaseModule.supabase) {
      return null;
    }

    return repositoryModule.createSupabaseMilesProgramRepository(
      supabaseModule.supabase as unknown as SupabaseMilesProgramClient
    );
  });

  return supabaseMilesProgramRepositoryPromise;
}

async function withSupabaseRepository<T>(
  operation: (repository: MilesProgramRepository) => Promise<T>
): Promise<T> {
  const supabaseMilesProgramRepository = await getSupabaseMilesProgramRepository();

  if (!supabaseMilesProgramRepository) {
    throw new Error('Supabase nao esta configurado para gerenciar programas de milhas.');
  }

  return operation(supabaseMilesProgramRepository);
}

export const milesProgramRepository: MilesProgramRepository = {
  listPrograms() {
    return withSupabaseRepository((repository) => repository.listPrograms());
  },

  createProgram(input) {
    return withSupabaseRepository((repository) => repository.createProgram(input));
  },

  updateProgram(id, input) {
    return withSupabaseRepository((repository) => repository.updateProgram(id, input));
  },

  deleteProgram(id) {
    return withSupabaseRepository((repository) => repository.deleteProgram(id));
  }
};
