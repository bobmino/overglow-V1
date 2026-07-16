import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { Trash2 as FiTrash2, Clock as FiClock, Calendar as FiCalendar, MapPin as FiMapPin, CheckCircle as FiCheckCircle } from 'lucide-react';
import { formatImageUrl } from '../utils/formatImage';

const CircuitPage = () => {
  const { t } = useTranslation();
  const { circuitItems, removeFromCircuit } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      // Rediriger vers login avec redirect vers /checkout avec isCircuit state
      navigate('/login', { state: { from: '/checkout', isCircuit: true } });
      return;
    }
    navigate('/checkout', { state: { isCircuit: true } });
  };

  const totalPrice = circuitItems.reduce((acc, item) => acc + (item.priceBreakdown?.subtotal || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('circuit.title')}</h1>
        
        {circuitItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-4">{t('circuit.empty_title')}</h2>
            <p className="text-gray-500 mb-8">{t('circuit.empty_body')}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              {t('circuit.discover')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {circuitItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col sm:flex-row relative transition-all hover:shadow-md">
                  <div className="sm:w-48 h-48 sm:h-auto bg-gray-200">
                    {item.product?.images?.[0] ? (
                      <img 
                        src={formatImageUrl(item.product.images[0])} 
                        alt={item.product.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                        {t('circuit.no_image')}
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 truncate max-w-[80%]">{item.product?.title}</h3>
                        <button 
                          onClick={() => removeFromCircuit(item.id)}
                          className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors"
                          aria-label={t('circuit.remove')}
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mt-2 mb-4">
                        <div className="flex items-center gap-2">
                          <FiMapPin className="w-4 h-4 text-primary-500" />
                          <span>{item.product?.city}</span>
                        </div>
                        {item.schedule?.date && (
                          <div className="flex items-center gap-2">
                            <FiCalendar className="w-4 h-4 text-primary-500" />
                            <span className="capitalize">{new Date(item.schedule.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          </div>
                        )}
                        {item.schedule?.time && (
                          <div className="flex items-center gap-2">
                            <FiClock className="w-4 h-4 text-primary-500" />
                            <span>{item.schedule.time}</span>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                          <span className="font-medium bg-gray-100 px-3 py-1 rounded-full text-gray-800">
                            {t('circuit.tickets', { count: item.numberOfTickets })}
                          </span>
                          {item.skipTheLine && (
                            <span className="flex items-center gap-1 font-medium text-primary-700 bg-primary-50 px-3 py-1 rounded-full">
                              <FiCheckCircle className="w-4 h-4" />
                              {t('circuit.skip_line')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-end mt-4">
                      <span className="text-2xl font-bold text-primary-600">
                        {formatPrice(item.priceBreakdown?.subtotal || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 border-t-4 border-primary-500">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{t('circuit.summary')}</h3>
                
                <div className="space-y-4 mb-8">
                  {circuitItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                      <span className="text-gray-800 font-medium mb-1 truncate">{item.product?.title}</span>
                      <div className="flex justify-between text-gray-500">
                        <span>{t('circuit.tickets', { count: item.numberOfTickets })}</span>
                        <span className="font-medium text-gray-900">{formatPrice(item.priceBreakdown?.subtotal || 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-100 pt-6 mb-8">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-lg font-bold text-gray-900">{t('circuit.total')}</span>
                    <span className="text-3xl font-bold text-primary-600">{formatPrice(totalPrice)}</span>
                  </div>
                  <p className="text-sm text-gray-500 text-end">{t('circuit.taxes_included')}</p>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-xl font-bold text-lg shadow-[0_8px_20px_-6px_rgba(5,150,105,0.4)] hover:shadow-[0_12px_25px_-8px_rgba(5,150,105,0.5)] transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  <FiCheckCircle className="w-6 h-6" />
                  {t('circuit.continue')}
                </button>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <FiCheckCircle className="w-4 h-4 text-primary-500" /> {t('circuit.secure_payment')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CircuitPage;
