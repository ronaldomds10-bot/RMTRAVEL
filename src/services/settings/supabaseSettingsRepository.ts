import type {
  CompanySettingsInput,
  CompanySettingsRecord,
  UserProfileInput,
  UserProfileRecord,
  UserProfilesTableInsert,
  UserProfilesTableRow,
  UserProfilesTableUpdate
} from '../../types/settings';
import type {
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

type SupabaseUser = {
  id: string;
  email?: string;
};

type SupabaseResponse<T> = {
  data: T | null;
  error: SupabaseRepositoryErrorDetails | null;
};

type SupabaseSelectQuery<T> = PromiseLike<SupabaseResponse<T[]>> & {
  eq(column: string, value: string): SupabaseSelectQuery<T>;
  maybeSingle(): PromiseLike<SupabaseResponse<T>>;
};

type SupabaseMutationQuery<T> = {
  eq(column: string, value: string): SupabaseMutationQuery<T>;
  select(columns?: string): {
    maybeSingle(): PromiseLike<SupabaseResponse<T>>;
    single(): PromiseLike<SupabaseResponse<T>>;
  };
};

type SupabaseInsertQuery<T> = {
  select(columns?: string): {
    single(): PromiseLike<SupabaseResponse<T>>;
  };
};

type SupabaseUserProfilesTable = {
  insert(values: UserProfilesTableInsert): SupabaseInsertQuery<UserProfilesTableRow>;
  select(columns?: string): SupabaseSelectQuery<UserProfilesTableRow>;
  update(values: UserProfilesTableUpdate): SupabaseMutationQuery<UserProfilesTableRow>;
};

type SupabaseSiteSettingsTable = {
  insert(values: SiteSettingsTableInsert): SupabaseInsertQuery<SiteSettingsTableRow>;
  select(columns?: string): SupabaseSelectQuery<SiteSettingsTableRow>;
  update(values: SiteSettingsTableUpdate): SupabaseMutationQuery<SiteSettingsTableRow>;
};

type SupabaseSettingsTableMap = {
  user_profiles: SupabaseUserProfilesTable;
  site_settings: SupabaseSiteSettingsTable;
};

export type SupabaseSettingsClient = {
  auth: {
    getUser(): Promise<{
      data: {
        user: SupabaseUser | null;
      };
      error: SupabaseRepositoryErrorDetails | null;
    }>;
  };
  from<TableName extends keyof SupabaseSettingsTableMap>(
    table: TableName
  ): SupabaseSettingsTableMap[TableName];
};

export type SupabaseSettingsRepository = {
  getUserProfile(): Promise<UserProfileRecord>;
  saveUserProfile(input: UserProfileInput, existingId?: string | null): Promise<UserProfileRecord>;
  getCompanySettings(): Promise<CompanySettingsRecord>;
  saveCompanySettings(
    input: CompanySettingsInput,
    existingId?: string | null
  ): Promise<CompanySettingsRecord>;
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

async function getCurrentUser(client: SupabaseSettingsClient) {
  const { data, error } = await client.auth.getUser();

  if (error) {
    throw createRepositoryError('Nao foi possivel identificar o usuario autenticado', error);
  }

  if (!data.user) {
    throw new Error('Usuario autenticado nao encontrado para salvar configuracoes.');
  }

  return data.user;
}

function toUserProfileRecord(row: UserProfilesTableRow | null, user: SupabaseUser): UserProfileRecord {
  return {
    id: row?.id ?? null,
    name: row?.name ?? '',
    email: user.email ?? '',
    phone: row?.phone ?? '',
    avatarUrl: row?.avatar_url ?? '',
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null
  };
}

function toUserProfileInsert(input: UserProfileInput, userId: string): UserProfilesTableInsert {
  return {
    user_id: userId,
    name: input.name,
    phone: input.phone,
    avatar_url: input.avatarUrl
  };
}

function toUserProfileUpdate(input: UserProfileInput): UserProfilesTableUpdate {
  const { user_id: _userId, ...insertable } = toUserProfileInsert(input, 'unused');
  return insertable;
}

function toCompanySettingsRecord(row: SiteSettingsTableRow | null): CompanySettingsRecord {
  return {
    id: row?.id ?? null,
    companyName: row?.agency_name ?? '',
    cnpj: '',
    phone: '',
    whatsapp: row?.whatsapp ?? '',
    instagram: row?.instagram ?? '',
    site: '',
    logoUrl: row?.logo_url ?? '',
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null
  };
}

function toSiteSettingsInsert(input: CompanySettingsInput, userId: string): SiteSettingsTableInsert {
  return {
    user_id: userId,
    agency_name: input.companyName,
    headline: '',
    description: '',
    whatsapp: input.whatsapp,
    instagram: input.instagram,
    logo_url: input.logoUrl,
    cover_image_url: '',
    primary_color: '#1d4ed8',
    is_published: false
  };
}

function toSiteSettingsUpdate(
  input: CompanySettingsInput,
  current: SiteSettingsTableRow | null
): SiteSettingsTableUpdate {
  return {
    agency_name: input.companyName,
    headline: current?.headline ?? '',
    description: current?.description ?? '',
    whatsapp: input.whatsapp,
    instagram: input.instagram,
    logo_url: input.logoUrl,
    cover_image_url: current?.cover_image_url ?? '',
    primary_color: current?.primary_color ?? '#1d4ed8',
    is_published: current?.is_published ?? false
  };
}

export function createSupabaseSettingsRepository(
  client: SupabaseSettingsClient
): SupabaseSettingsRepository {
  async function updateUserProfile(
    id: string,
    input: UserProfileInput,
    user: SupabaseUser
  ) {
    const response = await client
      .from('user_profiles')
      .update(toUserProfileUpdate(input))
      .eq('id', id)
      .select('*')
      .single();

    assertNoError(response, 'Nao foi possivel atualizar perfil');

    if (!response.data) {
      throw new Error('Supabase nao retornou o perfil atualizado.');
    }

    return toUserProfileRecord(response.data, user);
  }

  async function getSiteSettings(userId: string) {
    const response = await client
      .from('site_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    assertNoError(response, 'Nao foi possivel carregar dados da empresa');

    return response.data;
  }

  return {
    async getUserProfile() {
      const user = await getCurrentUser(client);
      const response = await client
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      assertNoError(response, 'Nao foi possivel carregar perfil');

      return toUserProfileRecord(response.data, user);
    },

    async saveUserProfile(input, existingId) {
      const user = await getCurrentUser(client);

      if (existingId) {
        return updateUserProfile(existingId, input, user);
      }

      const existingResponse = await client
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      assertNoError(existingResponse, 'Nao foi possivel verificar perfil existente');

      if (existingResponse.data) {
        return updateUserProfile(existingResponse.data.id, input, user);
      }

      const response = await client
        .from('user_profiles')
        .insert(toUserProfileInsert(input, user.id))
        .select('*')
        .single();

      assertNoError(response, 'Nao foi possivel criar perfil');

      if (!response.data) {
        throw new Error('Supabase nao retornou o perfil criado.');
      }

      return toUserProfileRecord(response.data, user);
    },

    async getCompanySettings() {
      const user = await getCurrentUser(client);
      const row = await getSiteSettings(user.id);

      return toCompanySettingsRecord(row);
    },

    async saveCompanySettings(input, existingId) {
      const user = await getCurrentUser(client);
      const current = await getSiteSettings(user.id);

      if (existingId || current) {
        const response = await client
          .from('site_settings')
          .update(toSiteSettingsUpdate(input, current))
          .eq('id', existingId ?? current?.id ?? '')
          .select('*')
          .single();

        assertNoError(response, 'Nao foi possivel atualizar dados da empresa');

        if (!response.data) {
          throw new Error('Supabase nao retornou os dados atualizados da empresa.');
        }

        return toCompanySettingsRecord(response.data);
      }

      const response = await client
        .from('site_settings')
        .insert(toSiteSettingsInsert(input, user.id))
        .select('*')
        .single();

      assertNoError(response, 'Nao foi possivel criar dados da empresa');

      if (!response.data) {
        throw new Error('Supabase nao retornou os dados criados da empresa.');
      }

      return toCompanySettingsRecord(response.data);
    }
  };
}
