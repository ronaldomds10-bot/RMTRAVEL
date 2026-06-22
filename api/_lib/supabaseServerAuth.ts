import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage } from 'node:http';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

function getAuthorizationHeader(request: IncomingMessage) {
  const value = request.headers.authorization;
  return Array.isArray(value) ? value[0] : value;
}

export function getBearerToken(request: IncomingMessage) {
  const authorization = getAuthorizationHeader(request);

  if (!authorization) {
    return null;
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function hasValidSupabaseSession(request: IncomingMessage) {
  const token = getBearerToken(request);

  if (!token || !supabaseUrl || !supabaseAnonKey) {
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  const { data, error } = await supabase.auth.getUser(token);

  return !error && Boolean(data.user);
}
