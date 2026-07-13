import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Coins, Globe2, Landmark, MapPin, Phone, Rocket, User2 } from 'lucide-react';
import api from '../config/axios';
import { useToast } from '../context/ToastContext';

const commissionRate = 0.15;

const workflow = [
  { icon: User2, title: 'Inscription', subtitle: 'Profil partenaire en 2 minutes' },
  { icon: Rocket, title: 'Publication', subtitle: 'Mettez votre expérience en ligne' },
  { icon: Globe2, title: 'Vente', subtitle: 'Recevez des clients du monde entier' },
  { icon: Landmark, title: 'Versement', subtitle: 'Paiement automatisé et garanti à J+7' },
];

/**
 * [TASK-10] Partner signup — thème clair aligné design system (plus de dark theme)
 */
const PartnerSignupPage = () => {
  const [searchParams] = useSearchParams();
  const prefilledActivity = searchParams.get('activity') || '';
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [price, setPrice] = useState(80);
  const [form, setForm] = useState({
    name: '',
    activityType: prefilledActivity,
    city: '',
    whatsapp: '',
  });

  const net = useMemo(() => price * (1 - commissionRate), [price]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/partner-signup', form);
      if (data?.success) {
        setDone(true);
        toast('Pré-inscription envoyée avec succès. Notre équipe vous contacte vite.', { type: 'success' });
      } else {
        toast(data?.message || 'Demande reçue.', { type: 'info' });
      }
    } catch (error) {
      toast('Une erreur est survenue. Réessayez dans un instant.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-14 md:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm">
            Programme Partenaires Overglow
          </span>
          <h1 className="mt-5 text-3xl md:text-5xl font-heading font-bold leading-tight max-w-3xl">
            Devenez partenaire et transformez vos expériences locales en revenus globaux.
          </h1>
          <p className="mt-4 text-primary-50 text-lg max-w-2xl">
            Une plateforme travel-tech premium, construite pour les experts terrain.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 lg:py-16 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <div className="space-y-3 mb-10">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-primary-600 mt-0.5 shrink-0" size={20} />
                <p className="text-slate-700"><strong>Zéro frais d&apos;inscription</strong> pour lancer votre activité.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-primary-600 mt-0.5 shrink-0" size={20} />
                <p className="text-slate-700"><strong>Paiements garantis à J+7</strong> pour un cashflow clair.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-primary-600 mt-0.5 shrink-0" size={20} />
                <p className="text-slate-700"><strong>Visibilité mondiale</strong> pour les experts locaux.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workflow.map((step) => (
                <div key={step.title} className="surface-card p-4">
                  <step.icon size={18} className="text-primary-600 mb-2" />
                  <p className="font-semibold text-slate-900">{step.title}</p>
                  <p className="text-sm text-muted">{step.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="surface-card p-6">
              <h2 className="text-xl font-heading font-bold text-slate-900 mb-1">Calculateur de revenus</h2>
              <p className="text-muted text-sm mb-5">Commission transparente : 15%</p>
              <label className="block text-sm text-slate-600 mb-2">Prix de votre activité : €{price}</label>
              <input
                type="range"
                min="20"
                max="500"
                step="5"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full accent-primary-600"
              />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 border border-border p-3">
                  <p className="text-xs text-muted">Commission Overglow</p>
                  <p className="font-bold text-rose-600">€{(price * commissionRate).toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-primary-50 border border-primary-100 p-3">
                  <p className="text-xs text-primary-700">Votre gain net</p>
                  <p className="font-bold text-primary-700">€{net.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="surface-card p-6">
              <h2 className="text-xl font-heading font-bold text-slate-900 mb-4">Pré-inscription partenaire</h2>
              {done ? (
                <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 text-primary-800">
                  Merci. Votre demande est enregistrée, un conseiller partenaire vous contacte rapidement.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Nom</label>
                    <div className="mt-1 flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-white">
                      <User2 size={16} className="text-slate-400" />
                      <input name="name" value={form.name} onChange={handleChange} required className="w-full outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Type d&apos;activité</label>
                    <div className="mt-1 flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-white">
                      <Coins size={16} className="text-slate-400" />
                      <input name="activityType" value={form.activityType} onChange={handleChange} placeholder="Guide privé, atelier, excursion..." required className="w-full outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Ville</label>
                    <div className="mt-1 flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-white">
                      <MapPin size={16} className="text-slate-400" />
                      <input name="city" value={form.city} onChange={handleChange} required className="w-full outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">WhatsApp</label>
                    <div className="mt-1 flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-white">
                      <Phone size={16} className="text-slate-400" />
                      <input name="whatsapp" value={form.whatsapp} onChange={handleChange} required className="w-full outline-none" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                    {loading ? 'Envoi en cours...' : 'Rejoindre Overglow Partners'}
                  </button>
                  <p className="text-xs text-muted text-center">
                    Déjà un compte ? <Link to="/register" className="text-primary-600 font-semibold hover:underline">Créer un compte opérateur</Link>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PartnerSignupPage;
