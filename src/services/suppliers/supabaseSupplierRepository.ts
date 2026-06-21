import { supabase } from '../../lib/supabase';
import type { Supplier, SupplierInput, SupplierStatus, SupplierType } from '../../types/supplier';

type SupplierTableRow = {
  id: string;
  user_id: string;
  name: string;
  type: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type SupplierTableInsert = Omit<SupplierTableRow, 'id' | 'created_at' | 'updated_at'>;
type SupplierTableUpdate = Partial<
  Omit<SupplierTableRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase nao esta configurado para fornecedores.');
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
    throw new Error('Usuario autenticado nao encontrado para persistir fornecedores.');
  }

  return data.user.id;
}

function toSupplier(row: SupplierTableRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    type: row.type as SupplierType,
    document: row.document ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    whatsapp: row.whatsapp ?? '',
    notes: row.notes ?? '',
    status: row.status as SupplierStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toSupplierTableInsert(supplier: SupplierInput, userId: string): SupplierTableInsert {
  return {
    user_id: userId,
    name: supplier.name,
    type: supplier.type,
    document: supplier.document || null,
    email: supplier.email || null,
    phone: supplier.phone || null,
    whatsapp: supplier.whatsapp || null,
    notes: supplier.notes || null,
    status: supplier.status
  };
}

function toSupplierTableUpdate(supplier: SupplierInput): SupplierTableUpdate {
  const { user_id: _userId, ...values } = toSupplierTableInsert(supplier, 'unused');
  return values;
}

export const supplierRepository = {
  async listSuppliers(): Promise<Supplier[]> {
    const client = requireSupabase();
    const { data, error } = await client
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Nao foi possivel listar fornecedores: ${error.message}`);
    }

    return ((data ?? []) as SupplierTableRow[]).map(toSupplier);
  },

  async createSupplier(supplier: SupplierInput): Promise<Supplier> {
    const client = requireSupabase();
    const userId = await getCurrentUserId();
    const { data, error } = await client
      .from('suppliers')
      .insert(toSupplierTableInsert(supplier, userId))
      .select('*')
      .single();

    if (error) {
      throw new Error(`Nao foi possivel criar fornecedor: ${error.message}`);
    }

    if (!data) {
      throw new Error('Supabase nao retornou o fornecedor criado.');
    }

    return toSupplier(data as SupplierTableRow);
  },

  async updateSupplier(id: string, supplier: SupplierInput): Promise<Supplier | null> {
    const client = requireSupabase();
    const { data, error } = await client
      .from('suppliers')
      .update(toSupplierTableUpdate(supplier))
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(`Nao foi possivel atualizar fornecedor: ${error.message}`);
    }

    return data ? toSupplier(data as SupplierTableRow) : null;
  },

  async deleteSupplier(id: string): Promise<boolean> {
    const client = requireSupabase();
    const { error } = await client.from('suppliers').delete().eq('id', id);

    if (error) {
      throw new Error(`Nao foi possivel remover fornecedor: ${error.message}`);
    }

    return true;
  }
};
