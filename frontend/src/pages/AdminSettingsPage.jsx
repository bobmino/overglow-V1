import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Banknote,
  CreditCard,
  Bell,
  Mail,
  Loader2,
  Eye,
  Send,
  X,
} from 'lucide-react';
import api from '../config/axios';
import { useToast } from '../context/ToastContext';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { logger } from '../utils/logger.js';

const TABS = [
  { id: 'general', label: 'Général', icon: SettingsIcon },
  { id: 'finance', label: 'Finances', icon: Banknote },
  { id: 'payments', label: 'Paiements', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'emails', label: 'Emails', icon: Mail },
];

const DEFAULTS = {
  autoApproveProducts: false,
  autoApproveReviews: false,
  maintenanceMode: false,
  defaultLanguage: 'fr',
  defaultCurrency: 'MAD',
  platformCommissionPercent: 15,
  minWithdrawalDays: 7,
  transferFeeMad: 0,
  minWithdrawalAmountMad: 100,
  stripeEnabled: false,
  stripeTestMode: true,
  paypalEnabled: false,
  paypalTestMode: true,
  cmiEnabled: false,
  bankTransferEnabled: true,
  showIban: true,
  bankIban: 'MA640070012345678901234567',
  bankSwift: 'BCMAMAMC',
  bankName: 'Attijariwafa Bank',
  bankAccountName: 'Overglow Trip SARL',
  supportEmail: '',
  notifyNewUser: true,
  notifyNewBooking: true,
  notifyPaymentReceived: true,
  notifyWithdrawalRequested: true,
  digestEmailFrequency: 'weekly',
};

