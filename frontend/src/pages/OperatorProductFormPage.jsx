import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { formatImageUrl } from '../utils/formatImage';
import { Save, Image as ImageIcon, X } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { logger } from '../utils/logger.js';

const OperatorProductFormPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const getFieldLabel = (field) => {
    switch (field) {
      case 'highlights':
        return t('operator.product_form.field_highlights');
      case 'included':
        return t('operator.product_form.field_included');
      case 'requirements':
        return t('operator.product_form.field_requirements');
      default:
        return field;
    }
  };

  const getAddFieldLabel = (field) => {
    switch (field) {
      case 'highlights':
        return t('operator.product_form.add_highlight');
      case 'included':
        return t('operator.product_form.add_included');
      case 'requirements':
        return t('operator.product_form.add_requirement');
      default:
        return t('operator.common.add');
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Tours',
    productType: 'tour',
    city: '',
    address: '',
    duration: '',
    luxuryStay: {
      rooms: 1,
      capacity: 2,
      amenities: { pool: false, wifi: false, jacuzzi: false },
      standing: 1,
    },
    serviceDetails: {
      vehicleType: '',
      vehicleCount: 1,
      guideIncluded: false,
      languages: [''],
    },
    paymentPreference: 'Paiement sur place',
    images: [],
    highlights: [''],
    included: [''],
    requirements: [''],
    requiresInquiry: false,
    inquiryType: 'none',
    timeSlots: [{ startTime: '09:00', endTime: '17:00' }],
    status: 'Draft',
    cancellationPolicy: {
      type: 'moderate',
      freeCancellationHours: 48,
      refundPercentage: 50,
      description: '',
    },
    skipTheLine: {
      enabled: false,
      type: 'Fast Track',
      additionalPrice: 0,
      description: 'Évitez les files d\'attente avec cette option',
      availability: 'always',
      maxCapacity: null,
    },
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/api/products/${id}`);
      
      setFormData(prev => ({
        ...prev,
        title: data.title || '',
        description: data.description || '',
        category: data.category || 'Tours',
        productType: data.productType || 'tour',
        city: data.city || '',
        address: data.address || '',
        duration: data.duration || '',
        price: data.price !== undefined && data.price !== null ? String(data.price) : '',
        images: Array.isArray(data.images) ? data.images : [],
        highlights: Array.isArray(data.highlights) && data.highlights.length ? data.highlights : [''],
        included: Array.isArray(data.included) && data.included.length ? data.included : [''],
        requirements: Array.isArray(data.requirements) && data.requirements.length ? data.requirements : [''],
        requiresInquiry: data.requiresInquiry || false,
        inquiryType: data.inquiryType || 'none',
        timeSlots: Array.isArray(data.timeSlots) && data.timeSlots.length ? data.timeSlots : [{ startTime: '09:00', endTime: '17:00' }],
        status: data.status || 'Draft',
        luxuryStay: data.luxuryStay || {
          rooms: 1,
          capacity: 2,
          amenities: { pool: false, wifi: false, jacuzzi: false },
          standing: 1,
        },
        serviceDetails: data.serviceDetails || {
          vehicleType: '',
          vehicleCount: 1,
          guideIncluded: false,
          languages: [''],
        },
        cancellationPolicy: data.cancellationPolicy || {
          type: 'moderate',
          freeCancellationHours: 48,
          refundPercentage: 50,
          description: '',
        },
      }));

      setError('');
    } catch (err) {
      logger.error('Failed to fetch product details:', err.response?.data || err.message);
      setError(err.response?.data?.message || t('operator.product_form.fetch_error'));
    }
  };

  useEffect(() => {
    if (isEditMode) {
      fetchProduct();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'price') {
      const sanitizedValue = value.replace(',', '.');
      setFormData(prev => ({ ...prev, price: sanitizedValue }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (index, value, field) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayItem = (index, field) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const { data } = await api.post('/api/upload', formData, config);
      const imageUrl = typeof data === 'string' ? data : (data.url || data);
      setFormData(prev => ({ ...prev, images: [...prev.images, imageUrl] }));
      setUploading(false);
    } catch (error) {
      logger.error(error);
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const numericPrice = Number(formData.price);

      if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        setError(t('operator.product_form.price_positive_error'));
        setLoading(false);
        return;
      }

      if (formData.status === 'Published' && numericPrice <= 0) {
        setError(t('operator.product_form.published_price_error'));
        setLoading(false);
        return;
      }

      const cleanHighlights = formData.highlights.filter(item => item.trim() !== '');
      const cleanIncluded = formData.included.filter(item => item.trim() !== '');
      const cleanRequirements = formData.requirements.filter(item => item.trim() !== '');
      const cleanLanguages = Array.isArray(formData.serviceDetails?.languages)
        ? formData.serviceDetails.languages.filter(lang => lang.trim() !== '')
        : [];

      const payload = {
        ...formData,
        price: numericPrice,
        productType: formData.productType || 'tour',
        highlights: cleanHighlights.length > 0 ? cleanHighlights : [],
        included: cleanIncluded.length > 0 ? cleanIncluded : [],
        requirements: cleanRequirements.length > 0 ? cleanRequirements : [],
        timeSlots: Array.isArray(formData.timeSlots) && formData.timeSlots.length > 0
          ? formData.timeSlots.filter(slot =>
              slot &&
              slot.startTime &&
              slot.endTime &&
              typeof slot.startTime === 'string' &&
              typeof slot.endTime === 'string'
            )
          : [],
        inquiryType: formData.requiresInquiry ? formData.inquiryType : 'none',
        skipTheLine: formData.skipTheLine || {
          enabled: false,
          type: 'Fast Track',
          additionalPrice: 0,
          description: 'Évitez les files d\'attente avec cette option',
          availability: 'always',
          maxCapacity: null,
        },
        serviceDetails: {
          ...formData.serviceDetails,
          languages: cleanLanguages.length > 0 ? cleanLanguages : [],
        },
      };

      if (isEditMode) {
        await api.put(`/api/products/${id}`, payload);
      } else {
        await api.post('/api/products', payload);
      }
      
      setError('');
      navigate('/operator/products');
    } catch (err) {
      logger.error('Save product error:', err);
      logger.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error ||
                          err.response?.data?.errors?.[0]?.msg || 
                          err.message ||
                          t('operator.product_form.save_error');
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? t('operator.product_form.edit_title') : t('operator.product_form.create_title')}
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.title_label')}</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.category_label')}</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="Tours">{t('operator.product_form.category_tours')}</option>
                <option value="Activities">{t('operator.product_form.category_activities')}</option>
                <option value="Tickets">{t('operator.product_form.category_tickets')}</option>
                <option value="Rentals">{t('operator.product_form.category_rentals')}</option>
                <option value="LuxuryStay">{t('operator.product_form.category_luxury_stay')}</option>
                <option value="Services">{t('operator.product_form.category_services')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.product_type_label')}</label>
              <select
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="tour">{t('operator.product_form.type_tour')}</option>
                <option value="luxury_stay">{t('operator.product_form.type_luxury_stay')}</option>
                <option value="service">{t('operator.product_form.type_service')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.status_label')}</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="Draft">{t('operator.product_form.status_draft')}</option>
                <option value="Published">{t('operator.product_form.status_published')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.city_label')}</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.address_label')}</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder={t('operator.product_form.address_placeholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.duration_label')}</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder={t('operator.product_form.duration_placeholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.price_label')}</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                placeholder={t('operator.product_form.price_placeholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('operator.product_form.price_hint')}
              </p>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.description_label')}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              ></textarea>
            </div>

          {/* Luxury Stay Fields */}
          {formData.category === 'LuxuryStay' && (
            <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.luxury_rooms')}</label>
                <input
                  type="number"
                  name="luxuryRooms"
                  value={formData.luxuryStay.rooms}
                  min="1"
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    luxuryStay: { ...prev.luxuryStay, rooms: Number(e.target.value) },
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.luxury_capacity')}</label>
                <input
                  type="number"
                  name="luxuryCapacity"
                  value={formData.luxuryStay.capacity}
                  min="1"
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    luxuryStay: { ...prev.luxuryStay, capacity: Number(e.target.value) },
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.luxury_amenities')}</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.luxuryStay.amenities.pool}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        luxuryStay: { ...prev.luxuryStay, amenities: { ...prev.luxuryStay.amenities, pool: e.target.checked } },
                      }))}
                    />
                    <span className="ms-2">{t('operator.product_form.amenity_pool')}</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.luxuryStay.amenities.wifi}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        luxuryStay: { ...prev.luxuryStay, amenities: { ...prev.luxuryStay.amenities, wifi: e.target.checked } },
                      }))}
                    />
                    <span className="ms-2">{t('operator.product_form.amenity_wifi')}</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.luxuryStay.amenities.jacuzzi}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        luxuryStay: { ...prev.luxuryStay, amenities: { ...prev.luxuryStay.amenities, jacuzzi: e.target.checked } },
                      }))}
                    />
                    <span className="ms-2">{t('operator.product_form.amenity_jacuzzi')}</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.luxury_standing')}</label>
                <select
                  name="luxuryStanding"
                  value={formData.luxuryStay.standing}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    luxuryStay: { ...prev.luxuryStay, standing: Number(e.target.value) },
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
            </div>
          )}

          {/* Service Details Fields */}
          {(formData.category === 'Services' || formData.productType === 'service') && (
            <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
              <div className="col-span-2">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('operator.product_form.service_details_title')}</h3>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.vehicle_type')}</label>
                <select
                  name="serviceVehicleType"
                  value={formData.serviceDetails.vehicleType}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    serviceDetails: { ...prev.serviceDetails, vehicleType: e.target.value },
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">{t('operator.product_form.vehicle_select')}</option>
                  <option value="sedan">{t('operator.product_form.vehicle_sedan')}</option>
                  <option value="suv">{t('operator.product_form.vehicle_suv')}</option>
                  <option value="minivan">{t('operator.product_form.vehicle_minivan')}</option>
                  <option value="bus">{t('operator.product_form.vehicle_bus')}</option>
                  <option value="boat">{t('operator.product_form.vehicle_boat')}</option>
                  <option value="quad">{t('operator.product_form.vehicle_quad')}</option>
                  <option value="camel">{t('operator.product_form.vehicle_camel')}</option>
                  <option value="other">{t('operator.product_form.vehicle_other')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.vehicle_count')}</label>
                <input
                  type="number"
                  name="serviceVehicleCount"
                  value={formData.serviceDetails.vehicleCount}
                  min="1"
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    serviceDetails: { ...prev.serviceDetails, vehicleCount: Number(e.target.value) },
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.serviceDetails.guideIncluded}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      serviceDetails: { ...prev.serviceDetails, guideIncluded: e.target.checked },
                    }))}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="ms-2 text-sm font-semibold text-gray-700">{t('operator.product_form.guide_included')}</span>
                </label>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.languages_spoken')}</label>
                <div className="space-y-2">
                  {Array.isArray(formData.serviceDetails.languages) && formData.serviceDetails.languages.map((lang, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={lang}
                        onChange={(e) => {
                          const newLangs = [...formData.serviceDetails.languages];
                          newLangs[index] = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            serviceDetails: { ...prev.serviceDetails, languages: newLangs },
                          }));
                        }}
                        placeholder={t('operator.product_form.language_placeholder')}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                      {formData.serviceDetails.languages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newLangs = formData.serviceDetails.languages.filter((_, i) => i !== index);
                            setFormData(prev => ({
                              ...prev,
                              serviceDetails: { ...prev.serviceDetails, languages: newLangs },
                            }));
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        serviceDetails: { ...prev.serviceDetails, languages: [...prev.serviceDetails.languages, ''] },
                      }));
                    }}
                    className="text-sm text-primary-700 font-bold hover:underline"
                  >
                    {t('operator.product_form.add_language')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Payment Preference */}
          <div className="col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.payment_preference')}</label>
            <select
              name="paymentPreference"
              value={formData.paymentPreference}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="Paiement par virement bancaire">{t('operator.product_form.payment_bank_transfer')}</option>
              <option value="Paiement sur place">{t('operator.product_form.payment_on_site')}</option>
            </select>
          </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.images_label')}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {Array.isArray(formData.images) && formData.images.map((img, index) => (
                <div key={index} className="relative group">
                  <img src={formatImageUrl(img)} alt={t('operator.product_form.product_image_alt', { index: index + 1 })} className="w-full h-24 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = formData.images.filter((_, i) => i !== index);
                      setFormData(prev => ({ ...prev, images: newImages }));
                    }}
                    className="absolute top-1 end-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center h-24 cursor-pointer hover:border-primary-500 transition">
                <ImageIcon className="text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">{uploading ? t('operator.common.uploading') : t('operator.product_form.add_image')}</span>
                <input type="file" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Dynamic Lists */}
          {['highlights', 'included', 'requirements'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {getFieldLabel(field)}
              </label>
              {Array.isArray(formData[field]) && formData[field].map((item, index) => {
                const inputId = `${field}-${index}`;
                return (
                  <div key={index} className="flex gap-2 mb-2">
                    <label htmlFor={inputId} className="sr-only">{t('operator.product_form.field_item_sr', { field: getFieldLabel(field), index: index + 1 })}</label>
                    <input
                      type="text"
                      id={inputId}
                      name={inputId}
                      value={item}
                      onChange={(e) => handleArrayChange(index, e.target.value, field)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      aria-label={t('operator.product_form.field_item_sr', { field: getFieldLabel(field), index: index + 1 })}
                    />
                  <button
                    type="button"
                    onClick={() => removeArrayItem(index, field)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={20} />
                  </button>
                </div>
                );
              })}
              <button
                type="button"
                onClick={() => addArrayItem(field)}
                className="text-sm text-primary-700 font-bold hover:underline"
              >
                {getAddFieldLabel(field)}
              </button>
            </div>
          ))}

          {/* Inquiry Settings */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('operator.product_form.inquiry_settings_title')}</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiresInquiry"
                  checked={formData.requiresInquiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, requiresInquiry: e.target.checked, inquiryType: e.target.checked ? 'manual' : 'none' }))}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="requiresInquiry" className="ms-2 text-sm font-semibold text-gray-700">
                  {t('operator.product_form.requires_inquiry')}
                </label>
              </div>
              
              {formData.requiresInquiry && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.inquiry_type')}</label>
                  <select
                    name="inquiryType"
                    value={formData.inquiryType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="none">{t('operator.product_form.inquiry_none')}</option>
                    <option value="manual">{t('operator.product_form.inquiry_manual')}</option>
                    <option value="automatic">{t('operator.product_form.inquiry_automatic')}</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Skip-the-Line */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('operator.product_form.skip_the_line_title')}</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="skipTheLineEnabled"
                  checked={formData.skipTheLine?.enabled || false}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    skipTheLine: {
                      ...prev.skipTheLine,
                      enabled: e.target.checked
                    }
                  }))}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="skipTheLineEnabled" className="ms-2 text-sm font-semibold text-gray-700">
                  {t('operator.product_form.skip_the_line_enable')}
                </label>
              </div>
              
              {formData.skipTheLine?.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.skip_the_line_type')}</label>
                    <select
                      value={formData.skipTheLine?.type || 'Fast Track'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        skipTheLine: {
                          ...prev.skipTheLine,
                          type: e.target.value
                        }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Fast Track">{t('operator.product_form.skip_type_fast_track')}</option>
                      <option value="VIP">{t('operator.product_form.skip_type_vip')}</option>
                      <option value="Early Access">{t('operator.product_form.skip_type_early_access')}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('operator.product_form.skip_additional_price')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.skipTheLine?.additionalPrice || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        skipTheLine: {
                          ...prev.skipTheLine,
                          additionalPrice: Number(e.target.value) || 0
                        }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.description_label')}</label>
                    <textarea
                      value={formData.skipTheLine?.description || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        skipTheLine: {
                          ...prev.skipTheLine,
                          description: e.target.value
                        }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      rows="2"
                      placeholder={t('operator.product_form.skip_description_placeholder')}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('operator.product_form.cancellation_title')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('operator.product_form.cancellation_type')}</label>
                <select
                  value={formData.cancellationPolicy?.type || 'moderate'}
                  onChange={(e) => {
                    const policyType = e.target.value;
                    let defaultPolicy = {
                      type: policyType,
                      freeCancellationHours: 24,
                      refundPercentage: 100,
                      description: '',
                    };

                    switch (policyType) {
                      case 'free':
                        defaultPolicy.freeCancellationHours = 24;
                        defaultPolicy.refundPercentage = 100;
                        defaultPolicy.description = t('operator.product_form.cancellation_default_free');
                        break;
                      case 'moderate':
                        defaultPolicy.freeCancellationHours = 48;
                        defaultPolicy.refundPercentage = 100;
                        defaultPolicy.description = t('operator.product_form.cancellation_default_moderate');
                        break;
                      case 'strict':
                        defaultPolicy.freeCancellationHours = 168; // 7 days
                        defaultPolicy.refundPercentage = 100;
                        defaultPolicy.description = t('operator.product_form.cancellation_default_strict');
                        break;
                      case 'non_refundable':
                        defaultPolicy.freeCancellationHours = 0;
                        defaultPolicy.refundPercentage = 0;
                        defaultPolicy.description = t('operator.product_form.cancellation_default_non_refundable');
                        break;
                    }

                    setFormData(prev => ({
                      ...prev,
                      cancellationPolicy: {
                        ...prev.cancellationPolicy,
                        ...defaultPolicy,
                      }
                    }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="free">{t('operator.product_form.cancellation_free')}</option>
                  <option value="moderate">{t('operator.product_form.cancellation_moderate')}</option>
                  <option value="strict">{t('operator.product_form.cancellation_strict')}</option>
                  <option value="non_refundable">{t('operator.product_form.cancellation_non_refundable')}</option>
                </select>
              </div>

              {formData.cancellationPolicy?.type !== 'non_refundable' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('operator.product_form.cancellation_hours')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.cancellationPolicy?.freeCancellationHours || 24}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          cancellationPolicy: {
                            ...prev.cancellationPolicy,
                            freeCancellationHours: parseInt(e.target.value) || 0,
                          }
                        }));
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('operator.product_form.cancellation_refund_percent')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.cancellationPolicy?.refundPercentage || 100}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          cancellationPolicy: {
                            ...prev.cancellationPolicy,
                            refundPercentage: parseInt(e.target.value) || 0,
                          }
                        }));
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t('operator.product_form.cancellation_description_optional')}
                </label>
                <textarea
                  value={formData.cancellationPolicy?.description || ''}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      cancellationPolicy: {
                        ...prev.cancellationPolicy,
                        description: e.target.value,
                      }
                    }));
                  }}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder={t('operator.product_form.cancellation_description_placeholder')}
                />
              </div>
            </div>
          </div>

          {/* Time Slots */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('operator.product_form.time_slots_title')}</h3>
            <div className="space-y-3">
              {Array.isArray(formData.timeSlots) && formData.timeSlots.map((slot, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">{t('operator.product_form.time_slot_start')}</label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => {
                        const newSlots = [...formData.timeSlots];
                        newSlots[index] = { ...slot, startTime: e.target.value };
                        setFormData(prev => ({ ...prev, timeSlots: newSlots }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">{t('operator.product_form.time_slot_end')}</label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => {
                        const newSlots = [...formData.timeSlots];
                        newSlots[index] = { ...slot, endTime: e.target.value };
                        setFormData(prev => ({ ...prev, timeSlots: newSlots }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  {formData.timeSlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newSlots = formData.timeSlots.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, timeSlots: newSlots }));
                      }}
                      className="mt-6 text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, timeSlots: [...prev.timeSlots, { startTime: '09:00', endTime: '17:00' }] }));
                }}
                className="text-sm text-primary-700 font-bold hover:underline"
              >
                {t('operator.product_form.add_time_slot')}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/operator/products')}
              className="me-4 px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition"
            >
              {t('operator.common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-700 text-white px-8 py-2 rounded-lg font-bold hover:bg-primary-800 transition flex items-center"
            >
              {loading ? t('operator.common.saving') : (
                <>
                  <Save size={20} className="me-2" />
                  {t('operator.product_form.save_product')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <ScrollToTopButton />
    </div>
  );
};

export default OperatorProductFormPage;
