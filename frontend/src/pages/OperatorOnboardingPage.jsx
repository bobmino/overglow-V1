import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import {
  Building2,
  User,
  Camera,
  Home,
  FileText,
  Lock,
  CheckCircle,
  Circle,
  ChevronRight,
  ChevronLeft,
  Upload,
  MapPin,
  X,
  AlertCircle,
  Loader,
} from 'lucide-react';

const OperatorOnboardingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    // Step 1: Provider Type
    providerType: '',
    
    // Step 2: Public Info
    publicName: '',
    experienceLocation: {
      city: '',
      address: '',
      coordinates: { lat: null, lng: null },
    },
    experienceDescription: '',
    
    // Step 3: Photos
    publicPhotos: [],
    
    // Step 4: Address
    companyAddress: {
      street: '',
      city: '',
      postalCode: '',
      country: 'France',
      coordinates: { lat: null, lng: null },
    },
    
    // Step 5: Experiences
    experienceTypes: [''],
    
    // Step 6: Private Info
    companyInfo: {
      companyName: '',
      registrationNumber: '',
      registrationType: '',
      taxId: '',
      legalForm: '',
      registrationDate: '',
      registrationAuthority: '',
    },
    individualWithStatusInfo: {
      statusType: '',
      registrationNumber: '',
      registrationDate: '',
      taxId: '',
    },
    individualWithoutStatusInfo: {
      notes: '',
    },
    bankInfo: {
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      iban: '',
      swift: '',
    },
    privateContact: {
      phone: '',
      email: '',
      alternateEmail: '',
    },
    documents: [],
  });

  const steps = [
    { id: 1, key: 'providerType', label: t('operator.onboarding.steps.provider_type'), icon: Building2 },
    { id: 2, key: 'publicInfo', label: t('operator.onboarding.steps.public_info'), icon: User },
    { id: 3, key: 'photos', label: t('operator.onboarding.steps.photos'), icon: Camera },
    { id: 4, key: 'address', label: t('operator.onboarding.steps.address'), icon: Home },
    { id: 5, key: 'experiences', label: t('operator.onboarding.steps.experiences'), icon: FileText },
    { id: 6, key: 'privateInfo', label: t('operator.onboarding.steps.private_info'), icon: Lock },
  ];

  useEffect(() => {
    fetchOnboarding();
  }, []);

  const fetchOnboarding = async () => {
    try {
      const { data } = await api.get('/api/operator/onboarding');
      setOnboarding(data);
      
      // Populate form data from existing onboarding
      if (data) {
        setFormData(prev => ({
          ...prev,
          providerType: data.providerType || '',
          publicName: data.publicName || '',
          experienceLocation: data.experienceLocation || prev.experienceLocation,
          experienceDescription: data.experienceDescription || '',
          publicPhotos: data.publicPhotos || [],
          companyAddress: data.companyAddress || prev.companyAddress,
          experienceTypes: data.experienceTypes && data.experienceTypes.length > 0 
            ? data.experienceTypes 
            : [''],
          companyInfo: data.companyInfo || prev.companyInfo,
          individualWithStatusInfo: data.individualWithStatusInfo || prev.individualWithStatusInfo,
          individualWithoutStatusInfo: data.individualWithoutStatusInfo || prev.individualWithoutStatusInfo,
          bankInfo: data.bankInfo || prev.bankInfo,
          privateContact: data.privateContact || prev.privateContact,
          documents: data.documents || [],
        }));
        
        // Determine current step based on progress
        if (data.onboardingStatus === 'pending_approval' || data.onboardingStatus === 'approved') {
          // Show last step or summary
        } else {
          // Find first incomplete step
          let step = 1;
          if (data.providerType) step = 2;
          if (data.publicName && data.experienceDescription) step = 3;
          if (data.publicPhotos && data.publicPhotos.length > 0) step = 4;
          if (data.companyAddress?.city) step = 5;
          if (data.experienceTypes && data.experienceTypes.length > 0) step = 6;
          setCurrentStep(step);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch onboarding:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
    setError('');
  };

  const handleNestedInputChange = (parent, child, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: value,
      },
    }));
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = async (e, isDocument = false) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    setUploading(true);

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const { data } = await api.post('/api/upload', formDataUpload, config);
      
      if (isDocument) {
        setFormData(prev => ({
          ...prev,
          documents: [...prev.documents, {
            type: 'other',
            url: typeof data === 'string' ? data : (data.url || data),
            uploadedAt: new Date(),
            verified: false,
          }],
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          publicPhotos: [...prev.publicPhotos, {
            url: typeof data === 'string' ? data : (data.url || data),
            caption: '',
          }],
        }));
      }
      setUploading(false);
    } catch (error) {
      console.error('Upload error:', error);
      setError(t('operator.onboarding.upload_error'));
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      publicPhotos: prev.publicPhotos.filter((_, i) => i !== index),
    }));
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.providerType) {
          setError(t('operator.onboarding.validation_provider_type'));
          return false;
        }
        return true;
      case 2:
        if (!formData.publicName.trim()) {
          setError(t('operator.onboarding.validation_public_name'));
          return false;
        }
        if (!formData.experienceLocation?.city) {
          setError(t('operator.onboarding.validation_experience_city'));
          return false;
        }
        if (!formData.experienceDescription.trim() || formData.experienceDescription.trim().length < 100) {
          setError(t('operator.onboarding.validation_description_length'));
          return false;
        }
        return true;
      case 3:
        if (formData.publicPhotos.length === 0) {
          setError(t('operator.onboarding.validation_photo_required'));
          return false;
        }
        return true;
      case 4:
        if (!formData.companyAddress?.city) {
          setError(t('operator.onboarding.validation_company_city'));
          return false;
        }
        return true;
      case 5:
        const validTypes = formData.experienceTypes.filter(type => type.trim() !== '');
        if (validTypes.length === 0) {
          setError(t('operator.onboarding.validation_experience_type'));
          return false;
        }
        return true;
      case 6:
        if (formData.providerType === 'company') {
          if (!formData.companyInfo?.registrationNumber) {
            setError(t('operator.onboarding.validation_company_registration'));
            return false;
          }
        } else if (formData.providerType === 'individual_with_status') {
          if (!formData.individualWithStatusInfo?.registrationNumber) {
            setError(t('operator.onboarding.validation_individual_registration'));
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const saveStep = async (step) => {
    if (!validateStep(step)) {
      return false;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let endpoint = '';
      let payload = {};

      switch (step) {
        case 1:
          endpoint = '/api/operator/onboarding/provider-type';
          payload = { providerType: formData.providerType };
          break;
        case 2:
          endpoint = '/api/operator/onboarding/public-info';
          payload = {
            publicName: formData.publicName?.trim() || '',
            experienceLocation: {
              city: formData.experienceLocation?.city?.trim() || '',
              address: formData.experienceLocation?.address?.trim() || '',
              coordinates: formData.experienceLocation?.coordinates || {},
            },
            experienceDescription: formData.experienceDescription?.trim() || '',
          };
          break;
        case 3:
          endpoint = '/api/operator/onboarding/photos';
          payload = { photos: formData.publicPhotos };
          break;
        case 4:
          endpoint = '/api/operator/onboarding/address';
          payload = {
            companyAddress: {
              street: formData.companyAddress?.street?.trim() || '',
              city: formData.companyAddress?.city?.trim() || '',
              postalCode: formData.companyAddress?.postalCode?.trim() || '',
              country: formData.companyAddress?.country || 'France',
              coordinates: formData.companyAddress?.coordinates || {},
            },
          };
          break;
        case 5:
          endpoint = '/api/operator/onboarding/experiences';
          payload = {
            experienceTypes: formData.experienceTypes.filter(type => type.trim() !== ''),
          };
          break;
        case 6:
          endpoint = '/api/operator/onboarding/private-info';
          payload = {
            companyInfo: formData.companyInfo,
            individualWithStatusInfo: formData.individualWithStatusInfo,
            individualWithoutStatusInfo: formData.individualWithoutStatusInfo,
            bankInfo: formData.bankInfo,
            privateContact: formData.privateContact,
            documents: formData.documents,
          };
          break;
      }

      const { data } = await api.put(endpoint, payload);
      setOnboarding(data);
      setSuccess(t('operator.onboarding.step_saved'));
      setSaving(false);
      return true;
    } catch (error) {
      console.error('Save step error:', error);
      
      // Handle validation errors with detailed messages
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        
        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Express-validator errors format
          const errorMessages = errorData.errors.map(err => {
            if (typeof err === 'string') return err;
            return err.msg || err.message || JSON.stringify(err);
          }).join(', ');
          setError(t('operator.onboarding.validation_errors', { errors: errorMessages }));
        } else if (errorData.message) {
          setError(errorData.message);
        } else {
          setError(t('operator.onboarding.validation_check_fields'));
        }
      } else {
        setError(error.response?.data?.message || t('operator.onboarding.save_error'));
      }
      
      setSaving(false);
      return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < steps.length) {
      const saved = await saveStep(currentStep);
      if (saved) {
        setCurrentStep(currentStep + 1);
        setSuccess('');
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
      setSuccess('');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) {
      return;
    }

    // Save last step first
    const saved = await saveStep(6);
    if (!saved) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.post('/api/operator/onboarding/submit');
      setOnboarding(data.onboarding);
      setSuccess(t('operator.onboarding.submit_success'));
    } catch (error) {
      console.error('Submit error:', error);
      setError(error.response?.data?.message || t('operator.onboarding.submit_error'));
      setSaving(false);
    }
  };

  const getStepStatus = (stepId) => {
    if (!onboarding) return 'pending';
    const step = steps[stepId - 1];
    
    switch (step.key) {
      case 'providerType':
        return onboarding.providerType ? 'completed' : 'pending';
      case 'publicInfo':
        return onboarding.publicName && onboarding.experienceDescription ? 'completed' : 'pending';
      case 'photos':
        return onboarding.publicPhotos && onboarding.publicPhotos.length > 0 ? 'completed' : 'pending';
      case 'address':
        return onboarding.companyAddress?.city ? 'completed' : 'pending';
      case 'experiences':
        return onboarding.experienceTypes && onboarding.experienceTypes.length > 0 ? 'completed' : 'pending';
      case 'privateInfo':
        if (onboarding.providerType === 'company') {
          return onboarding.companyInfo?.registrationNumber ? 'completed' : 'pending';
        } else if (onboarding.providerType === 'individual_with_status') {
          return onboarding.individualWithStatusInfo?.registrationNumber ? 'completed' : 'pending';
        } else if (onboarding.providerType === 'individual_without_status') {
          return 'completed';
        }
        return 'pending';
      default:
        return 'pending';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-12 w-12 text-primary-600" />
      </div>
    );
  }

  // If already approved, redirect to dashboard
  if (onboarding?.onboardingStatus === 'approved') {
    navigate('/operator/dashboard');
    return null;
  }

  // If pending approval, show message
  if (onboarding?.onboardingStatus === 'pending_approval') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t('operator.onboarding.pending_title')}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {t('operator.onboarding.pending_desc')}
            </p>
            {onboarding.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-semibold mb-2">{t('operator.onboarding.rejection_reason')}</p>
                <p className="text-red-700">{onboarding.rejectionReason}</p>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                <strong>{t('operator.onboarding.progress_label')}</strong> {onboarding.progress || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progress = onboarding?.progress || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <div className="mb-6">
                <h2 className="text-sm font-bold text-gray-500 uppercase mb-2">{t('operator.common.progress')}</h2>
                <div className="text-2xl font-bold text-primary-600 mb-2">{progress}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <nav className="space-y-2">
                {steps.map((step) => {
                  const status = getStepStatus(step.id);
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-semibold'
                          : status === 'completed'
                          ? 'text-gray-700 hover:bg-gray-50'
                          : 'text-gray-400'
                      }`}
                    >
                      {status === 'completed' ? (
                        <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                      ) : (
                        <Circle size={20} className="flex-shrink-0" />
                      )}
                      <Icon size={18} className="flex-shrink-0" />
                      <span className="text-sm">{step.label}</span>
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Step 1: Provider Type */}
              {currentStep === 1 && (
                <div>
                  <h1 id="step-1-title" className="text-3xl font-bold text-gray-900 mb-2">
                    {t('operator.onboarding.step1_title')}
                  </h1>
                  <p className="text-gray-600 mb-6">
                    {t('operator.onboarding.step1_subtitle')}
                  </p>

                  <div className="space-y-4" role="radiogroup" aria-labelledby="step-1-title" aria-required="true">
                    <label htmlFor="provider-type-company" className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary-400 transition">
                      <input
                        type="radio"
                        id="provider-type-company"
                        name="providerType"
                        value="company"
                        checked={formData.providerType === 'company'}
                        onChange={(e) => handleInputChange('providerType', e.target.value)}
                        className="mt-1 me-4"
                        aria-required="true"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-2">
                          {t('operator.onboarding.provider_company_title')}
                        </div>
                        <div className="text-sm text-gray-600">
                          {t('operator.onboarding.provider_company_desc')}
                        </div>
                      </div>
                    </label>

                    <label htmlFor="provider-type-individual-status" className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary-400 transition">
                      <input
                        type="radio"
                        id="provider-type-individual-status"
                        name="providerType"
                        value="individual_with_status"
                        checked={formData.providerType === 'individual_with_status'}
                        onChange={(e) => handleInputChange('providerType', e.target.value)}
                        className="mt-1 me-4"
                        aria-required="true"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-2">
                          {t('operator.onboarding.provider_individual_status_title')}
                        </div>
                        <div className="text-sm text-gray-600">
                          {t('operator.onboarding.provider_individual_status_desc')}
                        </div>
                      </div>
                    </label>

                    <label htmlFor="provider-type-individual-no-status" className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary-400 transition">
                      <input
                        type="radio"
                        id="provider-type-individual-no-status"
                        name="providerType"
                        value="individual_without_status"
                        checked={formData.providerType === 'individual_without_status'}
                        onChange={(e) => handleInputChange('providerType', e.target.value)}
                        className="mt-1 me-4"
                        aria-required="true"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-2">
                          {t('operator.onboarding.provider_individual_title')}
                        </div>
                        <div className="text-sm text-gray-600">
                          {t('operator.onboarding.provider_individual_desc')}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 2: Public Info */}
              {currentStep === 2 && (
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {t('operator.onboarding.step2_title')}
                  </h1>
                  <p className="text-gray-600 mb-6">
                    {t('operator.onboarding.step2_subtitle')}
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="public-name" className="block text-sm font-bold text-gray-700 mb-2">
                        {t('operator.onboarding.public_name_label')}
                      </label>
                      <p id="public-name-help" className="text-sm text-gray-600 mb-2">
                        {t('operator.onboarding.public_name_help')}
                      </p>
                      <input
                        type="text"
                        id="public-name"
                        name="public-name"
                        value={formData.publicName}
                        onChange={(e) => handleInputChange('publicName', e.target.value)}
                        placeholder={t('operator.onboarding.public_name_placeholder')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        aria-required="true"
                        aria-describedby="public-name-help"
                        autoComplete="organization"
                      />
                    </div>

                    <div>
                      <label htmlFor="experience-city" className="block text-sm font-bold text-gray-700 mb-2">
                        {t('operator.onboarding.experience_location_label')}
                      </label>
                      <p id="experience-location-help" className="text-sm text-gray-600 mb-2">
                        {t('operator.onboarding.experience_location_help')}
                      </p>
                      <input
                        type="text"
                        id="experience-city"
                        name="experience-city"
                        value={formData.experienceLocation?.city || ''}
                        onChange={(e) => handleNestedInputChange('experienceLocation', 'city', e.target.value)}
                        placeholder={t('operator.onboarding.experience_city_placeholder')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        aria-required="true"
                        aria-describedby="experience-location-help"
                        autoComplete="address-level2"
                      />
                      <input
                        type="text"
                        id="experience-address"
                        name="experience-address"
                        value={formData.experienceLocation?.address || ''}
                        onChange={(e) => handleNestedInputChange('experienceLocation', 'address', e.target.value)}
                        placeholder={t('operator.onboarding.experience_address_placeholder')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        autoComplete="street-address"
                      />
                    </div>

                    <div>
                      <label htmlFor="experience-description" className="block text-sm font-bold text-gray-700 mb-2">
                        {t('operator.onboarding.experience_description_label')}
                      </label>
                      <p id="experience-description-help" className="text-sm text-gray-600 mb-2">
                        {t('operator.onboarding.experience_description_help')}
                      </p>
                      <textarea
                        id="experience-description"
                        name="experience-description"
                        value={formData.experienceDescription}
                        onChange={(e) => handleInputChange('experienceDescription', e.target.value)}
                        rows={6}
                        placeholder={t('operator.onboarding.experience_description_placeholder')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        aria-required="true"
                        aria-describedby="experience-description-help experience-description-count"
                      />
                      <p id="experience-description-count" className="text-sm text-gray-500 mt-1" aria-live="polite">
                        {t('operator.onboarding.experience_description_count', { count: formData.experienceDescription.length })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Photos */}
              {currentStep === 3 && (
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {t('operator.onboarding.step3_title')}
                  </h1>
                  <p className="text-gray-600 mb-6">
                    {t('operator.onboarding.step3_subtitle')}
                  </p>

                  <div className="space-y-4">
                    {formData.publicPhotos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.publicPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.url}
                          alt={photo.caption
                            ? t('operator.onboarding.photo_alt_caption', { index: index + 1, caption: photo.caption })
                            : t('operator.onboarding.photo_alt', { index: index + 1 })}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 end-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                          aria-label={t('operator.onboarding.remove_photo', { index: index + 1 })}
                        >
                          <X size={16} />
                        </button>
                        <label htmlFor={`photo-caption-${index}`} className="sr-only">
                          {t('operator.onboarding.photo_caption_sr', { index: index + 1 })}
                        </label>
                        <input
                          type="text"
                          id={`photo-caption-${index}`}
                          name={`photo-caption-${index}`}
                          value={photo.caption || ''}
                          onChange={(e) => {
                            const newPhotos = [...formData.publicPhotos];
                            newPhotos[index].caption = e.target.value;
                            setFormData(prev => ({ ...prev, publicPhotos: newPhotos }));
                          }}
                          placeholder={t('operator.onboarding.photo_caption_placeholder')}
                          className="w-full mt-2 px-2 py-1 text-sm border border-gray-300 rounded"
                          aria-label={t('operator.onboarding.photo_caption_aria', { index: index + 1 })}
                        />
                      </div>
                    ))}
                      </div>
                    )}

                    <label htmlFor="photo-upload" className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center h-32 cursor-pointer hover:border-primary-500 transition">
                      <Upload size={32} className="text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {uploading ? t('operator.common.uploading') : t('operator.onboarding.add_photo')}
                      </span>
                      <input
                        type="file"
                        id="photo-upload"
                        name="photo-upload"
                        className="hidden"
                        onChange={handleImageUpload}
                        accept="image/*"
                        disabled={uploading}
                        aria-label={t('operator.onboarding.upload_photo_aria')}
                        aria-describedby="photo-upload-help"
                      />
                      <span id="photo-upload-help" className="sr-only">
                        {t('operator.onboarding.upload_photo_help')}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 4: Address */}
              {currentStep === 4 && (
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {t('operator.onboarding.step4_title')}
                  </h1>
                  <p className="text-gray-600 mb-6">
                    {t('operator.onboarding.step4_subtitle')}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="company-address-street" className="block text-sm font-bold text-gray-700 mb-2">
                        {t('operator.onboarding.street_label')}
                      </label>
                      <input
                        type="text"
                        id="company-address-street"
                        name="company-address-street"
                        value={formData.companyAddress?.street || ''}
                        onChange={(e) => handleNestedInputChange('companyAddress', 'street', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        autoComplete="street-address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="company-address-city" className="block text-sm font-bold text-gray-700 mb-2">
                          {t('operator.onboarding.city_label')}
                        </label>
                        <input
                          type="text"
                          id="company-address-city"
                          name="company-address-city"
                          value={formData.companyAddress?.city || ''}
                          onChange={(e) => handleNestedInputChange('companyAddress', 'city', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          autoComplete="address-level2"
                        />
                      </div>

                      <div>
                        <label htmlFor="company-address-postal" className="block text-sm font-bold text-gray-700 mb-2">
                          {t('operator.onboarding.postal_code_label')}
                        </label>
                        <input
                          type="text"
                          id="company-address-postal"
                          name="company-address-postal"
                          value={formData.companyAddress?.postalCode || ''}
                          onChange={(e) => handleNestedInputChange('companyAddress', 'postalCode', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          autoComplete="postal-code"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="company-address-country" className="block text-sm font-bold text-gray-700 mb-2">
                        {t('operator.onboarding.country_label')}
                      </label>
                      <input
                        type="text"
                        id="company-address-country"
                        name="company-address-country"
                        value={formData.companyAddress?.country || 'France'}
                        onChange={(e) => handleNestedInputChange('companyAddress', 'country', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        autoComplete="country"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Experiences */}
              {currentStep === 5 && (
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {t('operator.onboarding.step5_title')}
                  </h1>
                  <p className="text-gray-600 mb-6">
                    {t('operator.onboarding.step5_subtitle')}
                  </p>

                  <div className="space-y-4">
                    {formData.experienceTypes.map((type, index) => (
                      <div key={index} className="flex gap-2">
                        <label htmlFor={`experience-type-${index}`} className="sr-only">
                          {t('operator.onboarding.experience_type_sr', { index: index + 1 })}
                        </label>
                        <input
                          type="text"
                          id={`experience-type-${index}`}
                          name={`experience-type-${index}`}
                          value={type}
                          onChange={(e) => handleArrayChange('experienceTypes', index, e.target.value)}
                          placeholder={t('operator.onboarding.experience_type_placeholder')}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          aria-label={t('operator.onboarding.experience_type_aria', { index: index + 1 })}
                        />
                        {formData.experienceTypes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('experienceTypes', index)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            aria-label={t('operator.onboarding.remove_experience_type', { index: index + 1 })}
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('experienceTypes')}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      aria-label={t('operator.onboarding.add_experience_type_aria')}
                    >
                      {t('operator.onboarding.add_experience_type')}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 6: Private Info */}
              {currentStep === 6 && (
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {t('operator.onboarding.step6_title')}
                  </h1>
                  <p className="text-gray-600 mb-6">
                    {t('operator.onboarding.step6_subtitle')}
                  </p>

                  <div className="space-y-6">
                    {/* Company Info */}
                    {formData.providerType === 'company' && (
                      <div className="border-t pt-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('operator.onboarding.company_info_title')}</h2>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="company-name" className="block text-sm font-bold text-gray-700 mb-2">
                              {t('operator.onboarding.company_name_label')}
                            </label>
                            <input
                              type="text"
                              id="company-name"
                              name="company-name"
                              value={formData.companyInfo?.companyName || ''}
                              onChange={(e) => handleNestedInputChange('companyInfo', 'companyName', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              aria-required="true"
                              autoComplete="organization"
                            />
                          </div>
                          <div>
                            <label htmlFor="company-registration-number" className="block text-sm font-bold text-gray-700 mb-2">
                              {t('operator.onboarding.registration_number_label')}
                            </label>
                            <input
                              type="text"
                              id="company-registration-number"
                              name="company-registration-number"
                              value={formData.companyInfo?.registrationNumber || ''}
                              onChange={(e) => handleNestedInputChange('companyInfo', 'registrationNumber', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              aria-required="true"
                            />
                          </div>
                          <div>
                            <label htmlFor="company-registration-type" className="block text-sm font-bold text-gray-700 mb-2">
                              {t('operator.onboarding.registration_type_label')}
                            </label>
                            <input
                              type="text"
                              id="company-registration-type"
                              name="company-registration-type"
                              value={formData.companyInfo?.registrationType || ''}
                              onChange={(e) => handleNestedInputChange('companyInfo', 'registrationType', e.target.value)}
                              placeholder={t('operator.onboarding.registration_type_placeholder')}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label htmlFor="company-tax-id" className="block text-sm font-bold text-gray-700 mb-2">
                              {t('operator.onboarding.tax_id_label')}
                            </label>
                            <input
                              type="text"
                              id="company-tax-id"
                              name="company-tax-id"
                              value={formData.companyInfo?.taxId || ''}
                              onChange={(e) => handleNestedInputChange('companyInfo', 'taxId', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              autoComplete="off"
                            />
                          </div>
                          <div>
                            <label htmlFor="company-legal-form" className="block text-sm font-bold text-gray-700 mb-2">
                              {t('operator.onboarding.legal_form_label')}
                            </label>
                            <input
                              type="text"
                              id="company-legal-form"
                              name="company-legal-form"
                              value={formData.companyInfo?.legalForm || ''}
                              onChange={(e) => handleNestedInputChange('companyInfo', 'legalForm', e.target.value)}
                              placeholder={t('operator.onboarding.legal_form_placeholder')}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label htmlFor="company-registration-date" className="block text-sm font-bold text-gray-700 mb-2">
                              {t('operator.onboarding.registration_date_label')}
                            </label>
                            <input
                              type="date"
                              id="company-registration-date"
                              name="company-registration-date"
                              value={formData.companyInfo?.registrationDate || ''}
                              onChange={(e) => handleNestedInputChange('companyInfo', 'registrationDate', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div className="col-span-2">
                            <label htmlFor="company-registration-authority" className="block text-sm font-bold text-gray-700 mb-2">
                              {t('operator.onboarding.registration_authority_label')}
                            </label>
                            <input
                              type="text"
                              id="company-registration-authority"
                              name="company-registration-authority"
                              value={formData.companyInfo?.registrationAuthority || ''}
                              onChange={(e) => handleNestedInputChange('companyInfo', 'registrationAuthority', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Individual with status */}
                    {formData.providerType === 'individual_with_status' && (
                      <div className="border-t pt-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('operator.onboarding.status_info_title')}</h2>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="individual-status-type" className="block text-sm font-bold text-gray-700 mb-2">
                              {t('operator.onboarding.status_type_label')}
                            </label>
                            <select
                              id="individual-status-type"
                              name="individual-status-type"
                              value={formData.individualWithStatusInfo?.statusType || ''}
                              onChange={(e) => handleNestedInputChange('individualWithStatusInfo', 'statusType', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              aria-required="true"
                            >
                              <option value="">{t('operator.common.select')}</option>
                              <option value="auto-entrepreneur">{t('operator.onboarding.status_auto_entrepreneur')}</option>
                              <option value="micro-entreprise">{t('operator.onboarding.status_micro_enterprise')}</option>
                              <option value="profession-liberale">{t('operator.onboarding.status_profession_liberale')}</option>
                              <option value="autre">{t('operator.onboarding.status_other')}</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="individual-registration-number" className="block text-sm font-bold text-gray-700 mb-2">
                              {t('operator.onboarding.individual_registration_number_label')}
                            </label>
                            <input
                              type="text"
                              id="individual-registration-number"
                              name="individual-registration-number"
                              value={formData.individualWithStatusInfo?.registrationNumber || ''}
                              onChange={(e) => handleNestedInputChange('individualWithStatusInfo', 'registrationNumber', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              aria-required="true"
                            />
                          </div>
                          <div>
                            <label htmlFor="individual-registration-date" className="block text-sm font-bold text-gray-700 mb-2">
                              {t('operator.onboarding.individual_registration_date_label')}
                            </label>
                            <input
                              type="date"
                              id="individual-registration-date"
                              name="individual-registration-date"
                              value={formData.individualWithStatusInfo?.registrationDate || ''}
                              onChange={(e) => handleNestedInputChange('individualWithStatusInfo', 'registrationDate', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label htmlFor="individual-tax-id" className="block text-sm font-bold text-gray-700 mb-2">
                              {t('operator.onboarding.tax_id_label')}
                            </label>
                            <input
                              type="text"
                              id="individual-tax-id"
                              name="individual-tax-id"
                              value={formData.individualWithStatusInfo?.taxId || ''}
                              onChange={(e) => handleNestedInputChange('individualWithStatusInfo', 'taxId', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              autoComplete="off"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Individual without status */}
                    {formData.providerType === 'individual_without_status' && (
                      <div className="border-t pt-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('operator.onboarding.additional_info_title')}</h2>
                        <div>
                          <label htmlFor="individual-notes" className="block text-sm font-bold text-gray-700 mb-2">
                            {t('operator.onboarding.notes_optional_label')}
                          </label>
                          <textarea
                            id="individual-notes"
                            name="individual-notes"
                            value={formData.individualWithoutStatusInfo?.notes || ''}
                            onChange={(e) => handleNestedInputChange('individualWithoutStatusInfo', 'notes', e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}

                    {/* Bank Info */}
                    <div className="border-t pt-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">{t('operator.onboarding.bank_info_title')}</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="bank-account-holder" className="block text-sm font-bold text-gray-700 mb-2">
                            {t('operator.onboarding.account_holder_label')}
                          </label>
                          <input
                            type="text"
                            id="bank-account-holder"
                            name="bank-account-holder"
                            value={formData.bankInfo?.accountHolderName || ''}
                            onChange={(e) => handleNestedInputChange('bankInfo', 'accountHolderName', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            autoComplete="name"
                          />
                        </div>
                        <div>
                          <label htmlFor="bank-name" className="block text-sm font-bold text-gray-700 mb-2">
                            {t('operator.onboarding.bank_name_label')}
                          </label>
                          <input
                            type="text"
                            id="bank-name"
                            name="bank-name"
                            value={formData.bankInfo?.bankName || ''}
                            onChange={(e) => handleNestedInputChange('bankInfo', 'bankName', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            autoComplete="organization"
                          />
                        </div>
                        <div>
                          <label htmlFor="bank-account-number" className="block text-sm font-bold text-gray-700 mb-2">
                            {t('operator.onboarding.account_number_label')}
                          </label>
                          <input
                            type="text"
                            id="bank-account-number"
                            name="bank-account-number"
                            value={formData.bankInfo?.accountNumber || ''}
                            onChange={(e) => handleNestedInputChange('bankInfo', 'accountNumber', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <label htmlFor="bank-iban" className="block text-sm font-bold text-gray-700 mb-2">
                            {t('operator.onboarding.iban_label')}
                          </label>
                          <input
                            type="text"
                            id="bank-iban"
                            name="bank-iban"
                            value={formData.bankInfo?.iban || ''}
                            onChange={(e) => handleNestedInputChange('bankInfo', 'iban', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <label htmlFor="bank-swift" className="block text-sm font-bold text-gray-700 mb-2">
                            {t('operator.onboarding.swift_label')}
                          </label>
                          <input
                            type="text"
                            id="bank-swift"
                            name="bank-swift"
                            value={formData.bankInfo?.swift || ''}
                            onChange={(e) => handleNestedInputChange('bankInfo', 'swift', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="border-t pt-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">{t('operator.onboarding.private_contact_title')}</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="private-phone" className="block text-sm font-bold text-gray-700 mb-2">
                            {t('operator.onboarding.phone_label')}
                          </label>
                          <input
                            type="tel"
                            id="private-phone"
                            name="private-phone"
                            value={formData.privateContact?.phone || ''}
                            onChange={(e) => handleNestedInputChange('privateContact', 'phone', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            autoComplete="tel"
                          />
                        </div>
                        <div>
                          <label htmlFor="private-email" className="block text-sm font-bold text-gray-700 mb-2">
                            {t('operator.common.email')}
                          </label>
                          <input
                            type="email"
                            id="private-email"
                            name="private-email"
                            value={formData.privateContact?.email || ''}
                            onChange={(e) => handleNestedInputChange('privateContact', 'email', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            autoComplete="email"
                          />
                        </div>
                        <div>
                          <label htmlFor="private-alternate-email" className="block text-sm font-bold text-gray-700 mb-2">
                            {t('operator.onboarding.alternate_email_label')}
                          </label>
                          <input
                            type="email"
                            id="private-alternate-email"
                            name="private-alternate-email"
                            value={formData.privateContact?.alternateEmail || ''}
                            onChange={(e) => handleNestedInputChange('privateContact', 'alternateEmail', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            autoComplete="email"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="border-t pt-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">{t('operator.onboarding.documents_title')}</h2>
                      <div className="space-y-4">
                        {formData.documents.map((doc, index) => (
                          <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <FileText size={24} className="text-gray-400" />
                            <div className="flex-1">
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                {t('operator.common.document', { index: index + 1 })}
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDocument(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        ))}
                        <label htmlFor="document-upload" className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center h-24 cursor-pointer hover:border-primary-500 transition">
                          <Upload size={24} className="text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">
                            {uploading ? t('operator.common.uploading') : t('operator.onboarding.add_document')}
                          </span>
                          <input
                            type="file"
                            id="document-upload"
                            name="document-upload"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, true)}
                            disabled={uploading}
                            aria-label={t('operator.onboarding.upload_document_aria')}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error and Success Messages */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2" role="alert" aria-live="assertive">
                  <AlertCircle className="text-red-600" size={20} aria-hidden="true" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {success && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2" role="status" aria-live="polite">
                  <CheckCircle className="text-green-600" size={20} aria-hidden="true" />
                  <p className="text-green-800">{success}</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStep === 1 || saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={20} />
                  {t('operator.common.previous')}
                </button>

                <div className="flex gap-4">
                  {currentStep < steps.length ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={saving || uploading}
                      className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {saving ? (
                        <>
                          <Loader className="animate-spin" size={20} />
                          {t('operator.common.saving')}
                        </>
                      ) : (
                        <>
                          {t('operator.common.next')}
                          <ChevronRight size={20} />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={saving || uploading}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {saving ? (
                        <>
                          <Loader className="animate-spin" size={20} />
                          {t('operator.onboarding.submitting')}
                        </>
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          {t('operator.onboarding.submit_for_approval')}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorOnboardingPage;
