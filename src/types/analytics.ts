export type AnalyticsMetric = {
  totalTickets: number;
  totalCustomers: number;
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
};

export type AnalyticsMovement = {
  id: string;
  type: 'sale' | 'ticket';
  title: string;
  description: string;
  amount: number | null;
  status: string;
  updatedAt: string;
};

export type AnalyticsSummary = AnalyticsMetric & {
  latestMovements: AnalyticsMovement[];
};
