import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export function RequireAuth({ children }: PropsWithChildren) {
  const { isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 px-4 text-center">
        <div>
          <div className="mx-auto grid size-12 place-items-center rounded-lg bg-brand-700 text-sm font-bold text-white">
            RM
          </div>
          <p className="mt-4 text-sm font-semibold text-ink-900">Carregando acesso</p>
          <p className="mt-2 text-sm text-ink-500">Verificando sua sessao.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate replace to="/login" state={{ from: location }} />;
  }

  return children;
}
