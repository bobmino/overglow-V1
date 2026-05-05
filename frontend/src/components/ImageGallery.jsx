import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2, Image as ImageIcon } from 'lucide-react';

const ImageGallery = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const galleryRef = useRef(null);
  
  const displayImages = images && images.length > 0 
    ? images 
    : ['https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=1200'];

  const minSwipeDistance = 50;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) goToNext();
    if (distance < -minSwipeDistance) goToPrevious();
  };

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setIsLightboxOpen(true);
  };

  return (
    <>
      {/* Mobile Swipeable Gallery */}
      <div className="md:hidden space-y-4">
        <div 
          ref={galleryRef}
          className="relative h-72 rounded-xl overflow-hidden bg-gray-100 touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img 
            src={displayImages[currentIndex]} 
            alt={`Product image ${currentIndex + 1}`}
            loading="lazy"
            className="w-full h-full object-cover select-none cursor-pointer"
            draggable={false}
            onClick={() => openLightbox(currentIndex)}
          />
          
          {displayImages.length > 1 && (
            <>
              <button onClick={goToPrevious} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full shadow hover:bg-white"><ChevronLeft size={20} /></button>
              <button onClick={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full shadow hover:bg-white"><ChevronRight size={20} /></button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5">
                {displayImages.map((_, index) => (
                  <button key={index} onClick={() => setCurrentIndex(index)} className={`w-1.5 h-1.5 rounded-full transition ${index === currentIndex ? 'bg-white w-4' : 'bg-white/60'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Desktop Airbnb Grid */}
      <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[450px] lg:h-[500px] rounded-2xl overflow-hidden relative group">
        <div className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden" onClick={() => openLightbox(0)}>
          <img src={displayImages[0]} className="w-full h-full object-cover transition duration-500 hover:brightness-90 hover:scale-[1.02]" alt="Main" />
        </div>
        
        {displayImages.slice(1, 5).map((img, idx) => (
          <div key={idx} className="relative cursor-pointer overflow-hidden" onClick={() => openLightbox(idx + 1)}>
            <img src={img} className="w-full h-full object-cover transition duration-500 hover:brightness-90 hover:scale-[1.02]" alt={`Gallery ${idx + 1}`} />
          </div>
        ))}
        
        {displayImages.length > 5 && (
          <button 
            onClick={() => openLightbox(0)}
            className="absolute bottom-6 right-6 bg-white px-5 py-2.5 rounded-xl font-medium text-sm text-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-slate-200 hover:bg-slate-50 flex items-center gap-2 transition-transform hover:scale-105"
          >
            <ImageIcon size={18} strokeWidth={1.5} />
            Afficher toutes les photos
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
