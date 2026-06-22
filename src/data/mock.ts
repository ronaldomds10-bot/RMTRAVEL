import {
  BadgeDollarSign,
  BarChart3,
  ClipboardCheck,
  Globe2,
  Settings,
  Ticket as TicketIcon,
  UsersRound,
  WalletCards
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Customer } from '../types/customer';

type Tone = 'green' | 'blue' | 'slate' | 'amber';

export type DashboardMetric = {
  label: string;
  value: string;
  change: string;
  tone: Tone;
  icon: LucideIcon;
  path: string;
};

export type QuickAction = {
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
};

export type ActivityItem = {
  id: string;
  title: string;
  meta: string;
  status: string;
  tone: Tone;
};

export type UpcomingItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
};

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: 'Bilhetes em acompanhamento',
    value: '128',
    change: '+12 nesta semana',
    tone: 'green',
    icon: TicketIcon,
    path: '/platform/tickets'
  },
  {
    label: 'Clientes ativos',
    value: '342',
    change: 'Clientes cadastrados',
    tone: 'blue',
    icon: UsersRound,
    path: '/platform/customers'
  },
  {
    label: 'Receita prevista',
    value: 'R$ 84,2 mil',
    change: 'Indicador inicial',
    tone: 'amber',
    icon: BadgeDollarSign,
    path: '/platform/analytics'
  },
  {
    label: 'Operacoes pendentes',
    value: '18',
    change: 'Acompanhar ajustes',
    tone: 'slate',
    icon: ClipboardCheck,
    path: '/platform/site'
  }
];

export const quickActions: QuickAction[] = [
  {
    title: 'Site',
    description: 'Gerencie a base da presenca digital da RMTRAVEL.',
    path: '/platform/site',
    icon: Globe2
  },
  {
    title: 'Analise e Gestao',
    description: 'Acompanhe indicadores e proximas visoes gerenciais.',
    path: '/platform/analytics',
    icon: BarChart3
  },
  {
    title: 'Milhas',
    description: 'Organize a futura operacao de programas e saldos.',
    path: '/platform/miles',
    icon: WalletCards
  },
  {
    title: 'Configuracoes',
    description: 'Acesse preferencias, empresa, perfil e assinatura.',
    path: '/platform/settings',
    icon: Settings
  }
];

export const recentActivities: ActivityItem[] = [
  {
    id: 'act-001',
    title: 'Estrutura de navegacao revisada',
    meta: 'Hoje, 09:20',
    status: 'Base',
    tone: 'green'
  },
  {
    id: 'act-002',
    title: 'Rotas administrativas mapeadas',
    meta: 'Hoje, 09:05',
    status: 'Mock',
    tone: 'blue'
  },
  {
    id: 'act-003',
    title: 'Dashboard inicial preparado',
    meta: 'Ontem, 17:40',
    status: 'UI',
    tone: 'amber'
  }
];

export const upcomingItems: UpcomingItem[] = [
  {
    id: 'up-001',
    title: 'Definir fluxo de bilhetes',
    subtitle: 'Priorizacao de campos, filtros e estados.',
    time: 'Proxima etapa'
  },
  {
    id: 'up-002',
    title: 'Modelar clientes e fornecedores',
    subtitle: 'Preparar estrutura antes de conectar dados reais.',
    time: 'Planejado'
  },
  {
    id: 'up-003',
    title: 'Especificar financeiro',
    subtitle: 'Separar receitas, custos, faturas e indicadores.',
    time: 'Backlog'
  }
];

