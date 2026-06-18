export type SiteConfiguration = {
  agencyName: string;
  headline: string;
  description: string;
  whatsapp: string;
  instagram: string;
  logoUrl: string;
  coverImageUrl: string;
  primaryColor: string;
  isPublished: boolean;
};

export type SiteConfigurationRecord = SiteConfiguration & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type SiteSettingsTableRow = {
  id: string;
  user_id: string;
  agency_name: string;
  headline: string;
  description: string;
  whatsapp: string;
  instagram: string;
  logo_url: string;
  cover_image_url: string;
  primary_color: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type SiteSettingsTableInsert = Omit<
  SiteSettingsTableRow,
  'id' | 'created_at' | 'updated_at'
>;

export type SiteSettingsTableUpdate = Partial<
  Omit<SiteSettingsTableRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;
