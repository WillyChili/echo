import { authFetch } from './api';

export async function cleanupSpeechText(text, lang) {
  const res = await authFetch('/api/speech/cleanup', {
    method: 'POST',
    body: JSON.stringify({ text, lang }),
  });
  if (!res.ok) return text; // fallback: keep raw text
  const data = await res.json();
  return data.cleaned || text;
}
