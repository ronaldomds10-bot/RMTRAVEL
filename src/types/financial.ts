export type FinancialSaleStatus =
  | 'orcamento'
  | 'aguardando_pagamento'
  | 'pago'
  | 'emitido'
  | 'cancelado';

export type FinancialSaleRecord = {
  id: string;
  customerName: string;
  ticketLocator: string | null;
  saleAmount: number;
  costAmount: number;
  profitAmount: number;
  paymentMethod: string | null;
  status: FinancialSaleStatus;
  createdAt: string;
  updatedAt: string;
};

export type FinancialSummary = {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  marginPercent: number;
  paidCount: number;
  pendingCount: number;
  salesCount: number;
};

export type FinancialData = {
  summary: FinancialSummary;
  sales: FinancialSaleRecord[];
};
