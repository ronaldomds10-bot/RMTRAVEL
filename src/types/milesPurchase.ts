export type MilesPurchaseStatus = 'pending' | 'completed' | 'cancelled';

export type MilesPurchase = {
  id: string;
  programId: string;
  programName: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  purchaseDate: string;
  status: MilesPurchaseStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type MilesPurchaseInput = {
  programId: string;
  supplierId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  purchaseDate: string;
  status: MilesPurchaseStatus;
  notes: string;
};

export type MilesPurchaseTableRow = {
  id: string;
  user_id: string;
  program_id: string | null;
  supplier_id: string | null;
  quantity: number | string;
  unit_cost: number | string;
  total_cost: number | string;
  purchase_date: string;
  status: MilesPurchaseStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  miles_programs?: {
    program_name: string | null;
  } | null;
  suppliers?: {
    name: string | null;
  } | null;
};

export type MilesPurchaseTableInsert = Omit<
  MilesPurchaseTableRow,
  'id' | 'created_at' | 'updated_at' | 'miles_programs' | 'suppliers'
>;

export type MilesPurchaseTableUpdate = Partial<
  Omit<
    MilesPurchaseTableRow,
    'id' | 'user_id' | 'created_at' | 'updated_at' | 'miles_programs' | 'suppliers'
  >
>;

export const milesPurchaseStatusLabels: Record<MilesPurchaseStatus, string> = {
  pending: 'Pendente',
  completed: 'Concluida',
  cancelled: 'Cancelada'
};
