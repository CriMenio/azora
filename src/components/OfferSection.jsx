import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Calendar,
  Phone,
  MessageCircle,
  Maximize2,
  X,
  Tag,
  ArrowRight,
  Check,
  Scissors,
  Crown,
  Gift,
  Heart,
  Search,
  CheckCircle2,
  Flame,
  Award,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { SITE_IMAGES } from '../assets/siteImages';
import { getOfferConfig, fetchOfferFromSpreadsheet, resolveOfferBannerImage } from '../services/offerService';

// Helper to normalize, clean, and enrich combo packages for optimal customer readability
function normalizeCombo(combo, idx) {
  const rawName = (combo.name || '').trim();
  const rawDesc = (combo.desc || '').trim();
  const rawPrice = (combo.price || '').trim();
  const rawCat = (combo.category || '').trim();

  // Detect if name is a generic section title (e.g. "HAIR OFFERS", "NAIL OFFERS", "FACIAL COMBOS", "BASIC KARWA CHAUTH MAKEUP")
  const isGenericSectionName = /^(hair\s*(offers|deals)?|nail\s*(offers|deals)?|facial\s*(combos|offers)?|clean-?up\s*(combos|offers)?|wax\s*(combos|offers)?|makeup(\s*offers)?|basic\s*(?:karwa\s*chauth\s*)?makeup|festival\s*offers?)$/i.test(
    rawName
  );

  let displayName = rawName;
  let detailText = rawDesc;

  if (isGenericSectionName && rawDesc) {
    // Elevate the actual service from desc to the title
    displayName = rawDesc;
    detailText = '';
  }

  // Determine Category
  let category = rawCat;
  const combined = `${rawName} ${rawDesc} ${displayName}`.toLowerCase();

  if (!category || category === 'Beauty') {
    if (combined.includes('makeup') || combined.includes('bridal')) {
      category = 'Makeup';
    } else if (combined.includes('nail') || combined.includes('gel polish') || combined.includes('acrylic') || combined.includes('nail art')) {
      category = 'Nails';
    } else if (combined.includes('wax') || combined.includes('underarms') || combined.includes('legs') || combined.includes('arms')) {
      category = 'Waxing';
    } else if (combined.includes('facial') || combined.includes('hydra') || combined.includes('o3') || combined.includes('radiance') || combined.includes('korean')) {
      category = 'Facial';
    } else if (combined.includes('clean-up') || combined.includes('cleanup')) {
      category = 'Clean-Up';
    } else if (combined.includes('hair') || combined.includes('spa') || combined.includes('blow-dry') || combined.includes('cut')) {
      category = 'Hair';
    } else if (combined.includes('husband') || combined.includes('men') || combined.includes('grooming')) {
      category = 'Grooming';
    } else {
      category = 'Beauty';
    }
  }

  // Parse Inclusions & Special Perks (Free D-Tan, Free Threading, Discounts)
  const perks = [];
  const inclusions = [];

  const textToSplit = detailText || (rawName !== displayName ? rawDesc : '');
  if (textToSplit) {
    // Split by '+', 'and', '•', or comma
    const parts = textToSplit.split(/\s*(?:\+|\band\b|•|,|\/)\s*/i).map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (/free\s*d-?tan/i.test(part)) {
        perks.push({ type: 'gift', text: 'FREE D-Tan' });
      } else if (/free\s*threading/i.test(part)) {
        perks.push({ type: 'gift', text: 'FREE Threading' });
      } else if (/\d+%\s*off/i.test(part)) {
        perks.push({ type: 'discount', text: part.toUpperCase() });
      } else if (/free/i.test(part)) {
        perks.push({ type: 'gift', text: part });
      } else {
        inclusions.push(part);
      }
    }
  }

  // If no inclusions parsed from description but title has "+" (e.g. "Any Haircut + Hair Wash + Blow-Dry")
  if (inclusions.length === 0 && displayName.includes('+')) {
    const subServices = displayName.split('+').map((s) => s.trim()).filter(Boolean);
    if (subServices.length > 1) {
      inclusions.push(...subServices);
    }
  }

  // Price & Price Label Formatting
  let priceLabel = 'Festive Price';
  let priceVal = rawPrice || '₹999';

  if (/special\s*price[:\s]*/i.test(rawPrice)) {
    priceLabel = 'Special Price';
    priceVal = rawPrice.replace(/special\s*price[:\s]*/i, '').trim();
  } else if (/starting\s*at[:\s]*/i.test(rawPrice)) {
    priceLabel = 'Starting At';
    priceVal = rawPrice.replace(/starting\s*at[:\s]*/i, '').trim();
  } else if (/from[:\s]*/i.test(rawPrice)) {
    priceLabel = 'Starting From';
    priceVal = rawPrice.replace(/from[:\s]*/i, '').trim();
  } else if (/free/i.test(rawPrice)) {
    priceLabel = 'Special Gift';
    priceVal = 'FREE';
  }

  // Format ID safely
  const safeId = combo.id || `combo-${idx}-${displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return {
    ...combo,
    id: safeId,
    displayName,
    category,
    priceLabel,
    priceVal,
    inclusions,
    perks,
  };
}

export default function OfferSection({ onOpenBooking, onBookCombo, variant = 'full' }) {
  const [offerConfig, setOfferConfig] = useState(getOfferConfig);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFlyerExpanded, setIsFlyerExpanded] = useState(false);

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

  const rawCombos = Array.isArray(offerConfig.combos) && offerConfig.combos.length > 0 ? offerConfig.combos : [];

  // Normalize all combos
  const normalizedCombos = useMemo(() => {
    return rawCombos.map((c, idx) => normalizeCombo(c, idx));
  }, [rawCombos]);

  // Compute available categories with counts
  const categoryFilters = useMemo(() => {
    const counts = { all: normalizedCombos.length };
    normalizedCombos.forEach((c) => {
      const cat = c.category || 'Beauty';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const categoryDef = [
      { id: 'all', label: 'All Packages', icon: Sparkles },
      { id: 'Hair', label: 'Hair Care', icon: Scissors },
      { id: 'Clean-Up', label: 'Clean-Up', icon: Sparkles },
      { id: 'Facial', label: 'Facials & Glow', icon: Crown },
      { id: 'Nails', label: 'Nails & Art', icon: Sparkles },
      { id: 'Waxing', label: 'Waxing Combos', icon: ShieldCheck },
      { id: 'Makeup', label: 'Makeup & Styling', icon: Flame },
      { id: 'Grooming', label: 'Men & Couples', icon: Heart },
      { id: 'Beauty', label: 'Beauty Deals', icon: Award },
    ];

    return categoryDef.filter((item) => item.id === 'all' || (counts[item.id] && counts[item.id] > 0));
  }, [normalizedCombos]);

  // Filtered Combos by search & category
  const filteredCombos = useMemo(() => {
    let list = normalizedCombos;

    if (selectedCategory !== 'all') {
      list = list.filter((c) => c.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => {
        return (
          c.displayName.toLowerCase().includes(q) ||
          c.priceVal.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.inclusions.some((inc) => inc.toLowerCase().includes(q)) ||
          c.perks.some((p) => p.text.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [normalizedCombos, selectedCategory, searchQuery]);

  const offerImage = resolveOfferBannerImage(offerConfig.image);
  const offerTitle = offerConfig.title || 'Festive Celebration Offers';
  const offerBadge = offerConfig.badge || 'Limited Edition Deals';
  const offerDesc =
    offerConfig.desc ||
    'Look Beautiful · Feel Special · Celebrate You! Exclusive festive beauty combos, hair rituals, and luxury packages at celebration rates.';
  const offerDate = offerConfig.dateRange || 'Festive Special';
  const offerTags = Array.isArray(offerConfig.tags) ? offerConfig.tags : [];

  const handleComboClick = (combo) => {
    if (onBookCombo) {
      onBookCombo(combo);
    } else if (onOpenBooking) {
      onOpenBooking(combo.id || 'offer-combo');
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hi Azora Salon, I saw your "${offerTitle}" and would like to book a festive appointment!`
  );

  if (!offerConfig.isActive) {
    return null;
  }

  return (
    <section className={`azora-offer-section${variant === 'compact' ? ' azora-offer-section--compact' : ''}`}>
      <div className="azora-offer-container">
        {/* ========================================================= */}
        {/* HERO FESTIVE HEADER                                       */}
        {/* ========================================================= */}
        <div className="azora-offer-hero glass-panel">
          <div className="azora-offer-hero-top">
            {offerBadge && (
              <span className="azora-festive-badge">
                <Sparkles size={14} className="badge-sparkle" />
                <span>{offerBadge}</span>
              </span>
            )}
            {offerDate && (
              <span className="azora-festive-date">
                <Calendar size={13} /> {offerDate}
              </span>
            )}
          </div>

          <h1 className="azora-offer-hero-title">{offerTitle}</h1>

          {offerDesc && <p className="azora-offer-hero-desc">{offerDesc}</p>}

          {/* Perk Highlight Chips */}
          {offerTags.length > 0 && (
            <div className="azora-offer-perk-chips">
              {offerTags.map((tag, idx) => (
                <span key={idx} className="azora-perk-chip">
                  <CheckCircle2 size={13} className="text-gold" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}

          {/* Quick Flyer Preview Toggle Banner */}
          <div className="azora-flyer-quick-strip">
            <div className="azora-flyer-thumb-group" onClick={openZoom}>
              <img
                src={offerImage}
                alt="Salon Flyer"
                className="azora-flyer-mini-thumb"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = SITE_IMAGES.offers;
                }}
              />
              <div className="azora-flyer-info">
                <strong>Official Salon Promo Flyer</strong>
                <span>Tap to view high-resolution poster</span>
              </div>
            </div>

            <div className="azora-flyer-actions">
              <button
                type="button"
                className="btn btn-outline-gold btn-sm azora-flyer-view-btn"
                onClick={openZoom}
                title="Open full poster"
              >
                <Maximize2 size={14} /> <span>Enlarge Poster</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm azora-flyer-toggle-btn"
                onClick={() => setIsFlyerExpanded(!isFlyerExpanded)}
              >
                <Eye size={14} /> <span>{isFlyerExpanded ? 'Hide Poster' : 'Show Poster Below'}</span>
              </button>
            </div>
          </div>

          {/* Inline Expandable Poster (Optional toggle) */}
          {isFlyerExpanded && (
            <div className="azora-flyer-inline-wrap">
              <img
                src={offerImage}
                alt={offerTitle}
                className="azora-flyer-inline-img"
                onClick={openZoom}
                title="Click to zoom in full screen"
              />
              <div className="azora-flyer-inline-hint">
                <Maximize2 size={14} /> Click image to enlarge full screen
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* COUPLE'S SPECIAL FESTIVE SURPRISE (HUSBAND FREE D-TAN)   */}
        {/* ========================================================= */}
        <div className="azora-surprise-card glass-panel">
          <div className="azora-surprise-badge-row">
            <span className="azora-surprise-pill">
              <Gift size={13} /> Special Festive Surprise!
            </span>
            <span className="azora-surprise-tag">100% Free Grooming</span>
          </div>

          <div className="azora-surprise-content">
            <div className="azora-surprise-avatar">
              <Heart size={26} className="text-gold" />
            </div>
            <div className="azora-surprise-details">
              <h3 className="azora-surprise-heading">
                Ladies, Bring Your Husbands Along! 💖
              </h3>
              <p className="azora-surprise-desc">
                If he is paying your festive bill, we’ll treat him to a{' '}
                <strong className="text-gold">FREE D-Tan Treatment</strong> on us!
                <span className="azora-surprise-quote">
                  {' '}
                  “Because his tan doesn’t deserve the spotlight on your special day!”
                </span>
              </p>
            </div>
            <div className="azora-surprise-btn-wrap">
              <a
                href={`https://wa.me/917021929588?text=${encodeURIComponent(
                  'Hi Azora Salon, I would like to book a Karwa Chauth appointment and claim the Free D-Tan for my husband!'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-gold azora-claim-surprise-btn"
              >
                <Sparkles size={14} /> Claim on WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* INTERACTIVE CONTROLS: CATEGORY TABS & LIVE SEARCH         */}
        {/* ========================================================= */}
        <div className="azora-offers-controls-bar glass-panel">
          {/* Category Tabs */}
          <div className="azora-offers-cat-pills" role="tablist">
            {categoryFilters.map((cat) => {
              const IconComp = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`azora-cat-tab ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <IconComp size={15} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Search Input */}
          <div className="azora-offers-search-box">
            <Search size={16} className="azora-search-icon" />
            <input
              type="text"
              className="azora-search-input"
              placeholder="Search combos, e.g. fruit cleanup, hydra, wax, nails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="azora-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Results Counter & Fast Filter Reset */}
        <div className="azora-offers-results-meta">
          <span className="azora-results-count">
            Showing <strong>{filteredCombos.length}</strong> festive{' '}
            {filteredCombos.length === 1 ? 'combo' : 'combos'}
            {selectedCategory !== 'all' && ` in ${selectedCategory}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </span>

          {(selectedCategory !== 'all' || searchQuery) && (
            <button
              type="button"
              className="azora-reset-filter-link"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* ========================================================= */}
        {/* REDESIGNED LUXURY COMBOS & PACKAGES GRID                  */}
        {/* ========================================================= */}
        {filteredCombos.length === 0 ? (
          <div className="azora-offers-empty-state glass-panel">
            <Sparkles size={36} className="text-gold" />
            <h3>No packages found matching your selection</h3>
            <p>Try searching for a different service, or click below to view all festive offers.</p>
            <button
              type="button"
              className="btn btn-outline-gold"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
            >
              View All Festive Deals
            </button>
          </div>
        ) : (
          <div className="admin-packages-records-grid">
            {filteredCombos.map((combo) => {
              const packageTitle = combo.name || combo.displayName;
              const packageDesc = combo.desc || '';
              const rawPrice = (combo.price || combo.priceVal || '').trim();
              let packagePrice = rawPrice;
              if (packagePrice && !/^(special\s*price|starting\s*at|from|offer\s*price|deal\s*price)/i.test(packagePrice)) {
                packagePrice = `Special Price: ${packagePrice.startsWith('₹') ? packagePrice : `₹${packagePrice}`}`;
              }
              const packageCategory = combo.category || 'Beauty';
              const waUrl = `https://wa.me/917021929588?text=${encodeURIComponent(
                `Hi Azora Salon, I would like to book the "${packageTitle}" (${packagePrice}) offer!`
              )}`;

              return (
                <div
                  key={combo.id}
                  className="admin-package-record-card glass-panel"
                  onClick={() => handleComboClick(combo)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleComboClick(combo);
                    }
                  }}
                  title={`Click to book ${packageTitle}`}
                >
                  {/* Top Bar: Category on Left & Price on Right (Exact Admin Layout) */}
                  <div className="pkg-card-top">
                    <span className="pkg-card-cat-badge">{packageCategory}</span>
                    <span className="pkg-card-price-badge">{packagePrice}</span>
                  </div>

                  {/* Title */}
                  <h3 className="pkg-card-title">{packageTitle}</h3>

                  {/* Description */}
                  {packageDesc && (
                    <p className="pkg-card-desc">{packageDesc}</p>
                  )}

                  {/* Booking Action Hint */}
                  <div className="pkg-card-hover-hint">
                    <span>Click to book package</span>
                    <ArrowRight size={13} />
                  </div>

                  {/* Action Buttons Bar */}
                  <div className="pkg-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="pkg-act-btn pkg-act-btn--primary"
                      onClick={() => handleComboClick(combo)}
                      title="Book this package"
                    >
                      <Calendar size={14} /> <span>Book Deal</span>
                    </button>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pkg-act-btn pkg-act-btn--wa"
                      title="Inquire on WhatsApp"
                    >
                      <MessageCircle size={14} /> <span>WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      className="pkg-act-btn pkg-act-btn--view"
                      onClick={() => handleComboClick(combo)}
                      title="Quick booking"
                    >
                      <Sparkles size={14} /> <span>Instant</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* BOTTOM ASSISTANCE & CALL-TO-ACTION BAR                    */}
        {/* ========================================================= */}
        <div className="azora-offers-bottom-cta glass-panel">
          <div className="azora-bottom-cta-text">
            <h3>Need a Custom Makeover or Group Booking?</h3>
            <p>
              Senior Stylist Preeti and our expert team are ready to personalize a festive package
              tailored to your skin, hair type, and celebration plans.
            </p>
          </div>

          <div className="azora-bottom-cta-buttons">
            <a
              href={`https://wa.me/917021929588?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <MessageCircle size={16} /> Chat on WhatsApp
            </a>

            <a href="tel:7021929588" className="btn btn-outline-gold">
              <Phone size={16} /> Call +91 70219 29588
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* HIGH-RES FULLSCREEN POSTER ZOOM MODAL                     */}
      {/* ========================================================= */}
      {isZoomOpen &&
        createPortal(
          <div className="azora-offer-modal-overlay" onClick={closeZoom}>
            <div className="azora-offer-modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="azora-offer-modal-close"
                onClick={closeZoom}
                aria-label="Close offer view"
              >
                <X size={26} />
              </button>
              <img
                src={offerImage}
                alt={offerTitle}
                className="azora-offer-modal-img"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = SITE_IMAGES.offers;
                }}
              />
              <div className="azora-offer-modal-footer">
                <div>
                  <span className="azora-offer-modal-title">{offerTitle}</span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                    Tap any package on the page to book immediately.
                  </p>
                </div>
                <div className="azora-offer-modal-btns">
                  {onOpenBooking && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        closeZoom();
                        onOpenBooking(rawCombos[0]?.id || 'offer-combo');
                      }}
                    >
                      Book an Offer Now
                    </button>
                  )}
                  <a
                    href={`https://wa.me/917021929588?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    <MessageCircle size={16} /> WhatsApp Us
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
