import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Pointe le <link rel="manifest"> vers le manifeste de la langue active (dir ltr/rtl).
 * lang/dir HTML sont gérés par RtlDocumentSync.
 */
const DynamicManifest = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'fr').slice(0, 2);
  const supported = ['fr', 'en', 'es', 'ar'].includes(lang) ? lang : 'fr';

  useEffect(() => {
    const href = `/manifest-${supported}.json`;
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = href;
  }, [supported]);

  return null;
};

export default DynamicManifest;
