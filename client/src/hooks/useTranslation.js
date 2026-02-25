import { useProfile } from '../context/ProfileContext';
import translations from '../lib/translations';

export function useTranslation() {
  const { language } = useProfile();
  const lang = language || 'en';
  const dict = translations[lang] || translations.en;

  const t = (key) => dict[key] ?? translations.en[key] ?? key;

  return { t, language: lang };
}
