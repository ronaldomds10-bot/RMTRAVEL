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
