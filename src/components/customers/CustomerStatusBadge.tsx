import { Badge } from '../ui/Badge';
import type { CustomerStatus } from '../../types/customer';

type CustomerStatusBadgeProps = {
  status: CustomerStatus;
};

const statusConfig: Record<CustomerStatus, { label: string; tone: 'green' | 'amber' | 'slate' }> = {
  ativo: { label: 'Ativo', tone: 'green' },
  pendente: { label: 'Pendente', tone: 'amber' },
  inativo: { label: 'Inativo', tone: 'slate' }
};

export function CustomerStatusBadge({ status }: CustomerStatusBadgeProps) {
  const config = statusConfig[status];

  return <Badge tone={config.tone}>{config.label}</Badge>;
}
