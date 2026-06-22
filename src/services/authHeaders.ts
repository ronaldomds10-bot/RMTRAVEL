import { supabase } from '../lib/supabase';

const unauthenticatedMessage = 'Sua sessao expirou. Entre novamente para continuar.';

export async function getAuthenticatedJsonHeaders() {
  if (!supabase) {
    throw new Error(unauthenticatedMessage);
  }

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error(unauthenticatedMessage);
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`
  };
}
