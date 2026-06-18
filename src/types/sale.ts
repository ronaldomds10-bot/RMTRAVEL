export type SaleStatus = 'orcamento' | 'aguardando_pagamento' | 'pago' | 'emitido' | 'cancelado';

export type SalePaymentMethod = 'Pix' | 'Cartao' | 'Boleto' | 'Transferencia' | 'Dinheiro';

export type Sale = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  ticketId: string;
  ticketLabel: string;
  origin: string;
  destination: string;
  costAmount: number;
  saleAmount: number;
  profitAmount: number;
  paymentMethod: SalePaymentMethod;
  status: SaleStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type SaleInput = Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'profitAmount'> & {
  id?: string;
};
