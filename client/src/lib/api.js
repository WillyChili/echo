// Wrapper around fetch that automatically adds the Supabase JWT token
import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}
