import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import { CheckCircle, Circle, ChevronRight, ChevronLeft, Upload, MapPin, Building2, User, FileText, Camera, Home, AlertCircle } from 'lucide-react';

const STEPS = [
  { id: 'providerType', label: 'Type de prestataire', icon: Building2 },
  { id: 'publicInfo', label: 'Vos informations', icon: User },
  { id: 'photos', label: 'Vos photos', icon: Camera },
  { id: 'address', label: 'Adresse de la société', icon: MapPin },
  { id: 'experiences', label: 'Expériences', icon: FileText },
  { id: 'privateInfo', label: 'Informations privées', icon: Home },
];

const OperatorWizardPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    providerType: null,
    publicName: '',
    description: '',
    location: { city: '', address: '', postalCode: '', country: 'France' },
    logo: '',
    gallery: [],
    companyAddress: { street: '', city: '', postalCode: '', country: 'France' },
    experiences: '',
    companyInfo: {},
    individualWithStatusInfo: {},
    individualWithoutStatusInfo: {},
  });

  useEffect(() => {
    const fetchWizardData = async () => {
      try {
        const { data } = await api.get('/api/operator/wizard/data');
        setWizardData(data);
        
        // Populate form with existing data
        if (data) {
          setFormData({
            providerType: data.providerType,
            publicName: data.publicName || '',
            description: data.description || '',
            location: data.location || { city: '', address: '', postalCode: '', country: 'France' },
            logo: data.photos?.logo || '',
            gallery: data.photos?.gallery || [],
            companyAddress: data.companyAddress || { street: '', city: '', postalCode: '', country: 'France' },
            experiences: data.experiences || '',
            companyInfo: data.companyInfo || {},
            individualWithStatusInfo: data.individualWithStatusInfo || {},
            individualWithoutStatusInfo: data.individualWithoutStatusInfo || {},
          });
          
          // Set current step to first incomplete step
          const completedSteps = data.completedSteps || [];
          const firstIncomplete = STEPS.findIndex(step => !completedSteps.includes(step.id));
          if (firstIncomplete !== -1) {
            setCurrentStep(firstIncomplete);
          }
        }
      } catch (error) {
        console.error('Failed to fetch wizard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWizardData();
  }, []);

  const handleNext = async () => {
    setError('');
    setSaving(true);

    try {
      const stepId = STEPS[currentStep].id;
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
          });
          break;
        case 'privateInfo':
          response = await api.put('/api/operator/wizard/private-info', {
            companyInfo: formData.companyInfo,
            individualWithStatusInfo: formData.individualWithStatusInfo,
            individualWithoutStatusInfo: formData.individualWithoutStatusInfo,
          });
          break;
      }

      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save step');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSaving(true);

    try {
      await api.post('/api/operator/wizard/submit');
      alert('Votre demande a été soumise avec succès. Elle est en cours d\'examen par notre équipe.');
      navigate('/operator/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit wizard');
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

  const isStepCompleted = (stepId) => {
    if (!wizardData) return false;
    return wizardData.completedSteps?.includes(stepId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  const StepContent = () => {
    const stepId = STEPS[currentStep].id;

    switch (stepId) {
      case 'providerType':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Type de prestataire</h2>
            <p className="text-gray-600">Sélectionnez le type de prestataire qui correspond à votre situation.</p>
            
            <div className="space-y-4">
              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary-600 transition">
                <input
                  type="radio"
                  name="providerType"
                  value="company"
                  checked={formData.providerType === 'company'}
                  onChange={(e) => setFormData({ ...formData, providerType: e.target.value })}
                  className="mt-1 mr-4"
                />
                <div>
                  <div className="font-semibold text-gray-900">Personne morale (Société)</div>
                  <div className="text-sm text-gray-600 mt-1">
                    J'exerce mes activités dans le cadre d'une entreprise immatriculée, comme une société.
                    <br />
                    <span className="text-xs italic">Exemple : je vends des expériences dans le cadre d'une société (ou toute autre entité commerciale) immatriculée dans un registre des entreprises officiel.</span>
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
                  className="mt-1 mr-4"
                />
                <div>
                  <div className="font-semibold text-gray-900">Personne physique avec statut</div>
                  <div className="text-sm text-gray-600 mt-1">
                    J'opère en tant que personne physique/opérateur individuel (auto-entrepreneur, micro-entreprise, etc.)
                    <br />
                    <span className="text-xs italic">Exemple : je vends des expériences en mon nom en tant que source principale de revenus/à titre professionnel.</span>
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
                  className="mt-1 mr-4"
                />
                <div>
                  <div className="font-semibold text-gray-900">Personne physique sans statut</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Je suis un particulier
                    <br />
                    <span className="text-xs italic">Exemple : je vends des expériences à titre non professionnel. Je n'opère pas dans le cadre d'une entreprise.</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        );

      case 'publicInfo':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Vos informations</h2>
            <p className="text-gray-600">Ces informations s'afficheront sur votre page publique.</p>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom public <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.publicName}
                onChange={(e) => setFormData({ ...formData, publicName: e.target.value })}
                placeholder="Par exemple : « Les randonnées de Paul »"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Il s'agit du nom utilisé pour la promotion de vos visites, activités ou expériences.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Parlez-nous des expériences que vous proposez <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Écrivez une brève description des visites, activités ou autres expériences que vous offrez."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                required
                minLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/100 caractères nécessaires
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Où votre expérience se déroule-t-elle ? <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.location.city}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  location: { ...formData.location, city: e.target.value }
                })}
                placeholder="Rechercher une municipalité"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Si vous proposez plusieurs expériences, indiquez l'endroit où se situe la majorité d'entre elles.</p>
            </div>
          </div>
        );

      case 'photos':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Vos photos</h2>
            <p className="text-gray-600">Ajoutez votre logo et des photos pour votre profil.</p>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Logo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="max-h-32 mx-auto" />
                ) : (
                  <div>
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Cliquez pour télécharger votre logo</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Galerie de photos</label>
              <div className="grid grid-cols-3 gap-4">
                {formData.gallery.map((photo, index) => (
                  <div key={index} className="border rounded-lg p-2">
                    <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-32 object-cover rounded" />
                  </div>
                ))}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-600 transition">
                  <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-xs text-gray-600">Ajouter une photo</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'address':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Adresse de la société</h2>
            <p className="text-gray-600">Renseignez l'adresse complète de votre entreprise.</p>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rue <span className="text-red-500">*</span>
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
                  Ville <span className="text-red-500">*</span>
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
                  Code postal <span className="text-red-500">*</span>
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
            <h2 className="text-2xl font-bold text-gray-900">Expériences</h2>
            <p className="text-gray-600">Décrivez en détail les expériences que vous proposez.</p>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description des expériences <span className="text-red-500">*</span>
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
            <h2 className="text-2xl font-bold text-gray-900">Informations privées</h2>
            <p className="text-gray-600">Ces informations sont confidentielles et ne seront pas affichées publiquement.</p>
            
            {formData.providerType === 'company' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de la société *</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro RC (Registre du Commerce) *</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro KABIS *</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro SIRET *</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro TVA</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Forme juridique *</label>
                  <select
                    value={formData.companyInfo.legalForm || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      companyInfo: { ...formData.companyInfo, legalForm: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Sélectionner</option>
                    <option value="SARL">SARL</option>
                    <option value="SAS">SAS</option>
                    <option value="SA">SA</option>
                    <option value="EURL">EURL</option>
                    <option value="SNC">SNC</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Capital social</label>
                  <input
                    type="number"
                    value={formData.companyInfo.capital || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      companyInfo: { ...formData.companyInfo, capital: parseFloat(e.target.value) }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Siège social</label>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom *</label>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom *</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Statut *</label>
                  <select
                    value={formData.individualWithStatusInfo.status || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      individualWithStatusInfo: { ...formData.individualWithStatusInfo, status: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Sélectionner</option>
                    <option value="auto-entrepreneur">Auto-entrepreneur</option>
                    <option value="micro-entreprise">Micro-entreprise</option>
                    <option value="profession-liberale">Profession libérale</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro SIRET *</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Code APE</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Régime fiscal</label>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom *</label>
                    <input
                      type="text"
                      value={formData.individualWithoutStatusInfo.firstName || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        individualWithoutStatusInfo: { ...formData.individualWithoutStatusInfo, firstName: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom *</label>
                    <input
                      type="text"
                      value={formData.individualWithoutStatusInfo.lastName || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        individualWithoutStatusInfo: { ...formData.individualWithoutStatusInfo, lastName: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro de pièce d'identité *</label>
                  <input
                    type="text"
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-500 mb-2">Progression : {getProgress()}%</h3>
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
              const isCompleted = isStepCompleted(step.id);
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
                    <CheckCircle size={20} className="text-green-600" />
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

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle size={20} className="text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
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
                Précédent
              </button>

              {currentStep < STEPS.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Envoi...' : 'Valider et soumettre'}
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

