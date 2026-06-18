import {
  BadgeDollarSign,
  BarChart3,
  Bell,
  Building2,
  ChartNoAxesCombined,
  CircleUserRound,
  CreditCard,
  FileText,
  Gauge,
  Globe2,
  Headphones,
  Plane,
  ReceiptText,
  Settings,
  ShieldCheck,
  Ticket,
  UploadCloud,
  UsersRound,
  WalletCards
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavigationItem = {
  title: string;
  path: string;
  icon: LucideIcon;
};

export type NavigationGroup = {
  title: string;
  items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    title: 'Operação',
    items: [
      { title: 'Painel', path: '/platform', icon: Gauge },
      { title: 'Bilhetes', path: '/platform/tickets', icon: Ticket },
      { title: 'Importar emissão', path: '/platform/tickets/import', icon: UploadCloud },
      { title: 'Clientes', path: '/platform/customers', icon: UsersRound },
      { title: 'Site', path: '/platform/site', icon: Globe2 },
      { title: 'Vendas', path: '/platform/emissions/sales', icon: Plane }
    ]
  },
  {
    title: 'Gestão',
    items: [
      { title: 'Analise e Gestao', path: '/platform/analytics', icon: BarChart3 },
      { title: 'Financeiro', path: '/platform/financial', icon: BadgeDollarSign },
      { title: 'Faturas', path: '/platform/invoices', icon: ReceiptText },
      { title: 'Fornecedores', path: '/platform/fornecedores', icon: Building2 },
      { title: 'Monitoramento', path: '/platform/monitoring', icon: ChartNoAxesCombined },
      { title: 'Notificações', path: '/platform/notifications', icon: Bell }
    ]
  },
  {
    title: 'Milhas',
    items: [
      { title: 'Milhas', path: '/platform/miles', icon: WalletCards },
      { title: 'Gestão de milhas', path: '/platform/miles-management', icon: WalletCards },
      { title: 'Compras de milhas', path: '/platform/miles-purchases', icon: CreditCard },
      { title: 'Transferência de milhas', path: '/platform/miles-transfer', icon: ShieldCheck }
    ]
  },
  {
    title: 'Configurações',
    items: [
      { title: 'Configurações', path: '/platform/settings', icon: Settings },
      { title: 'Meu perfil', path: '/platform/settings/profile', icon: CircleUserRound },
      { title: 'Minha empresa', path: '/platform/settings/my-company', icon: FileText },
      { title: 'Minha assinatura', path: '/platform/settings/my-subscription', icon: CreditCard },
      { title: 'Atendimento', path: '/platform/voajet-resolve', icon: Headphones }
    ]
  }
];
