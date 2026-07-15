import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Coins, Globe2, Landmark, MapPin, Phone, Rocket, User2 } from 'lucide-react';
import api from '../config/axios';
import { useToast } from '../context/ToastContext';

const commissionRate = 0.15;

/**
 * [TASK-10] Partner signup — thème clair aligné design system (plus de dark theme)
 */
const PartnerSignupPage = () => {
  const { t } = useTranslation();
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

  const workflow = useMemo(
    () => [
      { icon: User2, title: t('partner.step_1_title'), subtitle: t('partner.step_1_sub') },
      { icon: Rocket, title: t('partner.step_2_title'), subtitle: t('partner.step_2_sub') },
      { icon: Globe2, title: t('partner.step_3_title'), subtitle: t('partner.step_3_sub') },
      { icon: Landmark, title: t('partner.step_4_title'), subtitle: t('partner.step_4_sub') },
    ],
    [t]
  );

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
        toast(t('partner.toast_ok'), { type: 'success' });
      } else {
        toast(data?.message || t('partner.toast_info'), { type: 'info' });
      }
    } catch (_error) {
      toast(t('partner.toast_error'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-14 md:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm">
            {t('partner.badge')}
          </span>
          <h1 className="mt-5 text-3xl md:text-5xl font-heading font-bold leading-tight max-w-3xl">
            {t('partner.title')}
          </h1>
          <p className="mt-4 text-primary-50 text-lg max-w-2xl">
            {t('partner.subtitle')}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 lg:py-16 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <div className="space-y-3 mb-10">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-primary-600 mt-0.5 shrink-0" size={20} />
                <p className="text-slate-700">{t('partner.benefit_1')}</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-primary-600 mt-0.5 shrink-0" size={20} />
                <p className="text-slate-700">{t('partner.benefit_2')}</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-primary-600 mt-0.5 shrink-0" size={20} />
                <p className="text-slate-700">{t('partner.benefit_3')}</p>
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
              <h2 className="text-xl font-heading font-bold text-slate-900 mb-1">{t('partner.calc_title')}</h2>
              <p className="text-muted text-sm mb-5">{t('partner.calc_hint')}</p>
              <label className="block text-sm text-slate-600 mb-2">
                {t('partner.price_label', { price })}
              </label>
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
                  <p className="text-xs text-muted">{t('partner.commission')}</p>
                  <p className="font-bold text-rose-600">€{(price * commissionRate).toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-primary-50 border border-primary-100 p-3">
                  <p className="text-xs text-primary-700">{t('partner.net')}</p>
                  <p className="font-bold text-primary-700">€{net.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="surface-card p-6">
              <h2 className="text-xl font-heading font-bold text-slate-900 mb-4">{t('partner.form_title')}</h2>
              {done ? (
                <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 text-primary-800">
                  {t('partner.success')}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">{t('partner.label_name')}</label>
                    <div className="mt-1 flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-white">
                      <User2 size={16} className="text-slate-400" />
                      <input name="name" value={form.name} onChange={handleChange} required className="w-full outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">{t('partner.label_activity')}</label>
                    <div className="mt-1 flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-white">
                      <Coins size={16} className="text-slate-400" />
                      <input
                        name="activityType"
                        value={form.activityType}
                        onChange={handleChange}
                        placeholder={t('partner.activity_placeholder')}
                        required
                        className="w-full outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">{t('partner.label_city')}</label>
                    <div className="mt-1 flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-white">
                      <MapPin size={16} className="text-slate-400" />
                      <input name="city" value={form.city} onChange={handleChange} required className="w-full outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">{t('partner.label_whatsapp')}</label>
                    <div className="mt-1 flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-white">
                      <Phone size={16} className="text-slate-400" />
                      <input name="whatsapp" value={form.whatsapp} onChange={handleChange} required className="w-full outline-none" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                    {loading ? t('partner.submitting') : t('partner.submit')}
                  </button>
                  <p className="text-xs text-muted text-center">
                    {t('partner.already')}{' '}
                    <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                      {t('partner.create_operator')}
                    </Link>
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
