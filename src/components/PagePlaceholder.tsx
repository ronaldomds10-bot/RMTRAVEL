import type { PlatformPage } from '../data/pages';
import { placeholderActions } from '../data/mock';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { PageHeader } from './ui/PageHeader';

type PagePlaceholderProps = {
  page: PlatformPage;
};

export function PagePlaceholder({ page }: PagePlaceholderProps) {
  const upcomingFeatures = page.upcomingFeatures ?? [
    'Mapear requisitos',
    'Definir campos principais',
    'Validar fluxo inicial'
  ];

  return (
    <section className="space-y-6">
      <PageHeader title={page.title} description={page.description} badge="Tela planejada" />

      <Card>
        <CardContent>
          <EmptyState
            title={`${page.title} em estruturação`}
            description="Esta rota já está preparada no layout principal. Conteúdo, filtros, tabelas e ações serão especificados antes de qualquer integração."
            actionLabel="Ação visual"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {upcomingFeatures.map((feature) => (
          <Card key={feature}>
            <CardContent>
              <p className="text-sm font-semibold text-ink-900">{feature}</p>
              <p className="mt-2 text-sm leading-5 text-ink-500">
                Funcionalidade prevista para evoluir esta area sem regras complexas nesta etapa.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-900">Próximas decisões da tela</h2>
            <p className="mt-1 text-sm text-ink-500">
              Botões abaixo são exemplos visuais e ainda não executam ações.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {placeholderActions.map((action) => (
              <Button key={action} variant="secondary" size="sm">
                {action}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
