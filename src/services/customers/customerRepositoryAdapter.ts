import type { Customer, CustomerRecord } from '../../types/customer';
import * as localCustomerRepository from './customerRepository';
import type {
  SupabaseCustomerClient,
  SupabaseCustomerRepository
} from './supabaseCustomerRepository';

type CustomerRepository = {
  listCustomers(): Promise<CustomerRecord[]>;
  getCustomerById(id: string): Promise<CustomerRecord | null>;
  createCustomer(customer: Customer): Promise<CustomerRecord>;
  updateCustomer(id: string, customer: Customer): Promise<CustomerRecord | null>;
  deleteCustomer(id: string): Promise<boolean>;
};

export type CustomerRepositoryDiagnostics = {
  configuredRepository: 'supabase' | 'local';
  activeRepository: 'supabase' | 'local';
  isFallbackActive: boolean;
};

const hasConfiguredSupabase = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);
let supabaseCustomerRepositoryPromise: Promise<SupabaseCustomerRepository | null> | null = null;
let diagnostics: CustomerRepositoryDiagnostics = {
  configuredRepository: hasConfiguredSupabase ? 'supabase' : 'local',
  activeRepository: hasConfiguredSupabase ? 'supabase' : 'local',
  isFallbackActive: !hasConfiguredSupabase
};

async function getSupabaseCustomerRepository() {
  if (!hasConfiguredSupabase) {
    return null;
  }

  supabaseCustomerRepositoryPromise ??= Promise.all([
    import('../../lib/supabase'),
    import('./supabaseCustomerRepository')
  ]).then(([supabaseModule, repositoryModule]) => {
    if (!supabaseModule.supabase) {
      return null;
    }

    return repositoryModule.createSupabaseCustomerRepository(
      supabaseModule.supabase as unknown as SupabaseCustomerClient
    );
  });

  return supabaseCustomerRepositoryPromise;
}

async function withLocalFallback<T>(
  operation: (repository: CustomerRepository) => Promise<T>,
  fallback: (repository: CustomerRepository) => Promise<T>
) {
  const supabaseCustomerRepository = await getSupabaseCustomerRepository();

  if (!supabaseCustomerRepository) {
    diagnostics = {
      configuredRepository: hasConfiguredSupabase ? 'supabase' : 'local',
      activeRepository: 'local',
      isFallbackActive: true
    };
    return fallback(localCustomerRepository);
  }

  try {
    const result = await operation(supabaseCustomerRepository);
    diagnostics = {
      configuredRepository: 'supabase',
      activeRepository: 'supabase',
      isFallbackActive: false
    };
    return result;
  } catch (error) {
    diagnostics = {
      configuredRepository: 'supabase',
      activeRepository: 'local',
      isFallbackActive: true
    };

    if (import.meta.env.DEV) {
      console.error('[RMTRAVEL] Supabase customers repository failed. Using local fallback.', error);
    }

    return fallback(localCustomerRepository);
  }
}

export function getCustomerRepositoryDiagnostics() {
  return diagnostics;
}

export const customerRepository: CustomerRepository = {
  listCustomers() {
    return withLocalFallback(
      (repository) => repository.listCustomers(),
      (repository) => repository.listCustomers()
    );
  },

  getCustomerById(id) {
    return withLocalFallback(
      (repository) => repository.getCustomerById(id),
      (repository) => repository.getCustomerById(id)
    );
  },

  createCustomer(customer) {
    return withLocalFallback(
      (repository) => repository.createCustomer(customer),
      (repository) => repository.createCustomer(customer)
    );
  },

  updateCustomer(id, customer) {
    return withLocalFallback(
      (repository) => repository.updateCustomer(id, customer),
      (repository) => repository.updateCustomer(id, customer)
    );
  },

  deleteCustomer(id) {
    return withLocalFallback(
      (repository) => repository.deleteCustomer(id),
      (repository) => repository.deleteCustomer(id)
    );
  }
};
