import React, { useState, useEffect, useRef, useCallback } from 'react';

interface PhotoGalleryProps {
  photos: string[];
  altPrefix?: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, altPrefix = 'Photo' }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    const openedFrom = lightboxIndex;
    setLightboxIndex(null);
    if (openedFrom !== null) {
      // Restore focus to the tile that opened the lightbox (mapped to visible tile index)
      const visibleIndex = openedFrom < 4 ? openedFrom : 3;
      setTimeout(() => triggerRefs.current[visibleIndex]?.focus(), 0);
    }
  }, [lightboxIndex]);

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null));
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null));
  }, [photos.length]);

  // ESC to close, arrow keys to navigate
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxIndex, closeLightbox, goNext, goPrev]);

  // Move focus into modal when it opens
  useEffect(() => {
    if (lightboxIndex !== null) {
      setTimeout(() => closeButtonRef.current?.focus(), 0);
    }
  }, [lightboxIndex !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!photos || photos.length === 0) return null;

  const visibleCount = Math.min(photos.length, 4);
  const overflow = photos.length - 4;

  return (
    <>
      <div className="grid grid-cols-2 gap-2" style={{ maxWidth: '100%' }}>
        {Array.from({ length: visibleCount }).map((_, i) => {
          const isOverflowTile = i === 3 && overflow > 0;
          return (
            <button
              key={i}
              ref={(el) => { triggerRefs.current[i] = el; }}
              type="button"
              onClick={() => openLightbox(i)}
              className="relative aspect-square rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light-blue focus-visible:ring-offset-2"
              aria-label={isOverflowTile ? `View all ${photos.length} photos` : `${altPrefix} ${i + 1}`}
            >
              <img
                src={photos[i]}
                alt={`${altPrefix} ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {isOverflowTile && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">+{overflow + 1} more</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close lightbox"
          >
            ×
          </button>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 text-white/80 hover:text-white text-4xl leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white p-2"
              aria-label="Previous photo"
            >
              ‹
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-3xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIndex]}
              alt={`${altPrefix} ${lightboxIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Next */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 text-white/80 hover:text-white text-4xl leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white p-2"
              aria-label="Next photo"
            >
              ›
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoGallery;
