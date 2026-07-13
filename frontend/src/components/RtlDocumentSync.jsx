import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * [TASK-16] Synchronise <html lang> et <html dir> avec la langue active.
 * Source unique — évite les conflits Header / LanguageSelector / Manifest.
 */
const RtlDocumentSync = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'fr').slice(0, 2);
  const supported = ['fr', 'en', 'es', 'ar'].includes(lang) ? lang : 'fr';
  const dir = supported === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const root = document.documentElement;
    root.lang = supported;
    root.dir = dir;
    root.classList.toggle('rtl', dir === 'rtl');
    root.classList.toggle('ltr', dir === 'ltr');
    // Legacy: certains composants lisent encore document.dir
    document.dir = dir;
  }, [supported, dir]);

  return null;
};

export default RtlDocumentSync;
