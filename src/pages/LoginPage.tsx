import { LogIn } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { hasSupabaseConfig } from '../lib/supabase';

type LoginLocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const { isLoading, signIn, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from = (location.state as LoginLocationState | null)?.from?.pathname ?? '/platform';

  if (!isLoading && user) {
    return <Navigate replace to={from} />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel fazer login.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10 text-ink-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-lg bg-brand-700 text-sm font-bold text-white shadow-sm">
            RM
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-ink-900">RMTRAVEL</h1>
          <p className="mt-2 text-sm text-ink-500">Acesse a plataforma operacional.</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-ink-900">Login</h2>
            <p className="text-sm text-ink-500">Use email e senha cadastrados para acessar sua conta.</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm font-semibold text-ink-700">Email</span>
                <input
                  autoComplete="email"
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                  disabled={isSubmitting}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@empresa.com"
                  type="email"
                  value={email}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-ink-700">Senha</span>
                <input
                  autoComplete="current-password"
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                  disabled={isSubmitting}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Sua senha"
                  type="password"
                  value={password}
                />
              </label>

              {!hasSupabaseConfig ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Login indisponivel neste ambiente.
                </p>
              ) : null}

              {errorMessage ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </p>
              ) : null}

              <Button
                className="w-full"
                disabled={!hasSupabaseConfig || isSubmitting || !email || !password}
                type="submit"
              >
                <LogIn size={16} aria-hidden="true" />
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
