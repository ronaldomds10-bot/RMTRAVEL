import { Eye, MessageCircle, Pencil } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { CustomerMobileCard } from './CustomerMobileCard';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { CustomerTagBadge } from './CustomerTagBadge';
import type { Customer } from '../../types/customer';
import { formatCurrency } from '../../lib/formatters';

type CustomerTableProps = {
  customers: Customer[];
};

export function CustomerTable({ customers }: CustomerTableProps) {
  return (
    <>
      <div className="space-y-3 lg:hidden">
        <div>
          <h2 className="text-base font-semibold text-ink-900">Lista de clientes</h2>
          <p className="text-sm text-ink-500">{customers.length} clientes encontrados</p>
        </div>
        {customers.map((customer) => (
          <CustomerMobileCard customer={customer} key={customer.id} />
        ))}
      </div>

      <Card className="hidden lg:block">
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-900">Lista de clientes</h2>
            <p className="text-sm text-ink-500">{customers.length} clientes encontrados</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-3">Cliente</th>
                  <th className="px-3 py-3">Contato</th>
                  <th className="px-3 py-3">Cidade</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Proxima acao</th>
                  <th className="px-3 py-3">Valor em aberto</th>
                  <th className="px-3 py-3">Tags</th>
                  <th className="px-3 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((customer) => (
                  <tr className="align-top transition hover:bg-slate-50" key={customer.id}>
                    <td className="px-3 py-4">
                      <p className="font-semibold text-ink-900">{customer.personal.fullName}</p>
                      <p className="mt-1 text-sm text-ink-500">
                        {customer.id} · {customer.personal.type}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {customer.personal.documentType}: {customer.personal.documentNumber}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Ultima interacao: {customer.travelProfile.lastInteraction}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-sm text-ink-700">{customer.contact.email}</p>
                      <p className="mt-1 text-sm text-ink-500">{customer.contact.phone}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Preferencia: {customer.contact.preferredChannel}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-sm text-ink-700">
                      {customer.address.city}, {customer.address.state}
                    </td>
                    <td className="px-3 py-4">
                      <CustomerStatusBadge status={customer.travelProfile.status} />
                    </td>
                    <td className="max-w-52 px-3 py-4 text-sm leading-5 text-ink-700">
                      {customer.travelProfile.nextAction}
                    </td>
                    <td className="px-3 py-4 text-sm font-semibold text-ink-900">
                      {formatCurrency(customer.financial.openAmount)}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex max-w-48 flex-wrap gap-1.5">
                        {customer.travelProfile.tags.map((tag) => (
                          <CustomerTagBadge key={tag} tag={tag} />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          aria-label={`Ver detalhes de ${customer.personal.fullName}`}
                          variant="ghost"
                          size="sm"
                        >
                          <Eye size={16} aria-hidden="true" />
                        </Button>
                        <Button
                          aria-label={`Editar ${customer.personal.fullName}`}
                          variant="ghost"
                          size="sm"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </Button>
                        <Button
                          aria-label={`Abrir WhatsApp de ${customer.personal.fullName}`}
                          variant="ghost"
                          size="sm"
                        >
                          <MessageCircle size={16} aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
