import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

const ImageGallery = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  const displayImages = images && images.length > 0 
    ? images 
    : ['https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=1200'];

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setIsLightboxOpen(true);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* Static Hero Grid (Airbnb/Viator style) */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] rounded-2xl overflow-hidden relative group">
        <div className="col-span-4 row-span-2 md:col-span-2 md:row-span-2 relative cursor-pointer overflow-hidden" onClick={() => openLightbox(0)}>
          <img src={displayImages[0]} className="w-full h-full object-cover transition duration-500 hover:brightness-90 hover:scale-[1.02]" alt="Main" />
        </div>
        
        {displayImages.slice(1, 5).map((img, idx) => (
          <div key={idx} className="hidden md:block relative cursor-pointer overflow-hidden" onClick={() => openLightbox(idx + 1)}>
            <img src={img} className="w-full h-full object-cover transition duration-500 hover:brightness-90 hover:scale-[1.02]" alt={`Gallery ${idx + 1}`} />
          </div>
        ))}
        
        {displayImages.length > 5 && (
          <button 
            onClick={() => openLightbox(0)}
            className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-white px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-medium text-sm text-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-slate-200 hover:bg-slate-50 flex items-center gap-2 transition-transform hover:scale-105"
          >
            <ImageIcon size={18} strokeWidth={1.5} />
            <span className="hidden sm:inline">Afficher toutes les photos</span>
            <span className="sm:hidden">Plus</span>
          </button>
        )}
        {displayImages.length <= 5 && displayImages.length > 1 && (
           <button 
            onClick={() => openLightbox(0)}
            className="absolute bottom-4 right-4 md:hidden bg-white px-4 py-2 rounded-xl font-medium text-sm text-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-slate-200 hover:bg-slate-50 flex items-center gap-2 transition-transform hover:scale-105"
          >
            <ImageIcon size={18} strokeWidth={1.5} />
            <span>Plus de photos</span>
          </button>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setIsLightboxOpen(false)}>
          <button onClick={() => setIsLightboxOpen(false)} className="absolute top-6 right-6 text-white p-2 hover:bg-white/20 rounded-full transition"><X size={28} /></button>
          <div className="relative max-w-7xl max-h-full flex items-center justify-center w-full">
            <img 
              src={displayImages[currentIndex]} 
              alt={`Product image ${currentIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {displayImages.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); goToPrevious(); }} className="absolute left-4 md:left-10 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition"><ChevronLeft size={32} /></button>
                <button onClick={(e) => { e.stopPropagation(); goToNext(); }} className="absolute right-4 md:right-10 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition"><ChevronRight size={32} /></button>
                <div className="absolute bottom-4 flex space-x-2">
                  {displayImages.map((_, index) => (
                    <button key={index} onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }} className={`h-1.5 rounded-full transition ${index === currentIndex ? 'bg-white w-8' : 'bg-white/40 w-2 hover:bg-white/60'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;
