import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Calendar, Phone, MessageCircle, Maximize2, X, Tag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SITE_IMAGES } from '../assets/siteImages';
import { getOfferConfig, fetchOfferFromSpreadsheet } from '../services/offerService';

export default function OfferSection({ onOpenBooking, onBookCombo, variant = 'full' }) {
  const [offerConfig, setOfferConfig] = useState(getOfferConfig);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Sync with live updates when admin edits offers & fetch latest on mount
  useEffect(() => {
    fetchOfferFromSpreadsheet();

    const handleOfferUpdate = (e) => {
      if (e?.detail) {
        setOfferConfig(e.detail);
      } else {
        setOfferConfig(getOfferConfig());
      }
    };

    window.addEventListener('azora-offer-updated', handleOfferUpdate);
    return () => window.removeEventListener('azora-offer-updated', handleOfferUpdate);
  }, []);

  const openZoom = () => setIsZoomOpen(true);
  const closeZoom = () => setIsZoomOpen(false);

  useEffect(() => {
    if (!isZoomOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeZoom();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomOpen]);

  if (!offerConfig.isActive) {
    return null;
  }

  const combos = Array.isArray(offerConfig.combos) && offerConfig.combos.length > 0 
    ? offerConfig.combos 
    : [];

  const offerImage = offerConfig.image || SITE_IMAGES.offers;
  const offerTitle = offerConfig.title || 'Navratri Special Offers';
  const offerBadge = offerConfig.badge || 'Festive Celebration Deals';
  const offerDesc = offerConfig.desc || 'Look Good · Feel Good · Celebrate You! Exclusive festive beauty combos, hair rituals, and luxury grooming packages at special celebration rates.';
  const offerDate = offerConfig.dateRange || 'Limited Time Festive Offer';
  const offerTags = Array.isArray(offerConfig.tags) ? offerConfig.tags : [];

  const handleComboClick = (combo) => {
    if (onBookCombo) {
      onBookCombo(combo);
    } else if (onOpenBooking) {
      onOpenBooking(combo.id || 'offer-combo');
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hi Azora Salon, I saw your "${offerTitle}" and would like to book an appointment!`
  );

  return (
    <section className={`azora-offer-section${variant === 'compact' ? ' azora-offer-section--compact' : ''}`}>
      <div className="azora-offer-container">
        {/* Section Header */}
        <div className="section-header azora-offer-header">
          {offerBadge && (
            <div className="azora-offer-badge-wrap">
              <span className="azora-offer-badge">
                <Sparkles size={15} />
                <span>{offerBadge}</span>
              </span>
            </div>
          )}

          <h2 className="section-title azora-offer-title">
            {offerTitle}
          </h2>

          {offerDesc && (
            <p className="section-desc azora-offer-desc">
              {offerDesc}
            </p>
          )}

          <div className="azora-offer-meta-pills">
            {offerDate && (
              <span className="azora-meta-pill">
                <Calendar size={14} /> {offerDate}
              </span>
            )}
            {offerTags.map((tag, idx) => (
              <span key={idx} className="azora-meta-pill">
                <Tag size={14} /> {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Main Offer Visual Showcase */}
        <div className="azora-offer-card glass-panel">
          <div 
            className="azora-offer-banner-wrap" 
            onClick={openZoom} 
            role="button" 
            tabIndex={0} 
            onKeyDown={(e) => e.key === 'Enter' && openZoom()}
            aria-label="Click to enlarge offer flyer"
          >
            <img
              src={offerImage}
              alt={offerTitle}
              className="azora-offer-banner-img"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className="azora-offer-banner-overlay" aria-hidden="true">
              <span className="azora-offer-zoom-btn">
                <Maximize2 size={16} /> Tap to View Full Template
              </span>
            </div>
            <div className="azora-offer-card-glow" aria-hidden="true" />
          </div>

          {/* Quick Highlight Combos */}
          <div className="azora-offer-details">
            <div className="azora-offer-details-header">
              <h3 className="azora-offer-details-title">
                Featured Festival Combos &amp; Packages
              </h3>
              <span className="azora-offer-tap-hint">Tap any package to book instantly</span>
            </div>

            <div className="azora-combos-grid">
              {combos.map((combo, idx) => (
                <div 
                  key={combo.id || idx} 
                  className="azora-combo-item azora-combo-item--clickable"
                  onClick={() => handleComboClick(combo)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleComboClick(combo);
                    }
                  }}
                  title={`Click to book ${combo.name}`}
                >
                  <div className="azora-combo-top">
                    <strong className="azora-combo-name">{combo.name}</strong>
                    <span className="azora-combo-price">{combo.price}</span>
                  </div>
                  {combo.desc && (
                    <p className="azora-combo-desc">{combo.desc}</p>
                  )}
                  <div className="azora-combo-book-bar">
                    <span className="azora-combo-book-tag">Book Deal</span>
                    <ArrowRight size={14} className="azora-combo-arrow" />
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="azora-offer-actions">
              {onOpenBooking && (
                <button
                  type="button"
                  className="btn btn-primary azora-offer-book-btn"
                  onClick={() => onOpenBooking(combos[0]?.id || 'navratri-offers')}
                >
                  Book Festive Appointment <ArrowRight size={16} />
                </button>
              )}

              <a
                href={`https://wa.me/917021929588?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary azora-offer-wa-btn"
              >
                <MessageCircle size={17} /> Claim via WhatsApp
              </a>

              <a
                href="tel:7021929588"
                className="btn btn-outline-gold azora-offer-call-btn"
              >
                <Phone size={16} /> Call Salon
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen High-Res Zoom Modal */}
      {isZoomOpen && createPortal(
        <div className="azora-offer-modal-overlay" onClick={closeZoom}>
          <div className="azora-offer-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="azora-offer-modal-close"
              onClick={closeZoom}
              aria-label="Close offer view"
            >
              <X size={24} />
            </button>
            <img
              src={offerImage}
              alt={offerTitle}
              className="azora-offer-modal-img"
              referrerPolicy="no-referrer"
            />
            <div className="azora-offer-modal-footer">
              <span className="azora-offer-modal-title">{offerTitle}</span>
              <div className="azora-offer-modal-btns">
                {onOpenBooking && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => { closeZoom(); onOpenBooking(combos[0]?.id || 'navratri-offers'); }}
                  >
                    Book Now
                  </button>
                )}
                <a
                  href={`https://wa.me/917021929588?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