export const customers: Customer[] = [
  {
    id: 'CUS-1001',
    personal: {
      fullName: 'Marina Costa',
      documentType: 'CPF',
      documentNumber: '123.456.789-10',
      type: 'VIP'
    },
    contact: {
      email: 'marina.costa@email.com',
      phone: '+55 11 98231-4470',
      preferredChannel: 'WhatsApp'
    },
    address: {
      city: 'Sao Paulo',
      state: 'SP',
      country: 'Brasil'
    },
    travelProfile: {
      status: 'ativo',
      tags: ['viagem', 'milhas'],
      lastInteraction: 'Hoje, 10:14',
      nextAction: 'Confirmar emissao para Lisboa',
      tripInProgress: true,
      preferredDestinations: ['Lisboa', 'Paris']
    },
    financial: {
      openAmount: 0,
      currency: 'BRL',
      hasPendingPayment: false
    },
    notes: 'Cliente prioritaria para viagens internacionais.'
  },
  {
    id: 'CUS-1002',
    personal: {
      fullName: 'Grupo Almeida Logistica',
      documentType: 'CNPJ',
      documentNumber: '12.345.678/0001-90',
      type: 'Empresa'
    },
    contact: {
      email: 'viagens@almeidalog.com',
      phone: '+55 21 3344-1980',
      preferredChannel: 'Email'
    },
    address: {
      city: 'Rio de Janeiro',
      state: 'RJ',
      country: 'Brasil'
    },
    travelProfile: {
      status: 'pendente',
      tags: ['financeiro', 'atendimento'],
      lastInteraction: 'Ontem, 16:42',
      nextAction: 'Revisar pagamento de fatura',
      tripInProgress: false,
      preferredDestinations: ['Recife', 'Salvador']
    },
    financial: {
      openAmount: 4280,
      currency: 'BRL',
      hasPendingPayment: true
    },
    notes: 'Conta corporativa com faturamento recorrente.'
  },
  {
    id: 'CUS-1003',
    personal: {
      fullName: 'Rafael Nogueira',
      documentType: 'CPF',
      documentNumber: '987.654.321-00',
      type: 'Pessoa fisica'
    },
    contact: {
      email: 'rafael.nogueira@email.com',
      phone: '+55 31 99120-7711',
      preferredChannel: 'WhatsApp'
    },
    address: {
      city: 'Belo Horizonte',
      state: 'MG',
      country: 'Brasil'
    },
    travelProfile: {
      status: 'ativo',
      tags: ['viagem', 'atendimento'],
      lastInteraction: 'Segunda, 09:30',
      nextAction: 'Enviar opcoes de hoteis',
      tripInProgress: true,
      preferredDestinations: ['Buenos Aires', 'Santiago']
    },
    financial: {
      openAmount: 690,
      currency: 'BRL',
      hasPendingPayment: true
    },
    notes: 'Prefere viagens com suporte por WhatsApp.'
  },
  {
    id: 'CUS-1004',
    personal: {
      fullName: 'Beatriz Martins',
      documentType: 'Passaporte',
      documentNumber: 'YA123456',
      type: 'Pessoa fisica'
    },
    contact: {
      email: 'bia.martins@email.com',
      phone: '+55 41 98810-5502',
      preferredChannel: 'Email'
    },
    address: {
      city: 'Curitiba',
      state: 'PR',
      country: 'Brasil'
    },
    travelProfile: {
      status: 'inativo',
      tags: ['milhas'],
      lastInteraction: '12/06/2026',
      nextAction: 'Reativar relacionamento',
      tripInProgress: false,
      preferredDestinations: ['Orlando']
    },
    financial: {
      openAmount: 0,
      currency: 'BRL',
      hasPendingPayment: false
    },
    notes: 'Historico de compras por milhas.'
  },
  {
    id: 'CUS-1005',
    personal: {
      fullName: 'Orion Tecnologia',
      documentType: 'CNPJ',
      documentNumber: '22.333.444/0001-55',
      type: 'Empresa'
    },
    contact: {
      email: 'corporativo@oriontech.com',
      phone: '+55 51 3030-4400',
      preferredChannel: 'Email'
    },
    address: {
      city: 'Porto Alegre',
      state: 'RS',
      country: 'Brasil'
    },
    travelProfile: {
      status: 'ativo',
      tags: ['viagem', 'financeiro'],
      lastInteraction: 'Hoje, 08:05',
      nextAction: 'Acompanhar check-in executivo',
      tripInProgress: true,
      preferredDestinations: ['Sao Paulo', 'Bogota']
    },
    financial: {
      openAmount: 1320,
      currency: 'BRL',
      hasPendingPayment: true
    },
    notes: 'Atendimento corporativo com prioridade operacional.'
  },
  {
    id: 'CUS-1006',
    personal: {
      fullName: 'Camila Rocha',
      documentType: 'CPF',
      documentNumber: '321.654.987-20',
      type: 'VIP'
    },
    contact: {
      email: 'camila.rocha@email.com',
      phone: '+55 85 99712-4300',
      preferredChannel: 'WhatsApp'
    },
    address: {
      city: 'Fortaleza',
      state: 'CE',
      country: 'Brasil'
    },
    travelProfile: {
      status: 'pendente',
      tags: ['milhas', 'financeiro'],
      lastInteraction: 'Terca, 14:18',
      nextAction: 'Validar compra de milhas',
      tripInProgress: false,
      preferredDestinations: ['Miami', 'Cancun']
    },
    financial: {
      openAmount: 980,
      currency: 'BRL',
      hasPendingPayment: true
    },
    notes: 'Sensivel a prazo de emissao e disponibilidade de milhas.'
  }
];

export const placeholderActions = [
  'Mapear requisitos',
  'Definir campos',
  'Desenhar fluxo',
  'Validar layout'
] as const;
