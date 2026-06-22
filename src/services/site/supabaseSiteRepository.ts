import type {
  SiteConfiguration,
  SiteConfigurationRecord,
  SiteSettingsTableInsert,
  SiteSettingsTableRow,
  SiteSettingsTableUpdate
} from '../../types/site';

type SupabaseRepositoryErrorDetails = {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
};

type SupabaseResponse<T> = {
  data: T | null;
  error: SupabaseRepositoryErrorDetails | null;
};

type SupabaseSelectQuery<T> = PromiseLike<SupabaseResponse<T[]>> & {
  eq(column: string, value: string): SupabaseSelectQuery<T>;
  maybeSingle(): PromiseLike<SupabaseResponse<T>>;
  limit(count: number): SupabaseSelectQuery<T>;
};

type SupabaseMutationQuery<T> = {
  eq(column: string, value: string): SupabaseMutationQuery<T>;
  select(columns?: string): {
    single(): PromiseLike<SupabaseResponse<T>>;
  };
};

type SupabaseInsertQuery<T> = {
  select(columns?: string): {
    single(): PromiseLike<SupabaseResponse<T>>;
  };
};

type SupabaseSiteSettingsTable = {
  insert(values: SiteSettingsTableInsert): SupabaseInsertQuery<SiteSettingsTableRow>;
  select(columns?: string): SupabaseSelectQuery<SiteSettingsTableRow>;
  update(values: SiteSettingsTableUpdate): SupabaseMutationQuery<SiteSettingsTableRow>;
};

export type SupabaseSiteClient = {
  auth: {
    getUser(): Promise<{
      data: {
        user: {
          id: string;
        } | null;
      };
      error: SupabaseRepositoryErrorDetails | null;
    }>;
  };
  from(table: 'site_settings'): SupabaseSiteSettingsTable;
};

export type SupabaseSiteRepository = {
  getSiteConfiguration(): Promise<SiteConfigurationRecord | null>;
  saveSiteConfiguration(
    configuration: SiteConfiguration,
    existingId?: string | null
  ): Promise<SiteConfigurationRecord>;
};

function createRepositoryError(action: string, error: SupabaseRepositoryErrorDetails) {
  const detail = error.details ? ` (${error.details})` : '';
  return new Error(`${action}: ${error.message}${detail}`);
}

function assertNoError<T>(response: SupabaseResponse<T>, action: string) {
  if (response.error) {
    throw createRepositoryError(action, response.error);
  }
}

async function getCurrentUserId(client: SupabaseSiteClient) {
  const { data, error } = await client.auth.getUser();

  if (error) {
    throw createRepositoryError('Nao foi possivel identificar o usuario autenticado', error);
  }

  if (!data.user) {
    throw new Error('Usuario autenticado nao encontrado para persistir o site.');
  }

  return data.user.id;
}

function toSiteSettingsTableInsert(
  configuration: SiteConfiguration,
  userId: string
): SiteSettingsTableInsert {
  return {
    user_id: userId,
    agency_name: configuration.agencyName,
    headline: configuration.headline,
    description: configuration.description,
    whatsapp: configuration.whatsapp,
    instagram: configuration.instagram,
    logo_url: configuration.logoUrl,
    cover_image_url: configuration.coverImageUrl,
    primary_color: configuration.primaryColor,
    is_published: configuration.isPublished
  };
}

function toSiteSettingsTableUpdate(configuration: SiteConfiguration): SiteSettingsTableUpdate {
  const { user_id: _userId, ...insertable } = toSiteSettingsTableInsert(configuration, 'unused');
  return insertable;
}

function toSiteConfigurationRecord(row: SiteSettingsTableRow): SiteConfigurationRecord {
  return {
    id: row.id,
    agencyName: row.agency_name,
    headline: row.headline,
    description: row.description,
    whatsapp: row.whatsapp,
    instagram: row.instagram,
    logoUrl: row.logo_url,
    coverImageUrl: row.cover_image_url,
    primaryColor: row.primary_color,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createSupabaseSiteRepository(client: SupabaseSiteClient): SupabaseSiteRepository {
  async function updateSiteConfiguration(
    id: string,
    configuration: SiteConfiguration,
    userId: string
  ) {
    const response = await client
      .from('site_settings')
      .update(toSiteSettingsTableUpdate(configuration))
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    assertNoError(response, 'Nao foi possivel atualizar as configuracoes do site');

    if (!response.data) {
      throw new Error('Supabase nao retornou as configuracoes atualizadas do site.');
    }

    return toSiteConfigurationRecord(response.data);
  }

  return {
    async getSiteConfiguration() {
      const userId = await getCurrentUserId(client);
      const response = await client
        .from('site_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      assertNoError(response, 'Nao foi possivel carregar as configuracoes do site');

      return response.data ? toSiteConfigurationRecord(response.data) : null;
    },

    async saveSiteConfiguration(configuration, existingId) {
      const userId = await getCurrentUserId(client);

      if (existingId) {
        return updateSiteConfiguration(existingId, configuration, userId);
      }

      const existingResponse = await client
        .from('site_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      assertNoError(existingResponse, 'Nao foi possivel verificar configuracoes existentes do site');

      if (existingResponse.data) {
        return updateSiteConfiguration(existingResponse.data.id, configuration, userId);
      }

      const response = await client
        .from('site_settings')
        .insert(toSiteSettingsTableInsert(configuration, userId))
        .select('*')
        .single();

      assertNoError(response, 'Nao foi possivel criar as configuracoes do site');

      if (!response.data) {
        throw new Error('Supabase nao retornou as configuracoes criadas do site.');
      }

      return toSiteConfigurationRecord(response.data);
    }
  };
}
