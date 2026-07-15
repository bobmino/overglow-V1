import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Calendar, Clock, MapPin, CheckCircle, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatImageUrl } from '../utils/formatImage';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const CartDrawer = () => {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const totalPrice = cartItems.reduce((acc, item) => acc + (item.priceBreakdown?.subtotal || 0), 0);
  const isRTL = i18n.language === 'ar';

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Drawer Container */}
          <Motion.div
            initial={{ x: isRTL ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 end-0 max-w-md w-full bg-white/90 backdrop-blur-md shadow-2xl border-s border-white/20 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white/80">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-slate-800">
                  {t('cart.title', 'Mon Panier')} ({cartItems.length})
                </h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100/80 active:scale-95 transition-all text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center shadow-inner">
                    <span className="text-3xl">🛒</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{t('cart.empty', 'Votre panier est vide')}</h3>
                    <p className="text-slate-500 text-sm mt-1">
                      {t('cart.empty_subtitle', 'Découvrez nos expériences incroyables et ajoutez-les ici.')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('/');
                    }}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all text-sm"
                  >
                    {t('cart.explore', 'Explorer')}
                  </button>
                </div>
              ) : (
                cartItems.map((item) => {
                  const fallbackImage = '/images/placeholder.webp';
                  const image = item.product?.images?.[0] ? formatImageUrl(item.product.images[0]) : fallbackImage;

                  return (
                    <Motion.div
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      key={item.id}
                      className="flex gap-4 p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm relative group hover:shadow-md transition-all duration-300"
                    >
                      <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 shadow-sm">
                        <img
                          src={image}
                          alt={item.product?.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-550"
                          onError={(e) => {
                            e.target.src = fallbackImage;
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex justify-between items-start mb-1.5">
                          <h4 className="font-bold text-slate-800 text-sm truncate pe-6">
                            {item.product?.title}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="absolute top-4 end-4 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 p-1.5 rounded-lg transition-colors border border-slate-100"
                            aria-label={t('cart.remove', 'Supprimer')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{item.product?.city}</span>
                          </div>
                          {item.schedule?.date && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{new Date(item.schedule.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR')}</span>
                            </div>
                          )}
                          {item.schedule?.time && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{item.schedule.time}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2 flex items-center justify-between border-t border-slate-50">
                          <span className="text-xs font-semibold bg-slate-100/80 px-2 py-1 rounded-lg text-slate-600">
                            {item.numberOfTickets} × {t('cart.tickets', 'Billet(s)')}
                          </span>
                          <span className="font-extrabold text-emerald-600 text-sm">
                            {formatPrice(item.priceBreakdown?.subtotal || 0)}
                          </span>
                        </div>
                      </div>
                    </Motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="p-5 border-t border-slate-100 bg-white/90 backdrop-blur-md">
                <div className="flex justify-between items-end mb-5">
                  <span className="text-slate-500 font-semibold text-sm">{t('cart.total', 'Total')}</span>
                  <div className="text-end">
                    <span className="text-2xl font-black text-slate-800 block leading-tight">
                      {formatPrice(totalPrice)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{t('cart.taxes_included', 'Taxes incluses')}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5"
                >
                  <CheckCircle className="w-5 h-5" />
                  {t('cart.checkout', 'Valider la commande')}
                </button>
              </div>
            )}
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
