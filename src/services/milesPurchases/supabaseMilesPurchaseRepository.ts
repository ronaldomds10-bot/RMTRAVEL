import { supabase } from '../../lib/supabase';
import type {
  MilesPurchase,
  MilesPurchaseInput,
  MilesPurchaseTableInsert,
  MilesPurchaseTableRow,
  MilesPurchaseTableUpdate
} from '../../types/milesPurchase';

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase nao esta configurado para compras de milhas.');
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
    throw new Error('Usuario autenticado nao encontrado para persistir compras de milhas.');
  }

  return data.user.id;
}

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMilesPurchase(row: MilesPurchaseTableRow): MilesPurchase {
  return {
    id: row.id,
    programId: row.program_id ?? '',
    programName: row.miles_programs?.program_name ?? '',
    supplierId: row.supplier_id ?? '',
    supplierName: row.suppliers?.name ?? '',
    quantity: numberValue(row.quantity),
    unitCost: numberValue(row.unit_cost),
    totalCost: numberValue(row.total_cost),
    purchaseDate: row.purchase_date,
    status: row.status,
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toMilesPurchaseTableInsert(
  input: MilesPurchaseInput,
  userId: string
): MilesPurchaseTableInsert {
  return {
    user_id: userId,
    program_id: input.programId || null,
    supplier_id: input.supplierId || null,
    quantity: input.quantity,
    unit_cost: input.unitCost,
    total_cost: input.totalCost,
    purchase_date: input.purchaseDate,
    status: input.status,
    notes: input.notes || null
  };
}

function toMilesPurchaseTableUpdate(input: MilesPurchaseInput): MilesPurchaseTableUpdate {
  const { user_id: _userId, ...values } = toMilesPurchaseTableInsert(input, 'unused');
  return values;
}

const purchaseSelect = `
  *,
  miles_programs (
    program_name
  ),
  suppliers (
    name
  )
`;

export const milesPurchaseRepository = {
  async listPurchases(): Promise<MilesPurchase[]> {
    const client = requireSupabase();
    const { data, error } = await client
      .from('miles_purchases')
      .select(purchaseSelect)
      .order('purchase_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Nao foi possivel listar compras de milhas: ${error.message}`);
    }

    return ((data ?? []) as MilesPurchaseTableRow[]).map(toMilesPurchase);
  },

  async createPurchase(input: MilesPurchaseInput): Promise<MilesPurchase> {
    const client = requireSupabase();
    const userId = await getCurrentUserId();
    const { data, error } = await client
      .from('miles_purchases')
      .insert(toMilesPurchaseTableInsert(input, userId))
      .select(purchaseSelect)
      .single();

    if (error) {
      throw new Error(`Nao foi possivel criar compra de milhas: ${error.message}`);
    }

    if (!data) {
      throw new Error('Supabase nao retornou a compra de milhas criada.');
    }

    return toMilesPurchase(data as MilesPurchaseTableRow);
  },

  async updatePurchase(id: string, input: MilesPurchaseInput): Promise<MilesPurchase | null> {
    const client = requireSupabase();
    const { data, error } = await client
      .from('miles_purchases')
      .update(toMilesPurchaseTableUpdate(input))
      .eq('id', id)
      .select(purchaseSelect)
      .maybeSingle();

    if (error) {
      throw new Error(`Nao foi possivel atualizar compra de milhas: ${error.message}`);
    }

    return data ? toMilesPurchase(data as MilesPurchaseTableRow) : null;
  },

  async deletePurchase(id: string): Promise<boolean> {
    const client = requireSupabase();
    const { error } = await client.from('miles_purchases').delete().eq('id', id);

    if (error) {
      throw new Error(`Nao foi possivel remover compra de milhas: ${error.message}`);
    }

    return true;
  }
};
