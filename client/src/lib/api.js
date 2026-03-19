// Wrapper around fetch that automatically adds the Supabase JWT token
// and enforces a 15-second timeout on all requests.
import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    return await fetch(`${API_BASE}${url}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
