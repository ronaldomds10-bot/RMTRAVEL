export type PlatformPage = {
  path: string;
  title: string;
  description: string;
  upcomingFeatures?: string[];
};

export const platformPages: PlatformPage[] = [
  {
    path: '/platform',
    title: 'Painel',
    description: 'Visão geral operacional da RMTRAVEL.'
  },
  {
    path: '/platform/tickets',
    title: 'Bilhetes',
    description: 'Área reservada para acompanhar e gerenciar bilhetes.'
  },
  {
    path: '/platform/tickets/import',
    title: 'Importar emissão',
    description: 'Importação de emissões por companhia, localizador e sobrenome.'
  },
  {
    path: '/platform/customers',
    title: 'Clientes',
    description: 'Cadastro e acompanhamento de clientes.'
  },
  {
    path: '/platform/site',
    title: 'Site',
    description: 'Base para gerenciar a presenca digital e os conteudos publicados da RMTRAVEL.',
    upcomingFeatures: [
      'Paginas institucionais',
      'Vitrine de pacotes e ofertas',
      'Conteudos e chamadas comerciais'
    ]
  },
  {
    path: '/platform/analytics',
    title: 'Analise e Gestao',
    description: 'Area inicial para indicadores, gestao operacional e acompanhamento executivo.',
    upcomingFeatures: [
      'Indicadores por periodo',
      'Relatorios de performance',
      'Visao consolidada de operacoes'
    ]
  },
  {
    path: '/platform/miles',
    title: 'Milhas',
    description: 'Base para organizar saldos, compras, transferencias e oportunidades com milhas.',
    upcomingFeatures: [
      'Carteira de programas',
      'Compras e transferencias',
      'Historico de movimentacoes'
    ]
  },
  {
    path: '/platform/financial',
    title: 'Financeiro',
    description: 'Resumo financeiro e controles de pagamento.'
  },
  {
    path: '/platform/invoices',
    title: 'Faturas',
    description: 'Consulta e organização de faturas.'
  },
  {
    path: '/platform/monitoring',
    title: 'Monitoramento',
    description: 'Acompanhamento de eventos e indicadores importantes.'
  },
  {
    path: '/platform/notifications',
    title: 'Notificações',
    description: 'Central de alertas e comunicações.'
  },
  {
    path: '/platform/settings',
    title: 'Configurações',
    description: 'Preferências gerais da plataforma.',
    upcomingFeatures: [
      'Perfil e acessos',
      'Dados da empresa',
      'Plano e preferencias da conta'
    ]
  },
  {
    path: '/platform/settings/profile',
    title: 'Meu perfil',
    description: 'Dados e preferências do usuário.'
  },
  {
    path: '/platform/settings/company',
    title: 'Minha empresa',
    description: 'Dados da empresa ou agencia usados na plataforma.'
  },
  {
    path: '/platform/settings/subscription',
    title: 'Minha assinatura',
    description: 'Plano e status da assinatura.'
  },
  {
    path: '/platform/settings/support',
    title: 'Atendimento',
    description: 'Canais de suporte e orientacoes de atendimento.'
  },
  {
    path: '/platform/settings/my-company',
    title: 'Minha empresa',
    description: 'Informações institucionais da empresa.'
  },
  {
    path: '/platform/settings/my-subscription',
    title: 'Minha assinatura',
    description: 'Plano, cobrança e status da assinatura.'
  },
  {
    path: '/platform/emissions/sales',
    title: 'Vendas',
    description: 'Fluxo inicial para emissões e vendas.'
  },
  {
    path: '/platform/miles-management',
    title: 'Gestão de milhas',
    description: 'Controle de saldos, programas e movimentações.'
  },
  {
    path: '/platform/miles-purchases',
    title: 'Compras de milhas',
    description: 'Registro e acompanhamento de compras.'
  },
  {
    path: '/platform/miles-transfer',
    title: 'Transferência de milhas',
    description: 'Operações de transferência entre programas.'
  },
  {
    path: '/platform/fornecedores',
    title: 'Fornecedores',
    description: 'Gestão de fornecedores.'
  },
  {
    path: '/platform/voajet-resolve',
    title: 'Atendimento',
    description: 'Espaço reservado para suporte e resolução de solicitações.'
  }
];
