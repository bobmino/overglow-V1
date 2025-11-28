import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Save, Image as ImageIcon, X } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const OperatorProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Tours',
    city: '',
    address: '',
    duration: '',
    price: '',
    images: [],
    highlights: [''],
    included: [''],
    requirements: [''],
    requiresInquiry: false,
    inquiryType: 'none',
    timeSlots: [{ startTime: '09:00', endTime: '17:00' }],
    status: 'Draft'
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await axios.get(`/api/products/${id}`);
      
      setFormData(prev => ({
        ...prev,
        title: data.title || '',
        description: data.description || '',
        category: data.category || 'Tours',
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
        status: data.status || 'Draft'
      }));

      setError('');
    } catch (err) {
      console.error('Failed to fetch product details:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to fetch product details');
    }
  };

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

      const { data } = await axios.post('/api/upload', formData, config);
      setFormData(prev => ({ ...prev, images: [...prev.images, data] }));
      setUploading(false);
    } catch (error) {
      console.error(error);
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const numericPrice = Number(formData.price);

      if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        setError('Price must be a positive number greater than 0');
        setLoading(false);
        return;
      }

      if (formData.status === 'Published' && numericPrice <= 0) {
        setError('Published products require a price greater than 0');
        setLoading(false);
        return;
      }

      // Clean up empty array items before sending
      const cleanHighlights = formData.highlights.filter(item => item.trim() !== '');
      const cleanIncluded = formData.included.filter(item => item.trim() !== '');
      const cleanRequirements = formData.requirements.filter(item => item.trim() !== '');

      const payload = {
        ...formData,
        price: numericPrice,
        highlights: cleanHighlights.length > 0 ? cleanHighlights : [],
        included: cleanIncluded.length > 0 ? cleanIncluded : [],
        requirements: cleanRequirements.length > 0 ? cleanRequirements : [],
        // Ensure timeSlots is always an array with valid format
        timeSlots: Array.isArray(formData.timeSlots) && formData.timeSlots.length > 0 
          ? formData.timeSlots.filter(slot => 
              slot && 
              slot.startTime && 
              slot.endTime &&
              typeof slot.startTime === 'string' &&
              typeof slot.endTime === 'string'
            )
          : [],
        // Ensure inquiryType is set correctly
        inquiryType: formData.requiresInquiry ? formData.inquiryType : 'none',
      };

      let response;
      if (isEditMode) {
        response = await axios.put(`/api/products/${id}`, payload);
      } else {
        response = await axios.post('/api/products', payload);
      }
      
      // Clear error on success
      setError('');
      navigate('/operator/products');
    } catch (err) {
      console.error('Save product error:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error ||
                          err.response?.data?.errors?.[0]?.msg || 
                          err.message ||
                          'Failed to save product';
      setError(errorMessage);
      setLoading(false);
      // Don't navigate away on error so user can fix and retry without losing data
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Product' : 'Create New Product'}
          </h1>
          <DashboardNavBar />
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
              <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
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
              <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="Tours">Tours</option>
                <option value="Activities">Activities</option>
                <option value="Tickets">Tickets</option>
                <option value="Rentals">Rentals</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
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
              <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. 123 Main St"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g. 2 hours"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Price (€)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the final price per person. Required to publish the product.
              </p>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              ></textarea>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Images</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {formData.images.map((img, index) => (
                <div key={index} className="relative group">
                  <img src={img} alt={`Product ${index}`} className="w-full h-24 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = formData.images.filter((_, i) => i !== index);
                      setFormData(prev => ({ ...prev, images: newImages }));
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center h-24 cursor-pointer hover:border-green-500 transition">
                <ImageIcon className="text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">{uploading ? 'Uploading...' : 'Add Image'}</span>
                <input type="file" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Dynamic Lists */}
          {['highlights', 'included', 'requirements'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-bold text-gray-700 mb-2 capitalize">{field}</label>
              {formData[field].map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayChange(index, e.target.value, field)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem(index, field)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem(field)}
                className="text-sm text-green-700 font-bold hover:underline"
              >
                + Add {field.slice(0, -1)}
              </button>
            </div>
          ))}

          {/* Inquiry Settings */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Paramètres d'inquiry</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiresInquiry"
                  checked={formData.requiresInquiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, requiresInquiry: e.target.checked, inquiryType: e.target.checked ? 'manual' : 'none' }))}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="requiresInquiry" className="ml-2 text-sm font-semibold text-gray-700">
                  Ce produit nécessite une inquiry
                </label>
              </div>
              
              {formData.requiresInquiry && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Type d'inquiry</label>
                  <select
                    name="inquiryType"
                    value={formData.inquiryType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="none">Aucune</option>
                    <option value="manual">Manuelle (Q&A)</option>
                    <option value="automatic">Automatique (validation requise)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Time Slots */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Plages horaires</h3>
            <div className="space-y-3">
              {formData.timeSlots.map((slot, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Début</label>
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
                    <label className="block text-xs text-gray-600 mb-1">Fin</label>
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
                className="text-sm text-green-700 font-bold hover:underline"
              >
                + Ajouter une plage horaire
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/operator/products')}
              className="mr-4 px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-700 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-800 transition flex items-center"
            >
              {loading ? 'Saving...' : (
                <>
                  <Save size={20} className="mr-2" />
                  Save Product
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
