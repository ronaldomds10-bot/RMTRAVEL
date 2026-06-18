export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
};

export type UserProfileRecord = UserProfile & {
  id: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type UserProfileInput = Omit<UserProfile, 'email'>;

export type UserProfilesTableRow = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
};

export type UserProfilesTableInsert = Omit<
  UserProfilesTableRow,
  'id' | 'created_at' | 'updated_at'
>;
export type UserProfilesTableUpdate = Partial<
  Omit<UserProfilesTableRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

export type CompanySettings = {
  companyName: string;
  cnpj: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  site: string;
  logoUrl: string;
};

export type CompanySettingsRecord = CompanySettings & {
  id: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CompanySettingsInput = CompanySettings;
