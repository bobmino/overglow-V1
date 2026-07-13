import React, { useCallback, useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Banknote,
  CreditCard,
  Bell,
  Loader2,
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
  stripeEnabled: true,
  stripeTestMode: true,
  paypalEnabled: true,
  paypalTestMode: true,
  cmiEnabled: false,
  bankTransferEnabled: true,
  showIban: true,
  supportEmail: '',
  notifyNewUser: true,
  notifyNewBooking: true,
  notifyPaymentReceived: true,
  notifyWithdrawalRequested: true,
  digestEmailFrequency: 'weekly',
};

const ToggleRow = ({ title, help, checked, saving, onChange }) => (
  <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
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
  const [tab, setTab] = useState('general');
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

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
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">Centre de configuration de la plateforme</p>
      </div>

      {/* Tabs: horizontal mobile, vertical desktop */}
      <div className="flex flex-col md:flex-row gap-6">
        <nav className="md:w-52 shrink-0">
          <div className="flex md:flex-col gap-1 overflow-x-auto pb-1 md:pb-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                  tab === id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-400'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-5 md:p-6 space-y-4 min-w-0">
          {tab === 'general' && (
            <>
              <h2 className="text-lg font-heading font-bold text-gray-900 mb-2">Général</h2>
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
                          ? 'bg-green-100 text-green-800'
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
                          ? 'bg-green-100 text-green-800'
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
                          ? 'bg-green-100 text-green-800'
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
                          ? 'bg-green-100 text-green-800'
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
        </div>
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default AdminSettingsPage;
