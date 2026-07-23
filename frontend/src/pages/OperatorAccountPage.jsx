import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Building2, Phone, Landmark, ClipboardList, Save } from 'lucide-react';
import api from '../config/axios';
import { useToast } from '../context/ToastContext';
import { logger } from '../utils/logger.js';

const TABS = [
  { id: 'personal', icon: User, labelKey: 'operator.account.tab_personal', fallback: 'Perso' },
  { id: 'company', icon: Building2, labelKey: 'operator.account.tab_company', fallback: 'Société / activité' },
  { id: 'contact', icon: Phone, labelKey: 'operator.account.tab_contact', fallback: 'Contact' },
  { id: 'banking', icon: Landmark, labelKey: 'operator.account.tab_banking', fallback: 'Bancaire' },
];

const emptyAccount = {
  user: { name: '', email: '', phone: '', bio: '', location: '', website: '' },
  providerType: null,
  publicName: '',
  description: '',
  location: { city: '', address: '', postalCode: '', country: 'Maroc' },
  companyAddress: { street: '', city: '', postalCode: '', country: 'Maroc' },
  companyInfo: {},
  individualWithStatusInfo: {},
  individualWithoutStatusInfo: {},
  phone: '',
  contactEmail: '',
  website: '',
  socialLinks: { instagram: '', facebook: '', whatsapp: '' },
  banking: { accountHolder: '', bankName: '', iban: '', rib: '', paypalEmail: '' },
};

const OperatorAccountPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [tab, setTab] = useState('personal');
  const [data, setData] = useState(emptyAccount);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data: account } = await api.get('/api/operator/account');
      setData({
        ...emptyAccount,
        ...account,
        user: { ...emptyAccount.user, ...(account.user || {}) },
        location: { ...emptyAccount.location, ...(account.location || {}) },
        companyAddress: { ...emptyAccount.companyAddress, ...(account.companyAddress || {}) },
        socialLinks: { ...emptyAccount.socialLinks, ...(account.socialLinks || {}) },
        banking: { ...emptyAccount.banking, ...(account.banking || {}) },
        companyInfo: account.companyInfo || {},
        individualWithStatusInfo: account.individualWithStatusInfo || {},
        individualWithoutStatusInfo: account.individualWithoutStatusInfo || {},
      });
    } catch (err) {
      logger.error(err);
      toast.error(err.response?.data?.message || t('operator.account.load_error', 'Impossible de charger le profil'));
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const isCompany = data.providerType === 'company';
  const isPhysical =
    data.providerType === 'individual_with_status' ||
    data.providerType === 'individual_without_status';

  const save = async () => {
    setSaving(true);
    try {
      let payload = { section: tab };
      if (tab === 'personal') {
        payload = {
          section: 'personal',
          name: data.user.name,
          phone: data.user.phone,
          bio: data.user.bio,
          location: data.user.location,
          website: data.user.website,
        };
      } else if (tab === 'company') {
        payload = {
          section: 'company',
          publicName: data.publicName,
          description: data.description,
          location: data.location,
          companyAddress: data.companyAddress,
          companyInfo: data.companyInfo,
          individualWithStatusInfo: data.individualWithStatusInfo,
          individualWithoutStatusInfo: data.individualWithoutStatusInfo,
        };
      } else if (tab === 'contact') {
        payload = {
          section: 'contact',
          phone: data.phone,
          contactEmail: data.contactEmail,
          website: data.website,
          socialLinks: data.socialLinks,
        };
      } else if (tab === 'banking') {
        payload = { section: 'banking', banking: data.banking };
      }
      await api.put('/api/operator/account', payload);
      toast.success(t('operator.account.save_success', 'Section enregistrée'));
    } catch (err) {
      logger.error(err);
      toast.error(err.response?.data?.message || t('operator.account.save_error', 'Échec de l’enregistrement'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse h-40 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">
            {t('operator.account.title', 'Mon compte partenaire')}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {t(
              'operator.account.subtitle',
              'Infos personnelles, activité, contact et RIB — modifiables par section.'
            )}
          </p>
        </div>
        <Link
          to="/operator/wizard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:underline"
        >
          <ClipboardList size={16} />
          {t('operator.account.link_fiche', 'Voir ma fiche onboarding')}
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(({ id, icon: Icon, labelKey, fallback }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              tab === id
                ? 'bg-primary-700 text-white border-primary-700'
                : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
            }`}
          >
            <Icon size={16} />
            {t(labelKey, fallback)}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
        {tab === 'personal' && (
          <>
            <p className="text-xs text-gray-500">
              {t(
                'operator.account.personal_hint',
                'Compte du responsable (personne physique = mêmes infos pour l’activité).'
              )}
            </p>
            <label className="block text-sm font-bold text-gray-700">
              {t('operator.account.name', 'Nom')}
              <input
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                value={data.user.name}
                onChange={(e) => setData((d) => ({ ...d, user: { ...d.user, name: e.target.value } }))}
              />
            </label>
            <label className="block text-sm font-bold text-gray-700">
              Email
              <input className="mt-1 w-full px-3 py-2 border rounded-lg bg-gray-50" value={data.user.email} disabled />
            </label>
            <label className="block text-sm font-bold text-gray-700">
              {t('operator.account.phone', 'Téléphone')}
              <input
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                value={data.user.phone}
                onChange={(e) => setData((d) => ({ ...d, user: { ...d.user, phone: e.target.value } }))}
              />
            </label>
            <label className="block text-sm font-bold text-gray-700">
              Bio
              <textarea
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                rows={3}
                value={data.user.bio}
                onChange={(e) => setData((d) => ({ ...d, user: { ...d.user, bio: e.target.value } }))}
              />
            </label>
          </>
        )}

        {tab === 'company' && (
          <>
            <p className="text-xs text-gray-500">
              {isPhysical
                ? t('operator.account.company_physical_hint', 'Personne physique : nom public et adresse d’activité.')
                : t('operator.account.company_hint', 'Informations visibles sur le catalogue et légales.')}
            </p>
            <label className="block text-sm font-bold text-gray-700">
              {t('operator.account.public_name', 'Nom public')}
              <input
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                value={data.publicName}
                onChange={(e) => setData((d) => ({ ...d, publicName: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-bold text-gray-700">
              Description
              <textarea
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                rows={4}
                value={data.description}
                onChange={(e) => setData((d) => ({ ...d, description: e.target.value }))}
              />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm font-bold text-gray-700">
                Ville
                <input
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                  value={data.location.city || ''}
                  onChange={(e) =>
                    setData((d) => ({ ...d, location: { ...d.location, city: e.target.value } }))
                  }
                />
              </label>
              <label className="block text-sm font-bold text-gray-700">
                Adresse
                <input
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                  value={data.location.address || ''}
                  onChange={(e) =>
                    setData((d) => ({ ...d, location: { ...d.location, address: e.target.value } }))
                  }
                />
              </label>
            </div>
            {isCompany && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <label className="block text-sm font-bold text-gray-700">
                  Raison sociale
                  <input
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    value={data.companyInfo.companyName || ''}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        companyInfo: { ...d.companyInfo, companyName: e.target.value },
                      }))
                    }
                  />
                </label>
                <label className="block text-sm font-bold text-gray-700">
                  ICE / RC
                  <input
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    value={data.companyInfo.registrationNumber || ''}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        companyInfo: { ...d.companyInfo, registrationNumber: e.target.value },
                      }))
                    }
                  />
                </label>
              </div>
            )}
          </>
        )}

        {tab === 'contact' && (
          <>
            <label className="block text-sm font-bold text-gray-700">
              Téléphone public
              <input
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                value={data.phone}
                onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-bold text-gray-700">
              Email pro
              <input
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                value={data.contactEmail}
                onChange={(e) => setData((d) => ({ ...d, contactEmail: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-bold text-gray-700">
              Site web
              <input
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                value={data.website}
                onChange={(e) => setData((d) => ({ ...d, website: e.target.value }))}
              />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['instagram', 'facebook', 'whatsapp'].map((key) => (
                <label key={key} className="block text-sm font-bold text-gray-700 capitalize">
                  {key}
                  <input
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    value={data.socialLinks[key] || ''}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        socialLinks: { ...d.socialLinks, [key]: e.target.value },
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </>
        )}

        {tab === 'banking' && (
          <>
            <p className="text-xs text-gray-500">
              {t(
                'operator.account.banking_hint',
                'Utilisé pour préremplir vos demandes de retrait. Données privées.'
              )}
            </p>
            <label className="block text-sm font-bold text-gray-700">
              Titulaire
              <input
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                value={data.banking.accountHolder || ''}
                onChange={(e) =>
                  setData((d) => ({ ...d, banking: { ...d.banking, accountHolder: e.target.value } }))
                }
              />
            </label>
            <label className="block text-sm font-bold text-gray-700">
              Banque
              <input
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                value={data.banking.bankName || ''}
                onChange={(e) =>
                  setData((d) => ({ ...d, banking: { ...d.banking, bankName: e.target.value } }))
                }
              />
            </label>
            <label className="block text-sm font-bold text-gray-700">
              IBAN
              <input
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                value={data.banking.iban || ''}
                onChange={(e) =>
                  setData((d) => ({ ...d, banking: { ...d.banking, iban: e.target.value } }))
                }
              />
            </label>
            <label className="block text-sm font-bold text-gray-700">
              RIB
              <input
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                value={data.banking.rib || ''}
                onChange={(e) =>
                  setData((d) => ({ ...d, banking: { ...d.banking, rib: e.target.value } }))
                }
              />
            </label>
            <label className="block text-sm font-bold text-gray-700">
              PayPal (optionnel)
              <input
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                value={data.banking.paypalEmail || ''}
                onChange={(e) =>
                  setData((d) => ({ ...d, banking: { ...d.banking, paypalEmail: e.target.value } }))
                }
              />
            </label>
          </>
        )}

        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 btn-primary disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? t('operator.common.saving', 'Enregistrement…') : t('operator.common.save', 'Enregistrer')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperatorAccountPage;
