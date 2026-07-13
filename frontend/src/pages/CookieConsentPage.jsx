import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Cookie, Save } from 'lucide-react';

const DEFAULTS = {
  essential: true,
  analytics: true,
  marketing: false,
};

/**
 * Préférences cookies (stockage local — pas de CMP externe requis).
 */
const CookieConsentPage = () => {
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('overglow_cookie_prefs');
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw), essential: true });
    } catch {
      /* ignore */
    }
  }, []);

  const save = () => {
    const next = { ...prefs, essential: true };
    localStorage.setItem('overglow_cookie_prefs', JSON.stringify(next));
    setPrefs(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="page-shell">
      <Helmet>
        <title>Préférences de cookies | Overglow Trip</title>
      </Helmet>
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white pt-28 pb-14">
        <div className="container mx-auto px-4 max-w-2xl">
          <Cookie className="mb-4" size={40} />
          <h1 className="text-4xl font-heading font-bold mb-2">Préférences de cookies</h1>
          <p className="text-primary-100">Choisissez les catégories autorisées sur cet appareil.</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-2xl space-y-4">
        {[
          { key: 'essential', label: 'Essentiels', locked: true, desc: 'Toujours actifs' },
          { key: 'analytics', label: 'Analytics', locked: false, desc: 'Mesure d’audience' },
          { key: 'marketing', label: 'Marketing', locked: false, desc: 'Campagnes & remarketing' },
        ].map((row) => (
          <label
            key={row.key}
            className="surface-card p-5 flex items-start justify-between gap-4 cursor-pointer"
          >
            <div>
              <p className="font-bold text-slate-900">{row.label}</p>
              <p className="text-sm text-slate-600">{row.desc}</p>
            </div>
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={!!prefs[row.key]}
              disabled={row.locked}
              onChange={(e) => setPrefs((p) => ({ ...p, [row.key]: e.target.checked }))}
            />
          </label>
        ))}

        <div className="flex flex-wrap gap-3 pt-4">
          <button type="button" onClick={save} className="btn-primary">
            <Save size={16} /> Enregistrer
          </button>
          <Link to="/cookies" className="btn-secondary">
            Politique cookies
          </Link>
          {saved && <span className="text-sm text-green-700 font-semibold self-center">Enregistré</span>}
        </div>
      </div>
    </div>
  );
};

export default CookieConsentPage;
