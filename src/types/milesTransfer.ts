export type MilesTransferStatus = 'pending' | 'completed' | 'cancelled';

export type MilesTransfer = {
  id: string;
  fromProgramId: string;
  fromProgramName: string;
  toProgramId: string;
  toProgramName: string;
  quantity: number;
  bonusPercentage: number;
  finalQuantity: number;
  transferDate: string;
  status: MilesTransferStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type MilesTransferInput = {
  fromProgramId: string;
  toProgramId: string;
  quantity: number;
  bonusPercentage: number;
  finalQuantity: number;
  transferDate: string;
  status: MilesTransferStatus;
  notes: string;
};

export type MilesTransferTableRow = {
  id: string;
  user_id: string;
  from_program_id: string | null;
  to_program_id: string | null;
  quantity: number | string;
  bonus_percentage: number | string;
  final_quantity: number | string;
  transfer_date: string;
  status: MilesTransferStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  from_program?: {
    program_name: string | null;
  } | null;
  to_program?: {
    program_name: string | null;
  } | null;
};

export type MilesTransferTableInsert = Omit<
  MilesTransferTableRow,
  'id' | 'created_at' | 'updated_at' | 'from_program' | 'to_program'
>;

export type MilesTransferTableUpdate = Partial<
  Omit<
    MilesTransferTableRow,
    'id' | 'user_id' | 'created_at' | 'updated_at' | 'from_program' | 'to_program'
  >
>;

export const milesTransferStatusLabels: Record<MilesTransferStatus, string> = {
  pending: 'Pendente',
  completed: 'Concluida',
  cancelled: 'Cancelada'
};
