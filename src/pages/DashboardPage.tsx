import { ArrowRight, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { dashboardMetrics, quickActions, recentActivities, upcomingItems } from '../data/mock';

export function DashboardPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Painel"
        description="Visão inicial para organizar operações, clientes, bilhetes e indicadores antes das telas definitivas."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <Link className="block" key={metric.label} to={metric.path}>
            <Card className="h-full transition hover:border-brand-200 hover:bg-brand-50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-500">{metric.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-ink-900">{metric.value}</p>
                  </div>
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-50 text-brand-700 ring-1 ring-slate-200">
                    <metric.icon size={20} aria-hidden="true" />
                  </div>
                </div>
                <Badge className="mt-4" tone={metric.tone}>
                  {metric.change}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
        <Card>
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink-900">Atalhos rápidos</h2>
              <p className="text-sm text-ink-500">Entradas visuais para as áreas prioritárias.</p>
            </div>
            <Link
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-ink-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              to="/platform/settings"
            >
              Organizar
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => (
                <Link
                  className="group rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-brand-200 hover:bg-brand-50"
                  key={action.title}
                  to={action.path}
                >
                  <div className="grid size-10 place-items-center rounded-lg bg-white text-brand-700 shadow-sm ring-1 ring-slate-200">
                    <action.icon size={20} aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-ink-900">{action.title}</h3>
                  <p className="mt-2 text-sm leading-5 text-ink-500">{action.description}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
                    Abrir
                    <ArrowRight
                      className="transition group-hover:translate-x-0.5"
                      size={16}
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-ink-900">Próximos itens</h2>
            <p className="text-sm text-ink-500">Atividades recentes da operação.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingItems.map((item) => (
              <div className="flex gap-3" key={item.id}>
                <div className="mt-1 grid size-9 shrink-0 place-items-center rounded-lg bg-skyway-50 text-skyway-700 ring-1 ring-skyway-100">
                  <CalendarDays size={17} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-5 text-ink-500">{item.subtitle}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {item.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Atividades recentes</h2>
          <p className="text-sm text-ink-500">Eventos recentes para acompanhar a operação.</p>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {recentActivities.map((activity) => (
              <div
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                key={activity.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">{activity.title}</p>
                  <p className="mt-1 text-sm text-ink-500">{activity.meta}</p>
                </div>
                <Badge tone={activity.tone}>{activity.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
