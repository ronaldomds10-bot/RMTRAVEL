export type SupplierStatus = 'ativo' | 'inativo';

export type SupplierType =
  | 'companhia_aerea'
  | 'hotel'
  | 'operadora'
  | 'seguro'
  | 'transporte'
  | 'servico'
  | 'outro';

export type Supplier = {
  id: string;
  name: string;
  type: SupplierType;
  document: string;
  email: string;
  phone: string;
  whatsapp: string;
  notes: string;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
};

export type SupplierInput = Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>;

export const supplierTypeLabels: Record<SupplierType, string> = {
  companhia_aerea: 'Companhia aerea',
  hotel: 'Hotel',
  operadora: 'Operadora',
  seguro: 'Seguro',
  transporte: 'Transporte',
  servico: 'Servico',
  outro: 'Outro'
};

export const supplierStatusLabels: Record<SupplierStatus, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo'
};
