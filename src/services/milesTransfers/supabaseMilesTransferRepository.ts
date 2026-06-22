import { supabase } from '../../lib/supabase';
import type {
  MilesTransfer,
  MilesTransferInput,
  MilesTransferTableInsert,
  MilesTransferTableRow,
  MilesTransferTableUpdate
} from '../../types/milesTransfer';

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase nao esta configurado para transferencias de milhas.');
  }

  return supabase;
}

async function getCurrentUserId() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();

  if (error) {
    throw new Error(`Nao foi possivel identificar o usuario autenticado: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('Usuario autenticado nao encontrado para persistir transferencias de milhas.');
  }

  return data.user.id;
}

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateFinalQuantity(quantity: number, bonusPercentage: number) {
  const normalizedQuantity = Math.max(0, Number(quantity) || 0);
  const normalizedBonus = Math.max(0, Number(bonusPercentage) || 0);

  return normalizedQuantity + normalizedQuantity * (normalizedBonus / 100);
}

function toMilesTransfer(row: MilesTransferTableRow): MilesTransfer {
  return {
    id: row.id,
    fromProgramId: row.from_program_id ?? '',
    fromProgramName: row.from_program?.program_name ?? '',
    toProgramId: row.to_program_id ?? '',
    toProgramName: row.to_program?.program_name ?? '',
    quantity: numberValue(row.quantity),
    bonusPercentage: numberValue(row.bonus_percentage),
    finalQuantity: numberValue(row.final_quantity),
    transferDate: row.transfer_date,
    status: row.status,
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toMilesTransferTableInsert(
  input: MilesTransferInput,
  userId: string
): MilesTransferTableInsert {
  return {
    user_id: userId,
    from_program_id: input.fromProgramId || null,
    to_program_id: input.toProgramId || null,
    quantity: input.quantity,
    bonus_percentage: input.bonusPercentage,
    final_quantity: calculateFinalQuantity(input.quantity, input.bonusPercentage),
    transfer_date: input.transferDate,
    status: input.status,
    notes: input.notes || null
  };
}

function toMilesTransferTableUpdate(input: MilesTransferInput): MilesTransferTableUpdate {
  const { user_id: _userId, ...values } = toMilesTransferTableInsert(input, 'unused');
  return values;
}

const transferSelect = `
  *,
  from_program:miles_programs!miles_transfers_from_program_id_fkey (
    program_name
  ),
  to_program:miles_programs!miles_transfers_to_program_id_fkey (
    program_name
  )
`;

export const milesTransferRepository = {
  async listTransfers(): Promise<MilesTransfer[]> {
    const client = requireSupabase();
    const { data, error } = await client
      .from('miles_transfers')
      .select(transferSelect)
      .order('transfer_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Nao foi possivel listar transferencias de milhas: ${error.message}`);
    }

    return ((data ?? []) as MilesTransferTableRow[]).map(toMilesTransfer);
  },

  async createTransfer(input: MilesTransferInput): Promise<MilesTransfer> {
    const client = requireSupabase();
    const userId = await getCurrentUserId();
    const { data, error } = await client
      .from('miles_transfers')
      .insert(toMilesTransferTableInsert(input, userId))
      .select(transferSelect)
      .single();

    if (error) {
      throw new Error(`Nao foi possivel criar transferencia de milhas: ${error.message}`);
    }

    if (!data) {
      throw new Error('Supabase nao retornou a transferencia de milhas criada.');
    }

    return toMilesTransfer(data as MilesTransferTableRow);
  },

  async updateTransfer(id: string, input: MilesTransferInput): Promise<MilesTransfer | null> {
    const client = requireSupabase();
    const userId = await getCurrentUserId();
    const { data, error } = await client
      .from('miles_transfers')
      .update(toMilesTransferTableUpdate(input))
      .eq('id', id)
      .eq('user_id', userId)
      .select(transferSelect)
      .maybeSingle();

    if (error) {
      throw new Error(`Nao foi possivel atualizar transferencia de milhas: ${error.message}`);
    }

    return data ? toMilesTransfer(data as MilesTransferTableRow) : null;
  },

  async deleteTransfer(id: string): Promise<boolean> {
    const client = requireSupabase();
    const userId = await getCurrentUserId();
    const { error } = await client.from('miles_transfers').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      throw new Error(`Nao foi possivel remover transferencia de milhas: ${error.message}`);
    }

    return true;
  }
};
