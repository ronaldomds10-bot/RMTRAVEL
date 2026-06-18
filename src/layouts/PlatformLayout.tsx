import { Bell, Menu, PanelLeftClose, Search } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { navigationGroups } from '../data/navigation';
import { platformPages } from '../data/pages';
import { cn } from '../lib/cn';

export function PlatformLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();
  const currentPage = platformPages.find((page) => page.path === location.pathname);

  return (
    <div className="min-h-screen bg-slate-100 text-ink-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <SidebarContent onNavigate={() => setIsMobileNavOpen(false)} />
      </aside>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Fechar navegação"
            className="absolute inset-0 bg-slate-950/40"
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <aside className="relative h-full w-[min(21rem,88vw)] border-r border-slate-200 bg-white shadow-2xl">
            <SidebarContent onNavigate={() => setIsMobileNavOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <button
              aria-label="Abrir navegação"
              className="grid size-10 place-items-center rounded-lg border border-slate-200 text-ink-700 hover:bg-slate-50 lg:hidden"
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900">
                {currentPage?.title ?? 'RMTRAVEL'}
              </p>
              <p className="truncate text-xs text-ink-500">
                Estrutura SaaS inicial sem integrações
              </p>
            </div>

            <div className="hidden h-10 w-full max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-ink-500 md:flex">
              <Search size={16} aria-hidden="true" />
              <span>Buscar na plataforma</span>
            </div>

            <button
              aria-label="Notificações"
              className="relative grid size-10 place-items-center rounded-lg border border-slate-200 text-ink-700 hover:bg-slate-50"
              type="button"
            >
              <Bell size={18} aria-hidden="true" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-brand-600" />
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

type SidebarContentProps = {
  onNavigate: () => void;
};

function SidebarContent({ onNavigate }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
        <BrandMark />
        <PanelLeftClose className="text-slate-300 lg:hidden" size={20} aria-hidden="true" />
      </div>

      <div className="px-4 py-4">
        <div className="rounded-lg border border-brand-100 bg-brand-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-900">Workspace</p>
              <p className="mt-1 text-xs text-brand-700">RMTRAVEL inicial</p>
            </div>
            <Badge tone="green">Mock</Badge>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Navegação principal">
        <div className="space-y-5">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {group.title}
              </p>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/platform'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                        isActive
                          ? 'bg-brand-700 text-white shadow-sm'
                          : 'text-ink-700 hover:bg-slate-50 hover:text-ink-900'
                      )
                    }
                  >
                    <item.icon size={18} aria-hidden="true" />
                    <span className="truncate">{item.title}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-sm font-semibold text-ink-900">Ambiente inicial</p>
          <p className="mt-1 text-xs leading-5 text-ink-500">
            Sem APIs, autenticação ou integrações externas nesta etapa.
          </p>
          <Button className="mt-3 w-full" size="sm" variant="secondary">
            Ver plano visual
          </Button>
        </div>
      </div>
    </div>
  );
}
