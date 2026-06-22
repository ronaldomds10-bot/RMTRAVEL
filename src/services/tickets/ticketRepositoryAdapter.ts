import type { TicketRecord } from '../../types/database';
import type { Ticket } from '../../types/ticket';
import * as localTicketRepository from './ticketRepository';
import type { SupabaseTicketClient, SupabaseTicketRepository } from './supabaseTicketRepository';

type TicketRepository = {
  listTickets(): Promise<TicketRecord[]>;
  getTicketById(id: string): Promise<TicketRecord | null>;
  getTicketByPublicToken(publicToken: string): Promise<TicketRecord | null>;
  createTicket(ticket: Ticket): Promise<TicketRecord>;
  updateTicket(id: string, ticket: Ticket): Promise<TicketRecord | null>;
  deleteTicket(id: string): Promise<boolean>;
};

export type TicketRepositoryDiagnostics = {
  configuredRepository: 'supabase' | 'local';
  activeRepository: 'supabase' | 'local';
  isFallbackActive: boolean;
};

const hasConfiguredSupabase = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);
let supabaseTicketRepositoryPromise: Promise<SupabaseTicketRepository | null> | null = null;
let diagnostics: TicketRepositoryDiagnostics = {
  configuredRepository: hasConfiguredSupabase ? 'supabase' : 'local',
  activeRepository: hasConfiguredSupabase ? 'supabase' : 'local',
  isFallbackActive: !hasConfiguredSupabase
};

async function getSupabaseTicketRepository() {
  if (!hasConfiguredSupabase) {
    return null;
  }

  supabaseTicketRepositoryPromise ??= Promise.all([
    import('../../lib/supabase'),
    import('./supabaseTicketRepository')
  ]).then(([supabaseModule, repositoryModule]) => {
    if (!supabaseModule.supabase) {
      return null;
    }

    return repositoryModule.createSupabaseTicketRepository(
      supabaseModule.supabase as unknown as SupabaseTicketClient
    );
  });

  return supabaseTicketRepositoryPromise;
}

async function withLocalFallback<T>(
  operation: (repository: TicketRepository) => Promise<T>,
  fallback: (repository: TicketRepository) => Promise<T>
) {
  const supabaseTicketRepository = await getSupabaseTicketRepository();

  if (!supabaseTicketRepository) {
    diagnostics = {
      configuredRepository: hasConfiguredSupabase ? 'supabase' : 'local',
      activeRepository: 'local',
      isFallbackActive: true
    };
    return fallback(localTicketRepository);
  }

  try {
    const result = await operation(supabaseTicketRepository);
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
      console.error('[RMTRAVEL] Supabase tickets repository failed. Using local fallback.', error);
    }

    return fallback(localTicketRepository);
  }
}

export function getTicketRepositoryMode() {
  return diagnostics.activeRepository;
}

export function getTicketRepositoryDiagnostics() {
  return diagnostics;
}

export const ticketRepository: TicketRepository = {
  listTickets() {
    return withLocalFallback(
      (repository) => repository.listTickets(),
      (repository) => repository.listTickets()
    );
  },

  getTicketById(id) {
    return withLocalFallback(
      (repository) => repository.getTicketById(id),
      (repository) => repository.getTicketById(id)
    );
  },

  getTicketByPublicToken(publicToken) {
    return withLocalFallback(
      (repository) => repository.getTicketByPublicToken(publicToken),
      (repository) => repository.getTicketByPublicToken(publicToken)
    );
  },

  createTicket(ticket) {
    return withLocalFallback(
      (repository) => repository.createTicket(ticket),
      (repository) => repository.createTicket(ticket)
    );
  },

  updateTicket(id, ticket) {
    return withLocalFallback(
      (repository) => repository.updateTicket(id, ticket),
      (repository) => repository.updateTicket(id, ticket)
    );
  },

  deleteTicket(id) {
    return withLocalFallback(
      (repository) => repository.deleteTicket(id),
      (repository) => repository.deleteTicket(id)
    );
  }
};