const ToggleRow = ({ title, help, checked, saving, onChange }) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
    </div>
    <button
      type="button"
      disabled={saving}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-primary-600' : 'bg-gray-300'
      }`}
      aria-pressed={checked}
    >
      {saving ? (
        <Loader2 size={14} className="absolute left-1/2 -translate-x-1/2 text-white animate-spin" />
      ) : (
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      )}
    </button>
  </div>
);

const FieldRow = ({ title, help, children }) => (
  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
    {help && <p className="text-xs text-gray-500 mb-3">{help}</p>}
    {children}
  </div>
);

/**
 * [PROMPT-5] Organized admin settings center with tabs + instant save.
 */
const AdminSettingsPage = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initialTab = TABS.some((t) => t.id === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'general';
  const [tab, setTab] = useState(initialTab);
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  // [PROMPT-18] Email templates
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [preview, setPreview] = useState(null); // { id, subject, html, locale }
  const [previewLoading, setPreviewLoading] = useState(false);
  const [testSendingId, setTestSendingId] = useState(null);
  const [previewLocale, setPreviewLocale] = useState('fr');

  useEffect(() => {
    const q = searchParams.get('tab');
    if (q && TABS.some((t) => t.id === q)) setTab(q);
  }, [searchParams]);

  useEffect(() => {
    if (tab !== 'emails') return undefined;
    let cancelled = false;
    const loadTemplates = async () => {
      setEmailsLoading(true);
      try {
        const { data } = await api.get('/api/admin/emails/templates');
        if (!cancelled) setEmailTemplates(data.templates || []);
      } catch (err) {
        logger.error('Failed to load email templates', err);
        if (!cancelled) toast('Impossible de charger les templates email', { type: 'error' });
      } finally {
        if (!cancelled) setEmailsLoading(false);
      }
    };
    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, [tab, toast]);

  const openEmailPreview = async (templateId, locale = previewLocale) => {
    setPreviewLoading(true);
    try {
      const { data } = await api.get(`/api/admin/emails/templates/${templateId}/preview`, {
        params: { locale },
      });
      setPreview({
        id: templateId,
        subject: data.subject,
        html: data.html,
        locale: data.locale || locale,
      });
      setPreviewLocale(data.locale || locale);
    } catch (err) {
      logger.error('Email preview failed', err);
      toast(err.response?.data?.message || 'Échec de la prévisualisation', { type: 'error' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const sendTestEmail = async (templateId) => {
    setTestSendingId(templateId);
    try {
      const { data } = await api.post(`/api/admin/emails/templates/${templateId}/test`, {
        locale: previewLocale,
        email: settings.supportEmail || undefined,
      });
      toast(data.message || 'Email de test envoyé', { type: 'success' });
    } catch (err) {
      logger.error('Test email failed', err);
      toast(
        err.response?.data?.message || 'Échec de l’envoi (vérifiez SMTP)',
        { type: 'error' }
      );
    } finally {
      setTestSendingId(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/settings');
        setSettings((prev) => ({ ...prev, ...data }));
      } catch (err) {
        logger.error('Failed to fetch settings', err);
        toast('Impossible de charger les paramètres', { type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const saveSetting = useCallback(
    async (key, value, description) => {
      setSavingKey(key);
      const previous = settings[key];
      setSettings((prev) => ({ ...prev, [key]: value }));
      try {
        await api.put(`/api/settings/${key}`, { value, description });
        toast('Paramètre sauvegardé', { type: 'success' });
      } catch (err) {
        logger.error('Save setting failed', err);
        setSettings((prev) => ({ ...prev, [key]: previous }));
        toast(err.response?.data?.message || 'Échec de la sauvegarde', { type: 'error' });
      } finally {
        setSavingKey(null);
      }
    },
    [settings, toast]
  );

  const inputClass =
    'w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white';

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded-xl w-64" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white px-6 py-8 md:px-8">
        <div className="absolute -end-12 -top-12 w-48 h-48 rounded-full bg-secondary-500/20 blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.2em] text-primary-200 mb-2">Overglow Cockpit</p>
          <h1 className="text-3xl font-heading font-bold">Paramètres plateforme</h1>
          <p className="text-primary-100/90 mt-2 max-w-2xl text-sm md:text-base">
            Une logique simple : <strong>Général</strong> = comportement site · <strong>Finances</strong> = commission &amp; retraits ·{' '}
            <strong>Paiements</strong> = Stripe/PayPal/CMI/virement · <strong>Notifications</strong> = alertes admin ·{' '}
            <strong>Emails</strong> = digests. Tout est lu/écrit depuis la base (collection Settings).
          </p>
        </div>
      </div>

      {/* Tabs: horizontal mobile, vertical desktop */}
      <div className="flex flex-col md:flex-row gap-6">
        <nav className="md:w-56 shrink-0">
          <div className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {TABS.map(({ id, label, icon }) => {
              const Icon = icon;
              return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                  tab === id
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-400'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-4 min-w-0">
          {tab === 'general' && (
            <>
              <h2 className="text-lg font-heading font-bold text-gray-900 mb-2">Général</h2>
              <p className="text-xs text-slate-500 mb-3">Contrôle le comportement public du site (approbations, langue, devise, maintenance).</p>
              <ToggleRow
                title="Auto-approbation des produits"
                help="Publie automatiquement les produits des opérateurs déjà validés."
                checked={Boolean(settings.autoApproveProducts)}
                saving={savingKey === 'autoApproveProducts'}
                onChange={(v) => saveSetting('autoApproveProducts', v, 'Auto-approve products')}
              />
              <ToggleRow
                title="Auto-approbation des avis"
                help="Publie automatiquement les avis clients sans modération manuelle."
                checked={Boolean(settings.autoApproveReviews)}
                saving={savingKey === 'autoApproveReviews'}
                onChange={(v) => saveSetting('autoApproveReviews', v, 'Auto-approve reviews')}
              />
              <ToggleRow
                title="Mode maintenance"
                help="Affiche une page de maintenance aux visiteurs (admins exclus)."
                checked={Boolean(settings.maintenanceMode)}
                saving={savingKey === 'maintenanceMode'}
                onChange={(v) => saveSetting('maintenanceMode', v, 'Maintenance mode')}
              />
              <FieldRow
                title="Langue par défaut"
                help="Langue initiale du site pour les nouveaux visiteurs."
              >
                <select
                  className={inputClass}
                  value={settings.defaultLanguage || 'fr'}
                  disabled={savingKey === 'defaultLanguage'}
                  onChange={(e) =>
                    saveSetting('defaultLanguage', e.target.value, 'Default site language')
                  }
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="es">Español</option>
                </select>
              </FieldRow>
              <FieldRow
                title="Devise par défaut"
                help="Devise affichée par défaut sur le catalogue et le checkout."
              >
                <select
                  className={inputClass}
                  value={settings.defaultCurrency || 'MAD'}
                  disabled={savingKey === 'defaultCurrency'}
                  onChange={(e) =>
                    saveSetting('defaultCurrency', e.target.value, 'Default currency')
                  }
                >
                  <option value="MAD">MAD</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </FieldRow>
            </>
          )}

          {tab === 'finance' && (
            <>
              <h2 className="text-lg font-heading font-bold text-gray-900 mb-2">Finances</h2>
              <FieldRow
                title="Commission plateforme (%)"
                help="Pourcentage prélevé sur chaque réservation confirmée (5–25 %)."
              >
                <input
                  type="number"
                  min={5}
                  max={25}
                  className={inputClass}
                  value={settings.platformCommissionPercent ?? 15}
                  disabled={savingKey === 'platformCommissionPercent'}
                  onBlur={(e) => {
                    let v = Number(e.target.value);
                    if (!Number.isFinite(v)) v = 15;
                    v = Math.min(25, Math.max(5, v));
                    saveSetting('platformCommissionPercent', v, 'Platform commission %');
                  }}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      platformCommissionPercent: e.target.value,
                    }))
                  }
                />
              </FieldRow>
              <FieldRow
                title="Délai minimum de retrait (jours)"
                help="Nombre de jours avant qu’un opérateur puisse demander un retrait (1–30)."
              >
                <input
                  type="number"
                  min={1}
                  max={30}
                  className={inputClass}
                  value={settings.minWithdrawalDays ?? 7}
                  disabled={savingKey === 'minWithdrawalDays'}
                  onBlur={(e) => {
                    let v = Number(e.target.value);
                    if (!Number.isFinite(v)) v = 7;
                    v = Math.min(30, Math.max(1, v));
                    saveSetting('minWithdrawalDays', v, 'Min withdrawal delay days');
                  }}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, minWithdrawalDays: e.target.value }))
                  }
                />
              </FieldRow>
              <FieldRow
                title="Frais de transfert (MAD)"
                help="Frais fixes déduits lors d’un virement de retrait."
              >
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={settings.transferFeeMad ?? 0}
                  disabled={savingKey === 'transferFeeMad'}
                  onBlur={(e) => {
                    const v = Math.max(0, Number(e.target.value) || 0);
                    saveSetting('transferFeeMad', v, 'Transfer fee MAD');
                  }}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, transferFeeMad: e.target.value }))
                  }
                />
              </FieldRow>
              <FieldRow
                title="Seuil minimum de retrait (MAD)"
                help="Montant minimum pour soumettre une demande de retrait."
              >
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={settings.minWithdrawalAmountMad ?? 100}
                  disabled={savingKey === 'minWithdrawalAmountMad'}
                  onBlur={(e) => {
                    const v = Math.max(0, Number(e.target.value) || 0);
                    saveSetting('minWithdrawalAmountMad', v, 'Min withdrawal amount MAD');
                  }}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      minWithdrawalAmountMad: e.target.value,
                    }))
                  }
                />
              </FieldRow>
            </>
          )}

          {tab === 'payments' && (
            <>
              <h2 className="text-lg font-heading font-bold text-gray-900 mb-2">Paiements</h2>
              <div className="grid gap-4">
                <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Stripe</h3>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        settings.stripeEnabled
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {settings.stripeEnabled ? 'Actif' : 'Inactif'}
                      {settings.stripeEnabled && (settings.stripeTestMode ? ' · Test' : ' · Live')}
                    </span>
                  </div>
                  <ToggleRow
                    title="Activer Stripe"
                    help="Accepte les paiements par carte via Stripe."
                    checked={Boolean(settings.stripeEnabled)}
                    saving={savingKey === 'stripeEnabled'}
                    onChange={(v) => saveSetting('stripeEnabled', v, 'Stripe enabled')}
                  />
                  <ToggleRow
                    title="Mode test Stripe"
                    help="Utilise les clés de test (aucun débit réel)."
                    checked={Boolean(settings.stripeTestMode)}
                    saving={savingKey === 'stripeTestMode'}
                    onChange={(v) => saveSetting('stripeTestMode', v, 'Stripe test mode')}
                  />
                </div>

                <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">PayPal</h3>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        settings.paypalEnabled
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {settings.paypalEnabled ? 'Actif' : 'Inactif'}
                      {settings.paypalEnabled && (settings.paypalTestMode ? ' · Test' : ' · Live')}
                    </span>
                  </div>
                  <ToggleRow
                    title="Activer PayPal"
                    help="Propose PayPal au checkout."
                    checked={Boolean(settings.paypalEnabled)}
                    saving={savingKey === 'paypalEnabled'}
                    onChange={(v) => saveSetting('paypalEnabled', v, 'PayPal enabled')}
                  />
                  <ToggleRow
                    title="Mode test PayPal"
                    help="Sandbox PayPal uniquement."
                    checked={Boolean(settings.paypalTestMode)}
                    saving={savingKey === 'paypalTestMode'}
                    onChange={(v) => saveSetting('paypalTestMode', v, 'PayPal test mode')}
                  />
                </div>

                <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">CMI</h3>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        settings.cmiEnabled
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {settings.cmiEnabled ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <ToggleRow
                    title="Activer CMI"
                    help="Passerelle bancaire marocaine CMI."
                    checked={Boolean(settings.cmiEnabled)}
                    saving={savingKey === 'cmiEnabled'}
                    onChange={(v) => saveSetting('cmiEnabled', v, 'CMI enabled')}
                  />
                </div>

                <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Virement bancaire</h3>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        settings.bankTransferEnabled
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {settings.bankTransferEnabled ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <ToggleRow
                    title="Activer le virement"
                    help="Permet le paiement hors-ligne par virement."
                    checked={Boolean(settings.bankTransferEnabled)}
                    saving={savingKey === 'bankTransferEnabled'}
                    onChange={(v) => saveSetting('bankTransferEnabled', v, 'Bank transfer enabled')}
                  />
                  <ToggleRow
                    title="Afficher l’IBAN"
                    help="Montre l’IBAN aux clients lors du checkout bancaire."
                    checked={Boolean(settings.showIban)}
                    saving={savingKey === 'showIban'}
                    onChange={(v) => saveSetting('showIban', v, 'Show IBAN')}
                  />
                  <FieldRow
                    title="Titulaire du compte"
                    help="Nom affiché aux clients pour le virement."
                  >
                    <input
                      type="text"
                      className={inputClass}
                      value={settings.bankAccountName || ''}
                      disabled={savingKey === 'bankAccountName'}
                      onBlur={(e) =>
                        saveSetting(
                          'bankAccountName',
                          e.target.value.trim(),
                          'Bank account name'
                        )
                      }
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, bankAccountName: e.target.value }))
                      }
                    />
                  </FieldRow>
                  <FieldRow title="Banque" help="Nom de l’établissement bancaire.">
                    <input
                      type="text"
                      className={inputClass}
                      value={settings.bankName || ''}
                      disabled={savingKey === 'bankName'}
                      onBlur={(e) =>
                        saveSetting('bankName', e.target.value.trim(), 'Bank name')
                      }
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, bankName: e.target.value }))
                      }
                    />
                  </FieldRow>
                  <FieldRow
                    title="IBAN"
                    help="Exemple soft-launch fourni — remplacez par l’IBAN Overglow réel avant go-live."
                  >
                    <input
                      type="text"
                      className={`${inputClass} font-mono`}
                      value={settings.bankIban || ''}
                      disabled={savingKey === 'bankIban'}
                      autoComplete="off"
                      onBlur={(e) =>
                        saveSetting(
                          'bankIban',
                          e.target.value.replace(/\s+/g, '').toUpperCase(),
                          'Bank IBAN'
                        )
                      }
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, bankIban: e.target.value }))
                      }
                    />
                  </FieldRow>
                  <FieldRow title="SWIFT / BIC" help="Code SWIFT du compte de réception.">
                    <input
                      type="text"
                      className={`${inputClass} font-mono`}
                      value={settings.bankSwift || ''}
                      disabled={savingKey === 'bankSwift'}
                      autoComplete="off"
                      onBlur={(e) =>
                        saveSetting(
                          'bankSwift',
                          e.target.value.replace(/\s+/g, '').toUpperCase(),
                          'Bank SWIFT'
                        )
                      }
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, bankSwift: e.target.value }))
                      }
                    />
                  </FieldRow>
                </div>
              </div>
            </>
          )}

          {tab === 'notifications' && (
            <>
              <h2 className="text-lg font-heading font-bold text-gray-900 mb-2">Notifications</h2>
              <FieldRow
                title="Email de support"
                help="Adresse utilisée pour les réponses et alertes admin."
              >
                <input
                  type="email"
                  className={inputClass}
                  value={settings.supportEmail || ''}
                  disabled={savingKey === 'supportEmail'}
                  onBlur={(e) =>
                    saveSetting('supportEmail', e.target.value.trim(), 'Support email')
                  }
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, supportEmail: e.target.value }))
                  }
                />
              </FieldRow>
              <ToggleRow
                title="Nouvel utilisateur"
                help="Alerte admin à chaque inscription."
                checked={Boolean(settings.notifyNewUser)}
                saving={savingKey === 'notifyNewUser'}
                onChange={(v) => saveSetting('notifyNewUser', v, 'Notify new user')}
              />
              <ToggleRow
                title="Nouvelle réservation"
                help="Alerte à chaque réservation créée."
                checked={Boolean(settings.notifyNewBooking)}
                saving={savingKey === 'notifyNewBooking'}
                onChange={(v) => saveSetting('notifyNewBooking', v, 'Notify new booking')}
              />
              <ToggleRow
                title="Paiement reçu"
                help="Alerte lorsqu’un paiement est confirmé."
                checked={Boolean(settings.notifyPaymentReceived)}
                saving={savingKey === 'notifyPaymentReceived'}
                onChange={(v) =>
                  saveSetting('notifyPaymentReceived', v, 'Notify payment received')
                }
              />
              <ToggleRow
                title="Retrait demandé"
                help="Alerte lorsqu’un opérateur demande un retrait."
                checked={Boolean(settings.notifyWithdrawalRequested)}
                saving={savingKey === 'notifyWithdrawalRequested'}
                onChange={(v) =>
                  saveSetting('notifyWithdrawalRequested', v, 'Notify withdrawal requested')
                }
              />
              <FieldRow
                title="Emails récapitulatifs"
                help="Fréquence des digests envoyés à l’équipe."
              >
                <select
                  className={inputClass}
                  value={settings.digestEmailFrequency || 'weekly'}
                  disabled={savingKey === 'digestEmailFrequency'}
                  onChange={(e) =>
                    saveSetting('digestEmailFrequency', e.target.value, 'Digest email frequency')
                  }
                >
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="none">Aucun</option>
                </select>
              </FieldRow>
            </>
          )}

          {tab === 'emails' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                <div>
                  <h2 className="text-lg font-heading font-bold text-gray-900">Templates email</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Prévisualisez et envoyez un test (destinataire = email support ou compte admin).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-600" htmlFor="email-locale">
                    Langue
                  </label>
                  <select
                    id="email-locale"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    value={previewLocale}
                    onChange={(e) => setPreviewLocale(e.target.value)}
                  >
                    <option value="fr">FR</option>
                    <option value="en">EN</option>
                  </select>
                </div>
              </div>

              {emailsLoading ? (
                <div className="flex items-center gap-2 text-gray-500 py-8 justify-center">
                  <Loader2 className="animate-spin" size={18} />
                  Chargement…
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {emailTemplates.map((tpl) => (
                    <li
                      key={tpl.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50/80 hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{tpl.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{tpl.description}</p>
                        <p className="text-[11px] text-gray-400 mt-1 font-mono">{tpl.id}.hbs</p>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={previewLoading}
                          onClick={() => openEmailPreview(tpl.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-200 text-gray-800 hover:border-primary-400 disabled:opacity-50"
                        >
                          <Eye size={14} />
                          Prévisualiser
                        </button>
                        <button
                          type="button"
                          disabled={testSendingId === tpl.id}
                          onClick={() => sendTestEmail(tpl.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                        >
                          {testSendingId === tpl.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                          Envoyer un test
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {preview && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="email-preview-title"
                >
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                    <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-200">
                      <div className="min-w-0">
                        <h3 id="email-preview-title" className="font-heading font-bold text-gray-900 truncate">
                          {preview.subject}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {preview.id} · {String(preview.locale).toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                          value={preview.locale}
                          onChange={(e) => openEmailPreview(preview.id, e.target.value)}
                        >
                          <option value="fr">FR</option>
                          <option value="en">EN</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setPreview(null)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                          aria-label="Fermer"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 bg-gray-100 p-3">
                      {previewLoading ? (
                        <div className="flex items-center justify-center h-64 text-gray-500 gap-2">
                          <Loader2 className="animate-spin" size={20} />
                          Rendu…
                        </div>
                      ) : (
                        <iframe
                          title={`Preview ${preview.id}`}
                          srcDoc={preview.html}
                          className="w-full h-[60vh] bg-white rounded-lg border border-gray-200"
                          sandbox=""
                        />
                      )}
                    </div>
                    <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={testSendingId === preview.id}
                        onClick={() => sendTestEmail(preview.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        {testSendingId === preview.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                        Envoyer un test
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreview(null)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default AdminSettingsPage;
