import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { SITE_IMAGES } from '../assets/siteImages';
import { fetchGalleryItems } from '../services/galleryService';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Portfolio' },
  { id: 'hair', label: 'Hair' },
  { id: 'nails', label: 'Nails' },
];

const STATIC_GALLERY_ITEMS = SITE_IMAGES.gallery;

function GalleryCard({ item, index, onOpen }) {
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -6% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [item.id]);

  return (
    <div
      ref={cardRef}
      onClick={onOpen}
      className={`gallery-item-card gallery-item-reveal${isVisible ? ' gallery-item-visible' : ''}`}
      style={{ '--reveal-delay': `${Math.min(index, 8) * 0.08}s` }}
    >
      <div className="gallery-item-media">
        <img
          src={item.image}
          alt={item.title}
          className="gallery-img"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="gallery-shine" aria-hidden="true" />

        <div className="gallery-overlay">
          <div className="gallery-overlay-icon">
            <Eye size={16} />
          </div>
          <h3 className="gallery-overlay-title">{item.title}</h3>
          {item.desc && <p className="gallery-overlay-desc">{item.desc}</p>}
        </div>
      </div>

      <div className="gallery-item-caption">
        <h3>{item.title}</h3>
        {item.desc && <p>{item.desc}</p>}
      </div>
    </div>
  );
}

