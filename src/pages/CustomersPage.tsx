import { Plus, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CustomerFilters } from '../components/customers/CustomerFilters';
import { CustomerSummaryCards } from '../components/customers/CustomerSummaryCards';
import { CustomerTable } from '../components/customers/CustomerTable';
import { NewCustomerModal } from '../components/customers/NewCustomerModal';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { customers } from '../data/mock';
import type { CustomerStatus, CustomerTag } from '../types/customer';

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CustomerStatus | 'todos'>('todos');
  const [tag, setTag] = useState<CustomerTag | 'todas'>('todas');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          customer.personal.fullName,
          customer.personal.documentNumber,
          customer.personal.type,
          customer.contact.email,
          customer.contact.phone,
          customer.address.city,
          customer.address.state
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus = status === 'todos' || customer.travelProfile.status === status;
      const matchesTag = tag === 'todas' || customer.travelProfile.tags.includes(tag);

      return matchesSearch && matchesStatus && matchesTag;
    });
  }, [search, status, tag]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Clientes"
          description="Central mockada para consultar clientes, acompanhar pendencias e preparar fluxos de atendimento."
          badge="Dados mockados"
        />
        <Button className="w-full sm:w-auto sm:shrink-0" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={16} aria-hidden="true" />
          Novo cliente
        </Button>
      </div>

      <CustomerSummaryCards customers={customers} />

      <CustomerFilters
        search={search}
        status={status}
        tag={tag}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onTagChange={setTag}
      />

      {filteredCustomers.length > 0 ? (
        <CustomerTable customers={filteredCustomers} />
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              title="Nenhum cliente encontrado"
              description="Ajuste a busca ou os filtros visuais para voltar a exibir a base mockada de clientes."
              actionLabel="Revisar filtros"
              icon={UsersRound}
            />
          </CardContent>
        </Card>
      )}

      <NewCustomerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </section>
  );
}
