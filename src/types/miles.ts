export const milesProgramTypes = [
  'LATAM Pass',
  'Smiles',
  'TudoAzul',
  'Livelo',
  'Esfera',
  'AAdvantage',
  'Iberia Plus',
  'outro'
] as const;

export type MilesProgramType = (typeof milesProgramTypes)[number];
export type MilesProgramStatus = 'active' | 'inactive';

export type MilesProgram = {
  programName: string;
  type: MilesProgramType;
  balance: number;
  accountHolder: string;
  expirationDate: string;
  notes: string;
  status: MilesProgramStatus;
};

export type MilesProgramRecord = MilesProgram & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type MilesProgramInput = MilesProgram;

export type MilesProgramSummary = {
  totalPrograms: number;
  totalBalance: number;
  activePrograms: number;
  lastUpdatedAt: string | null;
};

export type MilesProgramsTableRow = {
  id: string;
  user_id: string;
  program_name: string;
  type: MilesProgramType;
  balance: number | string;
  account_holder: string;
  expiration_date: string | null;
  notes: string | null;
  status: MilesProgramStatus;
  created_at: string;
  updated_at: string;
};

export type MilesProgramsTableInsert = Omit<
  MilesProgramsTableRow,
  'id' | 'created_at' | 'updated_at'
>;

export type MilesProgramsTableUpdate = Partial<
  Omit<MilesProgramsTableRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;
