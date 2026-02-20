import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize } from 'lucide-react';

interface PhotoGalleryProps {
  photos: string[];
  altPrefix?: string;
  className?: string;
}

export const PhotoGallery = ({ photos, altPrefix = 'Photo', className = '' }: PhotoGalleryProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, goToNext, goToPrev]);

  if (!photos || photos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No photos available
      </div>
    );
  }

  return (
    <>
      {/* Thumbnail Grid */}
      <div className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 ${className}`}>
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
            onClick={() => openLightbox(index)}
          >
            <img
              src={photo}
              alt={`${altPrefix} ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Maximize
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"
                size={20}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors z-10"
          >
            <X size={24} />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/70 text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full">
            {currentIndex + 1} / {photos.length}
          </div>

          {/* Previous Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-2 sm:left-4 p-2 sm:p-3 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors z-10"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Main Image */}
          <div
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[currentIndex]}
              alt={`${altPrefix} ${currentIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl"
            />
          </div>

          {/* Next Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 sm:right-4 p-2 sm:p-3 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors z-10"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      )}
    </>
  );
};
