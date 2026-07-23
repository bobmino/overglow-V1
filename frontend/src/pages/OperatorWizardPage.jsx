import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { CheckCircle, Circle, ChevronRight, ChevronLeft, Upload, MapPin, Building2, User, FileText, Camera, Home, AlertCircle, Pencil, Save } from 'lucide-react';
import { logger } from '../utils/logger.js';
import { useToast } from '../context/ToastContext';
import TaxonomyMultiSelect from '../components/TaxonomyMultiSelect';
import LanguagesMultiSelect from '../components/LanguagesMultiSelect';

/** Étapes stables (hors render) — évite remount / perte de focus des inputs */
const WIZARD_STEPS = [
  {
    id: 'identity',
    labelKey: 'operator.wizard.steps.identity',
    labelFallback: 'Identité',
    icon: Building2,
    backendIds: ['providerType', 'publicInfo'],
  },
  {
    id: 'presence',
    labelKey: 'operator.wizard.steps.presence',
    labelFallback: 'Présence',
    icon: Camera,
    backendIds: ['photos', 'address', 'experiences'],
  },
  {
    id: 'legal',
    labelKey: 'operator.wizard.steps.legal',
    labelFallback: 'Légal',
    icon: Home,
    backendIds: ['privateInfo'],
  },
];

const BACKEND_STEP_IDS = WIZARD_STEPS.flatMap((step) => step.backendIds);

const OperatorWizardPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  /** view | edit | onboarding — view/edit seulement si fiche déjà validée */
  const [mode, setMode] = useState('onboarding');

  // Form data
  const [formData, setFormData] = useState({
    providerType: null,
    publicName: '',
    description: '',
    location: { city: '', address: '', postalCode: '', country: 'Maroc' },
    logo: '',
    gallery: [],
    companyAddress: { street: '', city: '', postalCode: '', country: 'Maroc' },
    experiences: '',
    specialties: [],
    languages: [],
    companyInfo: {},
    individualWithStatusInfo: {},
    individualWithoutStatusInfo: {},
  });

  const setField = useCallback((key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setNestedField = useCallback((parent, key, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...(prev[parent] || {}), [key]: value },
    }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchWizardData = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get('/api/operator/wizard/data');
        if (cancelled) return;
        setWizardData(data);

        if (data) {
          setFormData({
            providerType: data.providerType,
            publicName: data.publicName || '',
            description: data.description || '',
            location: data.location || { city: '', address: '', postalCode: '', country: 'Maroc' },
            logo: data.photos?.logo || '',
            gallery: data.photos?.gallery || [],
            companyAddress: data.companyAddress || { street: '', city: '', postalCode: '', country: 'Maroc' },
            experiences: data.experiences || '',
            specialties: Array.isArray(data.specialties)
              ? data.specialties.map((id) => String(id?._id || id))
              : [],
            languages: Array.isArray(data.languages) ? data.languages.map(String) : [],
            companyInfo: data.companyInfo || {},
            individualWithStatusInfo: data.individualWithStatusInfo || {},
            individualWithoutStatusInfo: data.individualWithoutStatusInfo || {},
          });

          if (data.isFormCompleted) {
            setMode('view');
            setCurrentStep(0);
          } else {
            setMode('onboarding');
            const completedSteps = data.completedSteps || [];
            const firstIncomplete = WIZARD_STEPS.findIndex(
              (step) => !step.backendIds.every((id) => completedSteps.includes(id))
            );
            if (firstIncomplete !== -1) {
              setCurrentStep(firstIncomplete);
            } else if (completedSteps.length > 0) {
              setCurrentStep(WIZARD_STEPS.length - 1);
            }
          }
        }
      } catch (fetchError) {
        if (cancelled) return;
        logger.error('Failed to fetch wizard data:', fetchError);
        const msg =
          fetchError.response?.data?.message ||
          t('operator.wizard.load_error', 'Impossible de charger l’onboarding. Réessayez.');
        setError(msg);
        toast.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchWizardData();
    return () => {
      cancelled = true;
    };
    // Charge une seule fois — ne pas dépendre de t/STEPS (sinon reset form à chaque frappe / i18n)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveBackendStep = async (stepId) => {
    let response;
    switch (stepId) {
        case 'providerType':
          response = await api.put('/api/operator/wizard/provider-type', {
            providerType: formData.providerType,
          });
          break;
        case 'publicInfo':
          response = await api.put('/api/operator/wizard/public-info', {
            publicName: formData.publicName,
            description: formData.description,
            location: formData.location,
          });
          break;
        case 'photos':
          response = await api.put('/api/operator/wizard/photos', {
            logo: formData.logo,
            gallery: formData.gallery,
          });
          break;
        case 'address':
          response = await api.put('/api/operator/wizard/address', {
            companyAddress: formData.companyAddress,
          });
          break;
        case 'experiences':
          response = await api.put('/api/operator/wizard/experiences', {
            experiences: formData.experiences,
            specialties: formData.specialties || [],
            languages: formData.languages || [],
          });
          break;
        case 'privateInfo':
          response = await api.put('/api/operator/wizard/private-info', {
            companyInfo: formData.companyInfo,
            individualWithStatusInfo: formData.individualWithStatusInfo,
            individualWithoutStatusInfo: formData.individualWithoutStatusInfo,
          });
          break;
      default:
        break;
    }
    if (response?.data?.operator) {
      setWizardData(response.data.operator);
    }
  };

  const formatWizardError = (err) => {
    const validation = err.response?.data?.errors;
    if (Array.isArray(validation) && validation.length > 0) {
      return validation.map((e) => e.msg || e.message).filter(Boolean).join(' · ');
    }
    return err.response?.data?.message || t('operator.wizard.save_step_error');
  };

  const handleNext = async () => {
    setError('');
    setSaving(true);
    try {
      const backendIds = WIZARD_STEPS[currentStep].backendIds || [];
      for (const stepId of backendIds) {
        await saveBackendStep(stepId);
      }
      if (currentStep < WIZARD_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (err) {
      setError(formatWizardError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSaving(true);

    try {
      const backendIds = WIZARD_STEPS[currentStep].backendIds || [];
      for (const stepId of backendIds) {
        await saveBackendStep(stepId);
      }
      await api.post('/api/operator/wizard/submit');
      toast.success(t('operator.wizard.submit_success'));
      navigate('/operator/dashboard');
    } catch (err) {
      setError(formatWizardError(err) || t('operator.wizard.submit_error'));
    } finally {
      setSaving(false);
    }
  };

  /** Enregistre toutes les étapes sans re-soumettre (fiche déjà validée) */
  const handleSaveAll = async () => {
    setError('');
    setSaving(true);
    try {
      for (const stepId of BACKEND_STEP_IDS) {
        await saveBackendStep(stepId);
      }
      toast.success(t('operator.wizard.save_success', 'Fiche enregistrée'));
      setMode('view');
    } catch (err) {
      setError(formatWizardError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setError('');
    setMode('view');
    // Recharger les données serveur pour annuler les edits non sauvés
    api.get('/api/operator/wizard/data').then(({ data }) => {
      if (!data) return;
      setWizardData(data);
      setFormData({
        providerType: data.providerType,
        publicName: data.publicName || '',
        description: data.description || '',
        location: data.location || { city: '', address: '', postalCode: '', country: 'Maroc' },
        logo: data.photos?.logo || '',
        gallery: data.photos?.gallery || [],
        companyAddress: data.companyAddress || { street: '', city: '', postalCode: '', country: 'Maroc' },
        experiences: data.experiences || '',
        specialties: Array.isArray(data.specialties)
          ? data.specialties.map((id) => String(id?._id || id))
          : [],
        languages: Array.isArray(data.languages) ? data.languages.map(String) : [],
        companyInfo: data.companyInfo || {},
        individualWithStatusInfo: data.individualWithStatusInfo || {},
        individualWithoutStatusInfo: data.individualWithoutStatusInfo || {},
      });
    }).catch(() => {});
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getProgress = () => {
    if (!wizardData) return 0;
    if (wizardData.isFormCompleted) return 100;
    const completed = new Set(wizardData.completedSteps || []);
    const done = BACKEND_STEP_IDS.filter((id) => completed.has(id)).length;
    const total = BACKEND_STEP_IDS.length || 1;
    return Math.min(100, Math.round((done / total) * 100));
  };

  const getStatusBanner = () => {
    const status = wizardData?.status || 'Pending';
    const map = {
      Active: {
        label: t('operator.wizard.status_active', 'Compte actif'),
        className: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      },
      'Under Review': {
        label: t('operator.wizard.status_under_review', 'En cours de validation'),
        className: 'bg-amber-50 border-amber-200 text-amber-800',
      },
      Pending: {
        label: t('operator.wizard.status_pending', 'En attente'),
        className: 'bg-slate-50 border-slate-200 text-slate-700',
      },
      Rejected: {
        label: t('operator.wizard.status_rejected', 'Refusé'),
        className: 'bg-red-50 border-red-200 text-red-800',
      },
    };
    return map[status] || map.Pending;
  };

  const isReadOnly = mode === 'view';
  const isFormCompleted = Boolean(wizardData?.isFormCompleted);

  const isStepCompleted = (step) => {
    if (!wizardData) return false;
    if (wizardData.isFormCompleted) return true;
    return step.backendIds.every((id) => wizardData.completedSteps?.includes(id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  if (!wizardData && error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-red-100 rounded-2xl p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={40} />
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            {t('operator.wizard.load_title', 'Chargement impossible')}
          </h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-3 rounded-xl bg-primary-700 text-white font-semibold hover:bg-primary-800"
          >
            {t('common.retry', 'Réessayer')}
          </button>
        </div>
      </div>
    );
  }

  const renderBackendPanel = (stepId) => {
    switch (stepId) {
      case 'providerType':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('operator.wizard.provider_type_title')}</h2>
            <p className="text-gray-600">{t('operator.wizard.provider_type_subtitle')}</p>
            
            <div className="space-y-4">
              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary-600 transition">
                <input
                  type="radio"
                  name="providerType"
                  value="company"
                  checked={formData.providerType === 'company'}
                  onChange={(e) => setField('providerType', e.target.value)}
                  className="mt-1 me-4"
                />
                <div>
                  <div className="font-semibold text-gray-900">{t('operator.wizard.company_title')}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {t('operator.wizard.company_desc')}
                    <br />
                    <span className="text-xs italic">{t('operator.wizard.company_example')}</span>
                  </div>
                </div>
              </label>

              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary-600 transition">
                <input
                  type="radio"
                  name="providerType"
                  value="individual_with_status"
                  checked={formData.providerType === 'individual_with_status'}
                  onChange={(e) => setField('providerType', e.target.value)}
                  className="mt-1 me-4"
                />
                <div>
                  <div className="font-semibold text-gray-900">{t('operator.wizard.individual_status_title')}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {t('operator.wizard.individual_status_desc')}
                    <br />
                    <span className="text-xs italic">{t('operator.wizard.individual_status_example')}</span>
                  </div>
                </div>
              </label>

              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary-600 transition">
                <input
                  type="radio"
                  name="providerType"
                  value="individual_without_status"
                  checked={formData.providerType === 'individual_without_status'}
                  onChange={(e) => setField('providerType', e.target.value)}
                  className="mt-1 me-4"
                />
                <div>
                  <div className="font-semibold text-gray-900">{t('operator.wizard.individual_no_status_title')}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {t('operator.wizard.individual_no_status_desc')}
                    <br />
                    <span className="text-xs italic">{t('operator.wizard.individual_no_status_example')}</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        );

      case 'publicInfo':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('operator.wizard.public_info_title')}</h2>
            <p className="text-gray-600">{t('operator.wizard.public_info_subtitle')}</p>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('operator.wizard.public_name_label')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.publicName}
                onChange={(e) => setField('publicName', e.target.value)}
                placeholder={t('operator.wizard.public_name_placeholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{t('operator.wizard.public_name_hint')}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('operator.wizard.description_label')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder={t('operator.wizard.description_placeholder')}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                required
                minLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('operator.wizard.description_count', {
                  count: formData.description.length,
                  defaultValue: `${formData.description.length} / 50 caractères minimum`,
                })}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('operator.wizard.location_label')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.location.city}
                onChange={(e) => setNestedField('location', 'city', e.target.value)}
                placeholder={t('operator.wizard.location_placeholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{t('operator.wizard.location_hint')}</p>
            </div>
          </div>
        );

      case 'photos':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('operator.wizard.photos_title')}</h2>
            <p className="text-gray-600">{t('operator.wizard.photos_subtitle')}</p>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.logo_label')}</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {formData.logo ? (
                  <img src={formData.logo} alt={t('operator.wizard.logo_alt')} className="max-h-32 mx-auto" />
                ) : (
                  <div>
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">{t('operator.wizard.upload_logo')}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.gallery_label')}</label>
              <div className="grid grid-cols-3 gap-4">
                {formData.gallery.map((photo, index) => (
                  <div key={index} className="border rounded-lg p-2">
                    <img src={photo} alt={t('operator.wizard.gallery_photo_alt', { index: index + 1 })} className="w-full h-32 object-cover rounded" />
                  </div>
                ))}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-600 transition">
                  <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-xs text-gray-600">{t('operator.wizard.add_photo')}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'address':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('operator.wizard.address_title')}</h2>
            <p className="text-gray-600">{t('operator.wizard.address_subtitle')}</p>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('operator.wizard.street_label')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.companyAddress.street}
                onChange={(e) => setNestedField('companyAddress', 'street', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('operator.wizard.city_label')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.companyAddress.city}
                  onChange={(e) => setNestedField('companyAddress', 'city', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('operator.wizard.postal_code_label')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.companyAddress.postalCode}
                  onChange={(e) => setNestedField('companyAddress', 'postalCode', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 'experiences':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('operator.wizard.experiences_title')}</h2>
            <p className="text-gray-600">{t('operator.wizard.experiences_subtitle')}</p>

            <TaxonomyMultiSelect
              value={formData.specialties}
              onChange={(ids) => setField('specialties', ids)}
              label={t('taxonomy.specialties_label', 'Types d’expériences')}
              hint={t(
                'taxonomy.specialties_hint',
                'Sélectionnez vos spécialités (circuits, activités, transport…). Recherchez pour affiner.'
              )}
              required
            />

            <LanguagesMultiSelect
              value={formData.languages}
              onChange={(codes) => setField('languages', codes)}
              label={t('taxonomy.languages_label', 'Langues parlées')}
            />
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('operator.wizard.experiences_description_label')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.experiences}
                onChange={(e) => setField('experiences', e.target.value)}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                required
              />
            </div>
          </div>
        );

      case 'privateInfo':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('operator.wizard.private_info_title')}</h2>
            <p className="text-gray-600">{t('operator.wizard.private_info_subtitle')}</p>
            
            {formData.providerType === 'company' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.company_name_label')}</label>
                  <input
                    type="text"
                    value={formData.companyInfo.companyName || ''}
                    onChange={(e) => setNestedField('companyInfo', 'companyName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.rc_number_label')}</label>
                  <input
                    type="text"
                    value={formData.companyInfo.registrationNumber || ''}
                    onChange={(e) => setNestedField('companyInfo', 'registrationNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.kbis_number_label')}</label>
                  <input
                    type="text"
                    value={formData.companyInfo.kbis || ''}
                    onChange={(e) => setNestedField('companyInfo', 'kbis', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.siret_number_label')}</label>
                  <input
                    type="text"
                    value={formData.companyInfo.siret || ''}
                    onChange={(e) => setNestedField('companyInfo', 'siret', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.vat_number_label')}</label>
                  <input
                    type="text"
                    value={formData.companyInfo.vatNumber || ''}
                    onChange={(e) => setNestedField('companyInfo', 'vatNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.legal_form_label')}</label>
                  <select
                    value={formData.companyInfo.legalForm || ''}
                    onChange={(e) => setNestedField('companyInfo', 'legalForm', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">{t('operator.common.select')}</option>
                    <option value="SARL">{t('operator.wizard.legal_form_sarl')}</option>
                    <option value="SAS">{t('operator.wizard.legal_form_sas')}</option>
                    <option value="SA">{t('operator.wizard.legal_form_sa')}</option>
                    <option value="EURL">{t('operator.wizard.legal_form_eurl')}</option>
                    <option value="SNC">{t('operator.wizard.legal_form_snc')}</option>
                    <option value="Autre">{t('operator.wizard.legal_form_other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.share_capital_label')}</label>
                  <input
                    type="number"
                    value={formData.companyInfo.capital || ''}
                    onChange={(e) => { const raw = e.target.value; setNestedField('companyInfo', 'capital', raw === '' ? '' : parseFloat(raw)); }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.headquarters_label')}</label>
                  <input
                    type="text"
                    value={formData.companyInfo.headquarters || ''}
                    onChange={(e) => setNestedField('companyInfo', 'headquarters', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {formData.providerType === 'individual_with_status' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.first_name_label')}</label>
                    <input
                      type="text"
                      value={formData.individualWithStatusInfo.firstName || ''}
                      onChange={(e) => setNestedField('individualWithStatusInfo', 'firstName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.last_name_label')}</label>
                    <input
                      type="text"
                      value={formData.individualWithStatusInfo.lastName || ''}
                      onChange={(e) => setNestedField('individualWithStatusInfo', 'lastName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.status_label')}</label>
                  <select
                    value={formData.individualWithStatusInfo.status || ''}
                    onChange={(e) => setNestedField('individualWithStatusInfo', 'status', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">{t('operator.common.select')}</option>
                    <option value="auto-entrepreneur">{t('operator.wizard.status_auto_entrepreneur')}</option>
                    <option value="micro-entreprise">{t('operator.wizard.status_micro_enterprise')}</option>
                    <option value="profession-liberale">{t('operator.wizard.status_profession_liberale')}</option>
                    <option value="autre">{t('operator.wizard.status_other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.siret_number_label')}</label>
                  <input
                    type="text"
                    value={formData.individualWithStatusInfo.siret || ''}
                    onChange={(e) => setNestedField('individualWithStatusInfo', 'siret', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.ape_code_label')}</label>
                  <input
                    type="text"
                    value={formData.individualWithStatusInfo.apeCode || ''}
                    onChange={(e) => setNestedField('individualWithStatusInfo', 'apeCode', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.tax_regime_label')}</label>
                  <input
                    type="text"
                    value={formData.individualWithStatusInfo.taxStatus || ''}
                    onChange={(e) => setNestedField('individualWithStatusInfo', 'taxStatus', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {formData.providerType === 'individual_without_status' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="wizard-first-name" className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.first_name_label')}</label>
                    <input
                      type="text"
                      id="wizard-first-name"
                      name="wizard-first-name"
                      value={formData.individualWithoutStatusInfo.firstName || ''}
                      onChange={(e) => setNestedField('individualWithoutStatusInfo', 'firstName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                      autoComplete="given-name"
                    />
                  </div>
                  <div>
                    <label htmlFor="wizard-last-name" className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.last_name_label')}</label>
                    <input
                      type="text"
                      id="wizard-last-name"
                      name="wizard-last-name"
                      value={formData.individualWithoutStatusInfo.lastName || ''}
                      onChange={(e) => setNestedField('individualWithoutStatusInfo', 'lastName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                      autoComplete="family-name"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="wizard-id-number" className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.id_number_label')}</label>
                  <input
                    type="text"
                    id="wizard-id-number"
                    name="wizard-id-number"
                    value={formData.individualWithoutStatusInfo.idNumber || ''}
                    onChange={(e) => setNestedField('individualWithoutStatusInfo', 'idNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const currentBackendIds =
    WIZARD_STEPS[currentStep]?.backendIds || [WIZARD_STEPS[currentStep]?.id];

  return (
    <div className="page-shell py-6 px-4 md:px-6">
      <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
        {/* Stepper */}
        <div className="w-full lg:w-64 surface-card p-6 h-fit">
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-500 mb-2">
              {isFormCompleted
                ? t('operator.wizard.fiche_title', 'Ma fiche partenaire')
                : t('operator.wizard.progress', { percent: getProgress() })}
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300 max-w-full"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>

          <nav className="space-y-1">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = isStepCompleted(step);
              const isCurrent = index === currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                    isCurrent
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : isCompleted
                      ? 'text-gray-700 hover:bg-gray-50'
                      : 'text-gray-400'
                  }`}
                  onClick={() => {
                    if (isFormCompleted || isCompleted || isCurrent) {
                      setCurrentStep(index);
                    }
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle size={20} className="text-primary-600" />
                  ) : (
                    <Circle size={20} />
                  )}
                  <Icon size={18} />
                  <span className="text-sm">{t(step.labelKey, step.labelFallback)}</span>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex-1">
          <div className="max-w-3xl mx-auto">
            {isFormCompleted && (
              <div className={`mb-6 border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${getStatusBanner().className}`}>
                <div>
                  <p className="font-semibold text-sm">{getStatusBanner().label}</p>
                  <p className="text-xs mt-0.5 opacity-80">
                    {mode === 'view'
                      ? t('operator.wizard.view_hint', 'Consultez votre fiche. Cliquez sur Modifier pour mettre à jour.')
                      : t('operator.wizard.edit_hint', 'Modifiez vos informations puis enregistrez.')}
                  </p>
                </div>
                {mode === 'view' ? (
                  <button
                    type="button"
                    onClick={() => setMode('edit')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/80 border border-current/20 font-semibold text-sm hover:bg-white transition"
                  >
                    <Pencil size={16} />
                    {t('operator.wizard.edit', 'Modifier')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/80 border border-current/20 font-semibold text-sm hover:bg-white transition"
                  >
                    {t('operator.common.cancel', 'Annuler')}
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle size={20} className="text-red-600 me-3 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="surface-card p-6 md:p-8">
              {/* Inline (pas de sous-composant) pour garder le focus clavier mobile/desktop */}
              <fieldset disabled={isReadOnly} className="space-y-10 min-w-0 border-0 p-0 m-0 disabled:opacity-90">
                {currentBackendIds.map((id) => (
                  <div key={id}>{renderBackendPanel(id)}</div>
                ))}
              </fieldset>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap justify-between gap-3 mt-8">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
                {t('operator.common.previous')}
              </button>

              <div className="flex flex-wrap gap-3">
                {mode === 'edit' && (
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={18} />
                    {saving
                      ? t('operator.wizard.saving', 'Enregistrement…')
                      : t('operator.wizard.save', 'Enregistrer')}
                  </button>
                )}

                {mode === 'view' && currentStep < WIZARD_STEPS.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    {t('operator.common.next')}
                    <ChevronRight size={20} />
                  </button>
                )}

                {mode === 'onboarding' && (
                  currentStep < WIZARD_STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={saving}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('operator.common.next')}
                      <ChevronRight size={20} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={saving}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? t('operator.wizard.submitting') : t('operator.wizard.validate_submit')}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorWizardPage;
