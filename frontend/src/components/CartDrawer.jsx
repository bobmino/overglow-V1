import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatImageUrl } from '../utils/formatImage';

const CartDrawer = () => {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const totalPrice = cartItems.reduce((acc, item) => acc + (item.priceBreakdown?.subtotal || 0), 0);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-xl z-50 flex flex-col transform transition-transform">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Mon Panier ({cartItems.length})</h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
                <span className="text-4xl">🛒</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Votre panier est vide</h3>
              <p className="text-gray-500 text-sm">Découvrez nos expériences incroyables et ajoutez-les ici.</p>
              <button 
                onClick={() => { setIsCartOpen(false); navigate('/'); }}
                className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
              >
                Explorer
              </button>
            </div>
          ) : (
            cartItems.map((item) => {
              const fallbackImage = 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
              const image = item.product?.images?.[0] ? formatImageUrl(item.product.images[0]) : fallbackImage;
              
              return (
                <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 relative group">
                  <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-200">
                    <img 
                      src={image} 
                      alt={item.product?.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = fallbackImage; }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-gray-900 text-sm truncate pr-6">{item.product?.title}</h4>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="absolute top-3 right-3 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        <span className="truncate">{item.product?.city}</span>
                      </div>
                      {item.schedule?.date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                          <span>{new Date(item.schedule.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                      {item.schedule?.time && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                          <span>{item.schedule.time}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <span className="text-xs font-medium bg-white px-2 py-1 rounded text-gray-700 border border-gray-200">
                        {item.numberOfTickets}x Billet(s)
                      </span>
                      <span className="font-bold text-emerald-600 text-sm">
                        {formatPrice(item.priceBreakdown?.subtotal || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex justify-between items-end mb-4">
              <span className="text-gray-600 font-medium">Total</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-emerald-600 block">{formatPrice(totalPrice)}</span>
                <span className="text-xs text-gray-400">Taxes incluses</span>
              </div>
            </div>
            
            <button
              onClick={handleCheckout}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-lg shadow-[0_8px_20px_-6px_rgba(5,150,105,0.4)] transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Valider la commande
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
