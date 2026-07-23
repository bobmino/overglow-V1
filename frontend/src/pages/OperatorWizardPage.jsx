import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { CheckCircle, Circle, ChevronRight, ChevronLeft, Upload, MapPin, Building2, User, FileText, Camera, Home, AlertCircle } from 'lucide-react';
import { logger } from '../utils/logger.js';
import { useToast } from '../context/ToastContext';

const OperatorWizardPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const STEPS = useMemo(() => [
    {
      id: 'identity',
      label: t('operator.wizard.steps.identity', 'Identité'),
      icon: Building2,
      backendIds: ['providerType', 'publicInfo'],
    },
    {
      id: 'presence',
      label: t('operator.wizard.steps.presence', 'Présence'),
      icon: Camera,
      backendIds: ['photos', 'address', 'experiences'],
    },
    {
      id: 'legal',
      label: t('operator.wizard.steps.legal', 'Légal'),
      icon: Home,
      backendIds: ['privateInfo'],
    },
  ], [t]);
  
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
    companyInfo: {},
    individualWithStatusInfo: {},
    individualWithoutStatusInfo: {},
  });

  useEffect(() => {
    const fetchWizardData = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get('/api/operator/wizard/data');
        setWizardData(data);
        
        // Populate form with existing data
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
            companyInfo: data.companyInfo || {},
            individualWithStatusInfo: data.individualWithStatusInfo || {},
            individualWithoutStatusInfo: data.individualWithoutStatusInfo || {},
          });
          
          // Set current step to first incomplete step
          const completedSteps = data.completedSteps || [];
          const firstIncomplete = STEPS.findIndex(
            (step) => !(step.backendIds || [step.id]).every((id) => completedSteps.includes(id))
          );
          if (firstIncomplete !== -1) {
            setCurrentStep(firstIncomplete);
          }
        }
      } catch (error) {
        logger.error('Failed to fetch wizard data:', error);
        const msg =
          error.response?.data?.message ||
          t('operator.wizard.load_error', 'Impossible de charger l’onboarding. Réessayez.');
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchWizardData();
  }, [STEPS, t]);

  const saveBackendStep = async (stepId) => {
    switch (stepId) {
        case 'providerType':
          await api.put('/api/operator/wizard/provider-type', {
            providerType: formData.providerType,
          });
          break;
        case 'publicInfo':
          await api.put('/api/operator/wizard/public-info', {
            publicName: formData.publicName,
            description: formData.description,
            location: formData.location,
          });
          break;
        case 'photos':
          await api.put('/api/operator/wizard/photos', {
            logo: formData.logo,
            gallery: formData.gallery,
          });
          break;
        case 'address':
          await api.put('/api/operator/wizard/address', {
            companyAddress: formData.companyAddress,
          });
          break;
        case 'experiences':
          await api.put('/api/operator/wizard/experiences', {
            experiences: formData.experiences,
          });
          break;
        case 'privateInfo':
          await api.put('/api/operator/wizard/private-info', {
            companyInfo: formData.companyInfo,
            individualWithStatusInfo: formData.individualWithStatusInfo,
            individualWithoutStatusInfo: formData.individualWithoutStatusInfo,
          });
          break;
      default:
        break;
    }
  };

  const handleNext = async () => {
    setError('');
    setSaving(true);
    try {
      const backendIds = STEPS[currentStep].backendIds || [];
      for (const stepId of backendIds) {
        await saveBackendStep(stepId);
      }
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('operator.wizard.save_step_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSaving(true);

    try {
      const backendIds = STEPS[currentStep].backendIds || [];
      for (const stepId of backendIds) {
        await saveBackendStep(stepId);
      }
      await api.post('/api/operator/wizard/submit');
      toast.success(t('operator.wizard.submit_success'));
      navigate('/operator/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || t('operator.wizard.submit_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getProgress = () => {
    if (!wizardData) return 0;
    const completedSteps = wizardData.completedSteps || [];
    return Math.round((completedSteps.length / STEPS.length) * 100);
  };

  const isStepCompleted = (step) => {
    if (!wizardData) return false;
    const ids = step?.backendIds || [step?.id];
    return ids.every((id) => wizardData.completedSteps?.includes(id));
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
                  onChange={(e) => setFormData({ ...formData, providerType: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, providerType: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, providerType: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, publicName: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('operator.wizard.description_placeholder')}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                required
                minLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('operator.wizard.description_count', { count: formData.description.length })}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('operator.wizard.location_label')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.location.city}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  location: { ...formData.location, city: e.target.value }
                })}
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
                onChange={(e) => setFormData({ 
                  ...formData, 
                  companyAddress: { ...formData.companyAddress, street: e.target.value }
                })}
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
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    companyAddress: { ...formData.companyAddress, city: e.target.value }
                  })}
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
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    companyAddress: { ...formData.companyAddress, postalCode: e.target.value }
                  })}
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
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('operator.wizard.experiences_description_label')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.experiences}
                onChange={(e) => setFormData({ ...formData, experiences: e.target.value })}
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
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      companyInfo: { ...formData.companyInfo, companyName: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.rc_number_label')}</label>
                  <input
                    type="text"
                    value={formData.companyInfo.registrationNumber || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      companyInfo: { ...formData.companyInfo, registrationNumber: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.kbis_number_label')}</label>
                  <input
                    type="text"
                    value={formData.companyInfo.kbis || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      companyInfo: { ...formData.companyInfo, kbis: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.siret_number_label')}</label>
                  <input
                    type="text"
                    value={formData.companyInfo.siret || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      companyInfo: { ...formData.companyInfo, siret: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.vat_number_label')}</label>
                  <input
                    type="text"
                    value={formData.companyInfo.vatNumber || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      companyInfo: { ...formData.companyInfo, vatNumber: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.legal_form_label')}</label>
                  <select
                    value={formData.companyInfo.legalForm || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      companyInfo: { ...formData.companyInfo, legalForm: e.target.value }
                    })}
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
                    onChange={(e) => {
                      const raw = e.target.value;
                      setFormData({
                        ...formData,
                        companyInfo: {
                          ...formData.companyInfo,
                          capital: raw === '' ? '' : parseFloat(raw),
                        },
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.headquarters_label')}</label>
                  <input
                    type="text"
                    value={formData.companyInfo.headquarters || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      companyInfo: { ...formData.companyInfo, headquarters: e.target.value }
                    })}
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
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        individualWithStatusInfo: { ...formData.individualWithStatusInfo, firstName: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.last_name_label')}</label>
                    <input
                      type="text"
                      value={formData.individualWithStatusInfo.lastName || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        individualWithStatusInfo: { ...formData.individualWithStatusInfo, lastName: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.status_label')}</label>
                  <select
                    value={formData.individualWithStatusInfo.status || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      individualWithStatusInfo: { ...formData.individualWithStatusInfo, status: e.target.value }
                    })}
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
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      individualWithStatusInfo: { ...formData.individualWithStatusInfo, siret: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.ape_code_label')}</label>
                  <input
                    type="text"
                    value={formData.individualWithStatusInfo.apeCode || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      individualWithStatusInfo: { ...formData.individualWithStatusInfo, apeCode: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('operator.wizard.tax_regime_label')}</label>
                  <input
                    type="text"
                    value={formData.individualWithStatusInfo.taxStatus || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      individualWithStatusInfo: { ...formData.individualWithStatusInfo, taxStatus: e.target.value }
                    })}
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
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        individualWithoutStatusInfo: { ...formData.individualWithoutStatusInfo, firstName: e.target.value }
                      })}
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
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        individualWithoutStatusInfo: { ...formData.individualWithoutStatusInfo, lastName: e.target.value }
                      })}
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
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      individualWithoutStatusInfo: { ...formData.individualWithoutStatusInfo, idNumber: e.target.value }
                    })}
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

  const StepContent = () => {
    const backendIds = STEPS[currentStep].backendIds || [STEPS[currentStep].id];
    return (
      <div className="space-y-10">
        {backendIds.map((id) => (
          <div key={id}>{renderBackendPanel(id)}</div>
        ))}
      </div>
    );
  };

  return (
    <div className="page-shell py-6 px-4 md:px-6">
      <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
        {/* Stepper */}
        <div className="w-full lg:w-64 surface-card p-6 h-fit">
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-500 mb-2">{t('operator.wizard.progress', { percent: getProgress() })}</h3>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>

          <nav className="space-y-1">
            {STEPS.map((step, index) => {
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
                    // Allow navigation to completed steps or current step
                    if (isCompleted || isCurrent) {
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
                  <span className="text-sm">{step.label}</span>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex-1">
          <div className="max-w-3xl mx-auto">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle size={20} className="text-red-600 me-3 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="surface-card p-6 md:p-8">
              <StepContent />
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
                {t('operator.common.previous')}
              </button>

              {currentStep < STEPS.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={saving}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('operator.common.next')}
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? t('operator.wizard.submitting') : t('operator.wizard.validate_submit')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorWizardPage;
