import { AlertCircle, Plane, UserCheck, UsersRound } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import type { Customer } from '../../types/customer';
import { formatCurrency } from '../../lib/formatters';

type CustomerSummaryCardsProps = {
  customers: Customer[];
};

export function CustomerSummaryCards({ customers }: CustomerSummaryCardsProps) {
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(
    (customer) => customer.travelProfile.status === 'ativo'
  ).length;
  const customersTraveling = customers.filter(
    (customer) => customer.travelProfile.tripInProgress
  ).length;
  const pendingCustomers = customers.filter(
    (customer) => customer.travelProfile.status === 'pendente'
  ).length;
  const openAmount = customers.reduce(
    (total, customer) => total + customer.financial.openAmount,
    0
  );

  const cards = [
    {
      label: 'Total de clientes',
      value: String(totalCustomers),
      helper: 'Clientes cadastrados',
      icon: UsersRound
    },
    {
      label: 'Clientes ativos',
      value: String(activeCustomers),
      helper: 'Prontos para operacao',
      icon: UserCheck
    },
    {
      label: 'Viagem em andamento',
      value: String(customersTraveling),
      helper: 'Em acompanhamento',
      icon: Plane
    },
    {
      label: 'Com pendencia',
      value: String(pendingCustomers),
      helper: formatCurrency(openAmount),
      icon: AlertCircle
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-500">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold text-ink-900">{card.value}</p>
                <p className="mt-1 text-sm text-ink-500">{card.helper}</p>
              </div>
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <card.icon size={20} aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
