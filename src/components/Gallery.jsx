import React, { useState } from 'react';
import { Eye, X, ZoomIn, Info } from 'lucide-react';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Portfolio' },
  { id: 'haircut', label: 'Haircuts' },
  { id: 'coloring', label: 'Hair Coloring' },
  { id: 'makeup', label: 'Bridal Makeup' },
  { id: 'interior', label: 'Salon Interior' },
];

const GALLERY_ITEMS = [
  {
    id: 1,
    type: 'haircut',
    title: 'Precision Textured Cut',
    desc: 'Modern chic haircut with wispy face-framing layers and blowout.',
    image: '/images/gallery_haircut.png'
  },
  {
    id: 2,
    type: 'coloring',
    title: 'Sunset Balayage & Highlights',
    desc: 'Warm dimensional copper and gold hues blended into dark chestnut hair.',
    image: '/images/gallery_coloring.png'
  },
  {
    id: 3,
    type: 'makeup',
    title: 'Royal Bridal Glow',
    desc: 'Luxurious dewy finish with soft glam eyes and sophisticated nude lips.',
    image: '/images/gallery_makeup.png'
  },
  {
    id: 4,
    type: 'interior',
    title: 'Azora Washing & Styling Spa',
    desc: 'Ambient lighting and modern leather wash basins for ultimate scalp pampering.',
    image: '/images/gallery_interior.png'
  }
];

export default function Gallery() {
  const [filter, setFilter] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const filteredItems = filter === 'all' 
    ? GALLERY_ITEMS 
    : GALLERY_ITEMS.filter(item => item.type === filter);

  const openLightbox = (index) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const showNext = (e) => {
    e.stopPropagation();
    setLightboxIndex((prevIndex) => 
      prevIndex === filteredItems.length - 1 ? 0 : prevIndex + 1
    );
  };

  const showPrev = (e) => {
    e.stopPropagation();
    setLightboxIndex((prevIndex) => 
      prevIndex === 0 ? filteredItems.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="animate-fade-in page-padding">
      <div className="container">
        {/* Page Header */}
        <div className="section-header">
          <span className="section-subtitle">Visual Inspiration</span>
          <h2 className="section-title">Our Work Gallery</h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '600px', margin: '1.5rem auto 0', fontSize: '1rem' }}>
            Real transformations created by our master stylists and artists. Discover your next look in our high-end style portfolio.
          </p>
        </div>

        {/* Filter Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '4rem'
        }}>
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              style={{
                padding: '0.6rem 1.4rem',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: '500',
                cursor: 'pointer',
                backgroundColor: filter === opt.id ? 'var(--color-primary)' : 'transparent',
                color: filter === opt.id ? 'var(--color-text-dark)' : 'var(--color-text-muted)',
                border: '1px solid',
                borderColor: filter === opt.id ? 'var(--color-primary)' : 'var(--color-border)',
                transition: 'var(--transition-fast)',
                borderRadius: '0'
              }}
              className="gallery-tab-btn"
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '2.5rem',
        }} className="gallery-grid-mobile">
          {filteredItems.map((item, index) => (
            <div 
              key={item.id}
              onClick={() => openLightbox(index)}
              style={{
                position: 'relative',
                height: '420px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                boxShadow: 'var(--shadow-sm)'
              }}
              className="gallery-item-card"
            >
              <img 
                src={item.image} 
                alt={item.title} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'var(--transition-smooth)'
                }}
                className="gallery-img"
              />

              {/* Hover Overlay */}
              <div 
                className="gallery-overlay"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '2rem',
                  opacity: 0,
                  transition: 'var(--transition-smooth)',
                  textAlign: 'center'
                }}
              >
                <div style={{ 
                  color: 'var(--color-primary)', 
                  marginBottom: '1rem',
                  border: '1px solid var(--color-primary)',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Eye size={20} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '0.5rem' }}>
                  {item.title}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', maxWidth: '300px' }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Full Immersive Lightbox Modal */}
        {lightboxIndex !== null && (
          <div 
            className="lightbox-overlay"
            onClick={closeLightbox}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              zIndex: 2000,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '2rem'
            }}
          >
            {/* Close Button */}
            <button 
              onClick={closeLightbox}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '0.5rem',
                zIndex: 10
              }}
            >
              <X size={32} />
            </button>

            {/* Slider container */}
            <div 
              style={{
                position: 'relative',
                maxWidth: '900px',
                width: '100%',
                height: '70vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Prev Button */}
              <button 
                onClick={showPrev}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  background: 'rgba(22, 22, 22, 0.6)',
                  border: '1px solid var(--color-border)',
                  color: '#fff',
                  width: '50px',
                  height: '50px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  zIndex: 5
                }}
                className="lightbox-nav-btn"
              >
                &#10094;
              </button>

              <img 
                src={filteredItems[lightboxIndex].image} 
                alt={filteredItems[lightboxIndex].title}
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  border: '1px solid var(--color-border)'
                }}
              />

              {/* Next Button */}
              <button 
                onClick={showNext}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  background: 'rgba(22, 22, 22, 0.6)',
                  border: '1px solid var(--color-border)',
                  color: '#fff',
                  width: '50px',
                  height: '50px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  zIndex: 5
                }}
                className="lightbox-nav-btn"
              >
                &#10095;
              </button>
            </div>

            {/* Details panel below image */}
            <div 
              style={{
                marginTop: '1.5rem',
                textAlign: 'center',
                maxWidth: '600px',
                color: '#fff'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                {filteredItems[lightboxIndex].title}
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem' }}>
                {filteredItems[lightboxIndex].desc}
              </p>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .gallery-grid-mobile {
            grid-template-columns: 1fr !important;
          }
          .gallery-item-card {
            height: 320px !important;
          }
        }
        .gallery-tab-btn:hover {
          color: var(--color-primary) !important;
          border-color: var(--color-primary) !important;
        }
        .gallery-item-card:hover .gallery-overlay {
          opacity: 1 !important;
        }
        .gallery-item-card:hover .gallery-img {
          transform: scale(1.06);
        }
        .lightbox-nav-btn {
          transition: var(--transition-fast);
        }
        .lightbox-nav-btn:hover {
          background-color: var(--color-primary) !important;
          color: var(--color-text-dark) !important;
          border-color: var(--color-primary) !important;
        }
      `}} />
    </div>
  );
}