export default function Gallery() {
  const [filter, setFilter] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [slideDirection, setSlideDirection] = useState(0);
  const [dynamicItems, setDynamicItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const touchStartX = useRef(null);

  // Fetch admin-uploaded images from Google Sheets / Drive
  useEffect(() => {
    let cancelled = false;
    setGalleryLoading(true);
    fetchGalleryItems()
      .then((items) => {
        if (!cancelled) {
          // Normalise dynamic items to match gallery shape
          const normalised = items.map((item) => ({
            id: `dyn-${item.id}`,
            type: item.type || 'hair',
            title: item.title || '',
            desc: item.desc || '',
            image: item.image,
          }));
          setDynamicItems(normalised);
        }
      })
      .catch(() => {
        // Silently fall back to static images only
      })
      .finally(() => {
        if (!cancelled) setGalleryLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Dynamic items first, then static originals
  const ALL_ITEMS = [...dynamicItems, ...STATIC_GALLERY_ITEMS];

  const filteredItems = filter === 'all'
    ? ALL_ITEMS
    : ALL_ITEMS.filter(item => item.type === filter);

  const openLightbox = (index) => {
    setSlideDirection(0);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setSlideDirection(0);
  };

  const handleFilterChange = (nextFilter) => {
    if (nextFilter === filter) return;
    setFilter(nextFilter);
  };

  const wrapIndex = useCallback((index) => {
    const len = filteredItems.length;
    if (len === 0) return 0;
    return ((index % len) + len) % len;
  }, [filteredItems.length]);

  const goNext = useCallback(() => {
    setSlideDirection(1);
    setLightboxIndex((prevIndex) => wrapIndex(prevIndex + 1));
  }, [wrapIndex]);

  const goPrev = useCallback(() => {
    setSlideDirection(-1);
    setLightboxIndex((prevIndex) => wrapIndex(prevIndex - 1));
  }, [wrapIndex]);

  const hasMultipleItems = filteredItems.length > 1;

  const showNext = (e) => {
    e?.stopPropagation?.();
    goNext();
  };

  const showPrev = (e) => {
    e?.stopPropagation?.();
    goPrev();
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null || !hasMultipleItems) return;

    const delta = event.changedTouches[0].clientX - touchStartX.current;
    if (delta > 55) goPrev();
    if (delta < -55) goNext();
    touchStartX.current = null;
  };

  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxIndex]);

  useEffect(() => {
    setLightboxIndex(null);
    setSlideDirection(0);
  }, [filter]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKeyDown = (event) => {
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrev();
      if (event.key === 'Escape') closeLightbox();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, goNext, goPrev]);

  const lightboxMotionClass = slideDirection > 0
    ? 'lightbox-image--next'
    : slideDirection < 0
      ? 'lightbox-image--prev'
      : 'lightbox-image--enter';

  const currentItem = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;
  const prevItem = lightboxIndex !== null ? filteredItems[wrapIndex(lightboxIndex - 1)] : null;
  const nextItem = lightboxIndex !== null ? filteredItems[wrapIndex(lightboxIndex + 1)] : null;

  return (
    <div className="animate-fade-in page-padding gallery-page">
      <div className="container">
        {/* Page Header */}
        <div className="section-header">
          <span className="section-subtitle">Visual Inspiration</span>
          <h2 className="section-title">Our Work Gallery</h2>
          <p className="section-desc">
            Real transformations created by our master stylists and artists. Discover your next look in our portfolio.
          </p>
        </div>

        {/* Filter Navigation */}
        <div className="gallery-filters gallery-filters-reveal">
          {FILTER_OPTIONS.map((opt, index) => (
            <button
              key={opt.id}
              onClick={() => handleFilterChange(opt.id)}
              className={`gallery-tab-btn${filter === opt.id ? ' active' : ''}`}
              style={{ '--tab-delay': `${index * 0.08}s` }}
            >
              <span className="gallery-tab-label">{opt.label}</span>
              {filter === opt.id && <span className="gallery-tab-glow" aria-hidden="true" />}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        {galleryLoading && dynamicItems.length === 0 && (
          <p className="gallery-loading-hint">Loading latest uploads&hellip;</p>
        )}
        <div className="gallery-grid" key={filter}>
          {filteredItems.map((item, index) => (
            <GalleryCard
              key={item.id}
              item={item}
              index={index}
              onOpen={() => openLightbox(index)}
            />
          ))}
        </div>

        {/* Full Immersive Lightbox Modal */}
        {lightboxIndex !== null && currentItem && createPortal(
          <div 
            className="lightbox-overlay lightbox-overlay--open"
            onClick={closeLightbox}
          >
            <div className="lightbox-top-bar" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={closeLightbox}
                className="lightbox-back-btn"
                aria-label="Back to gallery"
              >
                <ArrowLeft size={18} />
                <span className="lightbox-back-label-full">Back to Gallery</span>
                <span className="lightbox-back-label-short">Back</span>
              </button>
              <button 
                onClick={closeLightbox}
                className="lightbox-close-btn"
                aria-label="Close gallery preview"
              >
                <X size={22} />
              </button>
            </div>

            <div 
              className="lightbox-stage lightbox-stage--open"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="lightbox-desktop-nav lightbox-desktop-nav--prev">
                {hasMultipleItems && (
                  <button 
                    onClick={showPrev}
                    className="lightbox-nav-btn lightbox-nav-prev"
                    aria-label="Previous image"
                  >
                    <span className="lightbox-nav-ring" aria-hidden="true" />
                    <span className="lightbox-nav-ring lightbox-nav-ring--delay" aria-hidden="true" />
                    <ChevronLeft size={26} className="lightbox-nav-icon" />
                  </button>
                )}
              </div>

              <div className={`lightbox-triple-view${hasMultipleItems ? '' : ' lightbox-triple-view--single'}`}>
                {hasMultipleItems && prevItem && (
                  <button
                    type="button"
                    className="lightbox-preview lightbox-preview--prev"
                    onClick={showPrev}
                    aria-label={`Previous: ${prevItem.title}`}
                  >
                    <img src={prevItem.image} alt="" referrerPolicy="no-referrer" />
                    <span className="lightbox-preview-label">Previous</span>
                  </button>
                )}

                <div 
                  className="lightbox-main-frame" 
                  key={`frame-${lightboxIndex}`}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {hasMultipleItems && (
                    <>
                      <button
                        type="button"
                        className="lightbox-mobile-nav lightbox-mobile-nav--prev"
                        onClick={showPrev}
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={22} />
                      </button>
                      <button
                        type="button"
                        className="lightbox-mobile-nav lightbox-mobile-nav--next"
                        onClick={showNext}
                        aria-label="Next image"
                      >
                        <ChevronRight size={22} />
                      </button>
                    </>
                  )}
                  <img 
                    key={`${lightboxIndex}-${slideDirection}`}
                    src={currentItem.image} 
                    alt={currentItem.title}
                    className={`lightbox-image ${lightboxMotionClass}`}
                    referrerPolicy="no-referrer"
                  />
                </div>

                {hasMultipleItems && nextItem && (
                  <button
                    type="button"
                    className="lightbox-preview lightbox-preview--next"
                    onClick={showNext}
                    aria-label={`Next: ${nextItem.title}`}
                  >
                    <img src={nextItem.image} alt="" referrerPolicy="no-referrer" />
                    <span className="lightbox-preview-label">Next</span>
                  </button>
                )}
              </div>

              <div className="lightbox-desktop-nav lightbox-desktop-nav--next">
                {hasMultipleItems && (
                  <button 
                    onClick={showNext}
                    className="lightbox-nav-btn lightbox-nav-next"
                    aria-label="Next image"
                  >
                    <span className="lightbox-nav-ring" aria-hidden="true" />
                    <span className="lightbox-nav-ring lightbox-nav-ring--delay" aria-hidden="true" />
                    <ChevronRight size={26} className="lightbox-nav-icon" />
                  </button>
                )}
              </div>
            </div>

            {hasMultipleItems && prevItem && nextItem && (
              <div 
                className="lightbox-mobile-strip"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="lightbox-mobile-thumb"
                  onClick={showPrev}
                  aria-label={`Previous: ${prevItem.title}`}
                >
                  <img src={prevItem.image} alt="" referrerPolicy="no-referrer" />
                  <span>Prev</span>
                </button>
                <span className="lightbox-mobile-counter">
                  {lightboxIndex + 1} / {filteredItems.length}
                </span>
                <button
                  type="button"
                  className="lightbox-mobile-thumb"
                  onClick={showNext}
                  aria-label={`Next: ${nextItem.title}`}
                >
                  <img src={nextItem.image} alt="" referrerPolicy="no-referrer" />
                  <span>Next</span>
                </button>
              </div>
            )}

            <div 
              className="lightbox-details lightbox-details--open"
              onClick={(e) => e.stopPropagation()}
              key={`details-${lightboxIndex}`}
            >
              {hasMultipleItems && (
                <span className="lightbox-counter lightbox-counter--desktop">
                  {lightboxIndex + 1} / {filteredItems.length}
                </span>
              )}
              <h3>{currentItem.title}</h3>
              {currentItem.desc && <p className="lightbox-desc">{currentItem.desc}</p>}
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
