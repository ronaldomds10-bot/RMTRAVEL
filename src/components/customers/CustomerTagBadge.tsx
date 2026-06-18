import { Badge } from '../ui/Badge';
import type { CustomerTag } from '../../types/customer';

type CustomerTagBadgeProps = {
  tag: CustomerTag;
};

const tagConfig: Record<CustomerTag, { label: string; tone: 'green' | 'blue' | 'amber' | 'slate' }> = {
  viagem: { label: 'Viagem', tone: 'green' },
  milhas: { label: 'Milhas', tone: 'blue' },
  financeiro: { label: 'Financeiro', tone: 'amber' },
  atendimento: { label: 'Atendimento', tone: 'slate' }
};

export function CustomerTagBadge({ tag }: CustomerTagBadgeProps) {
  const config = tagConfig[tag];

  return <Badge tone={config.tone}>{config.label}</Badge>;
}
