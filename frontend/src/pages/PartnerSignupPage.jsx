import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Coins, Globe2, Landmark, MapPin, Phone, Rocket, User2 } from 'lucide-react';
import api from '../config/axios';
import { useToast } from '../context/ToastContext';

const commissionRate = 0.15;

const workflow = [
  { icon: User2, title: 'Inscription', subtitle: 'Profil partenaire en 2 minutes' },
  { icon: Rocket, title: 'Publication', subtitle: 'Mettez votre experience en ligne' },
  { icon: Globe2, title: 'Vente', subtitle: 'Recevez des clients du monde entier' },
  { icon: Landmark, title: 'Versement', subtitle: 'Paiement automatise et garanti a J+7' },
];

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
        toast('Pre-inscription envoyee avec succes. Notre equipe vous contacte vite.', { type: 'success' });
      } else {
        toast(data?.message || 'Validation de la reservation en cours...', { type: 'info' });
      }
    } catch (error) {
      toast('Validation de la reservation en cours...', { type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <section className="container mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-sm text-emerald-200">
              Programme Partenaires Overglow
            </span>
            <h1 className="mt-5 text-4xl lg:text-5xl font-extrabold leading-tight">
              Devenez partenaire et transformez vos experiences locales en revenus globaux.
            </h1>
            <p className="mt-4 text-slate-300 text-lg">
              Une plateforme travel-tech premium, construite pour les experts terrain.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-300 mt-0.5" size={20} />
                <p className="text-slate-100"><strong>Zero frais d'inscription</strong> pour lancer votre activite.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-300 mt-0.5" size={20} />
                <p className="text-slate-100"><strong>Paiements garantis et automatises a J+7</strong> pour un cashflow clair.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-300 mt-0.5" size={20} />
                <p className="text-slate-100"><strong>Visibilite mondiale</strong> pour les experts locaux.</p>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workflow.map((step) => (
                <div key={step.title} className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                  <step.icon size={18} className="text-cyan-300 mb-2" />
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-sm text-slate-300">{step.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
              <h2 className="text-xl font-bold mb-1">Calculateur de revenus</h2>
              <p className="text-slate-300 text-sm mb-5">Commission transparente: 15%</p>
              <label className="block text-sm text-slate-300 mb-2">Prix de votre activite: €{price}</label>
              <input
                type="range"
                min="20"
                max="500"
                step="5"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-800 p-3">
                  <p className="text-xs text-slate-400">Commission Overglow</p>
                  <p className="font-bold text-rose-300">€{(price * commissionRate).toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-emerald-950/50 border border-emerald-500/30 p-3">
                  <p className="text-xs text-emerald-200">Votre gain net</p>
                  <p className="font-bold text-emerald-300">€{net.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-white text-slate-900 p-6">
              <h2 className="text-xl font-bold mb-4">Pre-inscription partenaire</h2>
              {done ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                  Merci. Votre demande est enregistree, un conseiller partenaire vous contacte rapidement.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nom</label>
                    <div className="mt-1 flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2">
                      <User2 size={16} className="text-slate-500" />
                      <input name="name" value={form.name} onChange={handleChange} required className="w-full outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type d'activite</label>
                    <div className="mt-1 flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2">
                      <Coins size={16} className="text-slate-500" />
                      <input name="activityType" value={form.activityType} onChange={handleChange} placeholder="Guide prive, atelier, excursion..." required className="w-full outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ville</label>
                    <div className="mt-1 flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2">
                      <MapPin size={16} className="text-slate-500" />
                      <input name="city" value={form.city} onChange={handleChange} required className="w-full outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">WhatsApp</label>
                    <div className="mt-1 flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2">
                      <Phone size={16} className="text-slate-500" />
                      <input name="whatsapp" value={form.whatsapp} onChange={handleChange} required className="w-full outline-none" />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-slate-900 text-white py-3 font-bold hover:bg-slate-800 disabled:opacity-60"
                  >
                    {loading ? 'Envoi en cours...' : 'Rejoindre Overglow Partners'}
                  </button>
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
