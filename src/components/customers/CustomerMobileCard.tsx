import { Eye, MessageCircle, Pencil } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { CustomerTagBadge } from './CustomerTagBadge';
import type { Customer } from '../../types/customer';
import { formatCurrency } from '../../lib/formatters';

type CustomerMobileCardProps = {
  customer: Customer;
};

export function CustomerMobileCard({ customer }: CustomerMobileCardProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-semibold text-ink-900">{customer.personal.fullName}</p>
            <p className="mt-1 text-sm text-ink-500">
              {customer.id} · {customer.personal.type}
            </p>
          </div>
          <CustomerStatusBadge status={customer.travelProfile.status} />
        </div>

        <div className="grid gap-3 text-sm">
          <InfoRow label="Contato" value={`${customer.contact.email} · ${customer.contact.phone}`} />
          <InfoRow
            label="Documento"
            value={`${customer.personal.documentType} ${customer.personal.documentNumber}`}
          />
          <InfoRow label="Cidade" value={`${customer.address.city}, ${customer.address.state}`} />
          <InfoRow label="Ultima interacao" value={customer.travelProfile.lastInteraction} />
          <InfoRow label="Proxima acao" value={customer.travelProfile.nextAction} />
          <InfoRow
            label="Valor em aberto"
            value={formatCurrency(customer.financial.openAmount)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {customer.travelProfile.tags.map((tag) => (
            <CustomerTagBadge key={tag} tag={tag} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="secondary" size="sm">
            <Eye size={15} aria-hidden="true" />
            Ver
          </Button>
          <Button variant="secondary" size="sm">
            <Pencil size={15} aria-hidden="true" />
            Editar
          </Button>
          <Button variant="secondary" size="sm">
            <MessageCircle size={15} aria-hidden="true" />
            WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-ink-700">{value}</p>
    </div>
  );
}
