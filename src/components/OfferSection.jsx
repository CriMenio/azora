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

function getSpecialOfferIcon(iconName) {
  switch (String(iconName || '').toLowerCase()) {
    case 'gift':
      return Gift;
    case 'sparkles':
      return Sparkles;
    case 'scissors':
      return Scissors;
    case 'crown':
      return Crown;
    case 'tag':
      return Tag;
    case 'flame':
      return Flame;
    case 'heart':
    default:
      return Heart;
  }
}

// Category bifurcation metadata for festive sections matching flyer template
const BIFURCATION_META = {
  Beauty: {
    title: 'Beauty Combos',
    subtitle: 'O3+ Facials, Glow Cleanups & Waxing Combos with Complimentary Face D-Tan',
    icon: Award,
    badgeText: 'Festive Radiant Skin',
  },
  Waxing: {
    title: 'Waxing Services',
    subtitle: 'Hygienic Normal & Italian Rica Waxing combos with precision eyebrow styling',
    icon: ShieldCheck,
    badgeText: 'Silky Smooth Care',
  },
  Nails: {
    title: 'Nails & Pedicure',
    subtitle: 'Gel Polish, Acrylic & Gel Extensions with Free 2-Finger Art & Cat Eye Polish',
    icon: Sparkles,
    badgeText: 'Nail Bar Specials',
  },
  Hair: {
    title: 'Hair Spa & Treatments',
    subtitle: 'Nourishing Hair Spa, Global Colours, Highlights, Keratin, Smoothing & Botox',
    icon: Scissors,
    badgeText: 'Salon Hair Artistry',
  },
  Grooming: {
    title: "Men's Diwali Grooming",
    subtitle: 'Diwali festive haircuts, beard styling, head massage & special D-Tan packages',
    icon: Heart,
    badgeText: 'Sharp Festive Look',
  },
  Facial: {
    title: 'Facial & Skin Care',
    subtitle: 'Luxury facials and deep skin rejuvenation',
    icon: Crown,
    badgeText: 'Radiant Glow',
  },
  'Clean-Up': {
    title: 'Express Clean-Ups',
    subtitle: 'Deep cleansing and skin exfoliation',
    icon: Sparkles,
    badgeText: 'Fresh Glow',
  },
  Makeup: {
    title: 'Festive & Party Makeup',
    subtitle: 'Celebration makeup and hair styling',
    icon: Flame,
    badgeText: 'Celebration Glam',
  },
};

function getSpecialOfferCategory(offer) {
  if (offer.category && offer.category.trim()) return offer.category.trim();
  const text = `${offer.title || ''} ${offer.desc || ''} ${offer.pill || ''} ${offer.tag || ''}`.toLowerCase();
  if (text.includes('husband') || text.includes('groom') || text.includes('men')) return 'Grooming';
  if (text.includes('nail') || text.includes('pedicure') || text.includes('manicure')) return 'Nails';
  if (text.includes('hair') || text.includes('botox') || text.includes('keratin') || text.includes('spa')) return 'Hair';
  if (text.includes('wax')) return 'Waxing';
  if (text.includes('facial') || text.includes('cleanup') || text.includes('d-tan') || text.includes('dtan')) return 'Beauty';
  return 'Beauty';
}

// Helper to normalize, clean, and enrich combo packages for optimal customer readability
function normalizeCombo(combo, idx) {
  const rawName = (combo.name || '').trim();
  const rawDesc = (combo.desc || '').trim();
  const rawPrice = (combo.price || '').trim();
  const rawCat = (combo.category || '').trim();

  // Detect if name is a generic section title
  const isGenericSectionName = /^(hair\s*(offers|deals)?|nail\s*(offers|deals)?|facial\s*(combos|offers)?|clean-?up\s*(combos|offers)?|wax\s*(combos|offers)?|makeup(\s*offers)?|basic\s*(?:karwa\s*chauth\s*)?makeup|festival\s*offers?)$/i.test(
    rawName
  );

  let displayName = rawName;
  let detailText = rawDesc;

  if (isGenericSectionName && rawDesc) {
    displayName = rawDesc;
    detailText = '';
  }

  // Determine Category: Honor explicit category if given
  let category = rawCat;
  if (!category) {
    const combined = `${rawName} ${rawDesc} ${displayName}`.toLowerCase();
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

  // Parse Inclusions & Special Perks (Protect "O3+" from being split by "+")
  const perks = [];
  const inclusions = [];

  const textToSplit = detailText || (rawName !== displayName ? rawDesc : '');
  if (textToSplit) {
    const safeText = textToSplit.replace(/O3\+/gi, 'O3__PLUS__');
    const parts = safeText
      .split(/\s*(?:\s\+\s|\band\b|•|,|\/)\s*|\s*\+\s*/i)
      .map((s) => s.replace(/O3__PLUS__/g, 'O3+').trim())
      .filter(Boolean);

    for (const part of parts) {
      if (/free\s*face\s*d-?tan/i.test(part) || /free\s*d-?tan/i.test(part)) {
        perks.push({ type: 'gift', text: 'FREE D-Tan' });
      } else if (/free\s*threading/i.test(part)) {
        perks.push({ type: 'gift', text: 'FREE Threading' });
      } else if (/free\s*2-finger\s*nail\s*art/i.test(part) || /free.*nail\s*art/i.test(part)) {
        perks.push({ type: 'gift', text: 'FREE Nail Art' });
      } else if (/\d+%\s*off/i.test(part)) {
        perks.push({ type: 'discount', text: part.toUpperCase() });
      } else if (/free/i.test(part)) {
        perks.push({ type: 'gift', text: part });
      } else {
        inclusions.push(part);
      }
    }
  }

  // If no inclusions parsed from description but title has "+" (protecting O3+)
  if (inclusions.length === 0 && displayName.includes('+')) {
    const safeTitle = displayName.replace(/O3\+/gi, 'O3__PLUS__');
    const subServices = safeTitle
      .split(/\s*\+\s*/)
      .map((s) => s.replace(/O3__PLUS__/g, 'O3+').trim())
      .filter(Boolean);
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
  const safeId = combo.id || `offer-${idx}-${displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return {
    ...combo,
    id: safeId,
    displayName,
    category,
    badge: combo.badge || '',
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

  const combosList = offerConfig.combos;

  // Normalize all combos
  const normalizedCombos = useMemo(() => {
    const raw = Array.isArray(combosList) && combosList.length > 0 ? combosList : [];
    return raw.map((c, idx) => normalizeCombo(c, idx));
  }, [combosList]);

  // Special offers list
  const specialOffersList = Array.isArray(offerConfig.specialOffers) ? offerConfig.specialOffers : [];
  const activeSpecialOffers = useMemo(() => {
    return specialOffersList.filter((s) => s.isActive !== false);
  }, [specialOffersList]);

  // Compute available category tabs with counts (combos + specials in that category)
  const categoryFilters = useMemo(() => {
    const counts = { all: normalizedCombos.length + activeSpecialOffers.length };
    normalizedCombos.forEach((c) => {
      const cat = c.category || 'Beauty';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    activeSpecialOffers.forEach((s) => {
      const cat = getSpecialOfferCategory(s);
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const categoryDef = [
      { id: 'all', label: `All Offers (${counts.all})`, icon: Sparkles },
      { id: 'Beauty', label: `Beauty Combos (${counts.Beauty || 0})`, icon: Award },
      { id: 'Waxing', label: `Waxing Services (${counts.Waxing || 0})`, icon: ShieldCheck },
      { id: 'Nails', label: `Nails & Pedicure (${counts.Nails || 0})`, icon: Sparkles },
      { id: 'Hair', label: `Hair Spa & Treatments (${counts.Hair || 0})`, icon: Scissors },
      { id: 'Grooming', label: `Men's Grooming (${counts.Grooming || 0})`, icon: Heart },
      { id: 'Facial', label: `Facials (${counts.Facial || 0})`, icon: Crown },
      { id: 'Clean-Up', label: `Clean-Up (${counts['Clean-Up'] || 0})`, icon: Sparkles },
      { id: 'Makeup', label: `Makeup (${counts.Makeup || 0})`, icon: Flame },
    ];

    return categoryDef.filter((item) => item.id === 'all' || (counts[item.id] && counts[item.id] > 0));
  }, [normalizedCombos, activeSpecialOffers]);

  // Filtered Combos by search
  const filteredCombos = useMemo(() => {
    let list = normalizedCombos;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => {
        return (
          c.displayName.toLowerCase().includes(q) ||
          c.priceVal.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.desc || '').toLowerCase().includes(q) ||
          c.inclusions.some((inc) => inc.toLowerCase().includes(q)) ||
          c.perks.some((p) => p.text.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [normalizedCombos, searchQuery]);

  // Group into bifurcated sections matching flyer design
  const bifurcatedSections = useMemo(() => {
    const orderedCatIds = ['Beauty', 'Waxing', 'Nails', 'Hair', 'Grooming'];

    const allPresentCatIds = new Set();
    filteredCombos.forEach((c) => allPresentCatIds.add(c.category || 'Beauty'));
    activeSpecialOffers.forEach((s) => allPresentCatIds.add(getSpecialOfferCategory(s)));

    const finalCatIds = [
      ...orderedCatIds.filter((id) => allPresentCatIds.has(id)),
      ...Array.from(allPresentCatIds).filter((id) => !orderedCatIds.includes(id)),
    ];

    // If a specific category tab is selected, only keep that category
    const targetCatIds =
      selectedCategory === 'all'
        ? finalCatIds
        : finalCatIds.filter((id) => id.toLowerCase() === selectedCategory.toLowerCase());

    return targetCatIds
      .map((catId) => {
        const meta = BIFURCATION_META[catId] || {
          title: `${catId} Offers`,
          subtitle: `Exclusive festive offers and packages in ${catId}`,
          icon: Sparkles,
          badgeText: 'Festive Special',
        };

        const sectionCombos = filteredCombos.filter(
          (c) => (c.category || 'Beauty').toLowerCase() === catId.toLowerCase()
        );

        // If search query is active, only show matching special offers
        const sectionSpecials = activeSpecialOffers.filter((s) => {
          const matchCat = getSpecialOfferCategory(s).toLowerCase() === catId.toLowerCase();
          if (!matchCat) return false;
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase().trim();
          return (
            (s.title || '').toLowerCase().includes(q) ||
            (s.desc || '').toLowerCase().includes(q) ||
            (s.pill || '').toLowerCase().includes(q) ||
            (s.tag || '').toLowerCase().includes(q)
          );
        });

        return {
          id: catId,
          ...meta,
          combos: sectionCombos,
          specialOffers: sectionSpecials,
          totalCount: sectionCombos.length + sectionSpecials.length,
        };
      })
      .filter((sec) => sec.totalCount > 0);
  }, [filteredCombos, activeSpecialOffers, selectedCategory, searchQuery]);

  const totalVisibleOffers = useMemo(() => {
    return bifurcatedSections.reduce((acc, sec) => acc + sec.totalCount, 0);
  }, [bifurcatedSections]);

  const offerImage = resolveOfferBannerImage(offerConfig.image);
  const offerTitle = offerConfig.title || 'Diwali Special Offers';
  const offerBadge = offerConfig.badge || 'Diwali SPECIAL OFFERS';
  const offerDesc =
    offerConfig.desc ||
    'Look Beautiful • Feel Confident • Celebrate Brightly! Exclusive festive beauty combos, waxing services, nail art extensions, and luxury grooming packages at celebration rates.';
  const offerDate = offerConfig.dateRange || 'Diwali Festive Celebration';
  const offerTags = Array.isArray(offerConfig.tags) ? offerConfig.tags : [];

  const handleComboClick = (combo) => {
    if (onBookCombo) {
      onBookCombo(combo);
    } else if (onOpenBooking) {
      onOpenBooking(combo.id || 'offer-combo', 2);
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
        {/* HERO FESTIVE BANNER CAMPAIGN HEADER                       */}
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
                <strong>Official Salon Festive Flyer</strong>
                <span>Tap to view full high-resolution poster</span>
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

          {/* Inline Expandable Poster */}
          {isFlyerExpanded && (
            <div className="azora-flyer-inline-wrap">
              <img
                src={offerImage}
                alt={offerTitle}
                className="azora-flyer-inline-img"
                onClick={openZoom}
                title="Click image to zoom full screen"
              />
              <div className="azora-flyer-inline-hint">
                <Maximize2 size={14} /> Click image to enlarge full screen
              </div>
            </div>
          )}
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
              placeholder="Search combos, e.g. O3+, rica wax, hair botox, nail extensions..."
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
            Showing <strong>{totalVisibleOffers}</strong> festive{' '}
            {totalVisibleOffers === 1 ? 'offer' : 'offers'} bifurcated across{' '}
            <strong>{bifurcatedSections.length}</strong>{' '}
            {bifurcatedSections.length === 1 ? 'category' : 'categories'}
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
        {/* UNIFIED OFFERS SECTION: BIFURCATED BY CATEGORY            */}
        {/* ========================================================= */}
        {bifurcatedSections.length === 0 ? (
          <div className="azora-offers-empty-state glass-panel">
            <Sparkles size={36} className="text-gold" />
            <h3>No packages or special offers found matching your selection</h3>
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
          bifurcatedSections.map((section) => {
            const SectionIcon = section.icon;

            return (
              <div
                key={section.id}
                className="azora-section-bifurcation"
                id={`bifurcation-${section.id.toLowerCase()}`}
              >
                {/* Bifurcation Header */}
                <div className="azora-bifurcation-header">
                  <div className="azora-bifurcation-title-wrap">
                    <div className="azora-bifurcation-icon">
                      <SectionIcon size={20} />
                    </div>
                    <div>
                      <h2 className="azora-bifurcation-title">{section.title}</h2>
                      <p className="azora-bifurcation-subtitle">{section.subtitle}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {section.badgeText && (
                      <span className="azora-bifurcation-pill">
                        <Sparkles size={11} /> {section.badgeText}
                      </span>
                    )}
                    <span className="azora-bifurcation-count">
                      {section.totalCount} {section.totalCount === 1 ? 'Offer' : 'Offers'}
                    </span>
                  </div>
                </div>

                {/* Promotional Feature Banners for THIS specific category */}
                {section.specialOffers.length > 0 && (
                  <div className="azora-bifurcation-specials">
                    {section.specialOffers.map((offer) => {
                      const IconComp = getSpecialOfferIcon(offer.icon);
                      const waMsg = encodeURIComponent(
                        offer.whatsappMsg ||
                          `Hi Azora Salon, I saw your Special Offer "${offer.title}" on your website and would like to claim it!`
                      );
                      const waUrl = `https://wa.me/917021929588?text=${waMsg}`;

                      return (
                        <div key={offer.id} className="azora-surprise-card glass-panel">
                          <div className="azora-surprise-badge-row">
                            {offer.pill && (
                              <span className="azora-surprise-pill">
                                <Gift size={13} /> {offer.pill}
                              </span>
                            )}
                            {offer.tag && (
                              <span className="azora-surprise-tag">{offer.tag}</span>
                            )}
                          </div>

                          <div className="azora-surprise-content">
                            <div className="azora-surprise-avatar">
                              <IconComp size={24} className="text-gold" />
                            </div>
                            <div className="azora-surprise-details">
                              <h3 className="azora-surprise-heading">{offer.title}</h3>
                              <p className="azora-surprise-desc">
                                {offer.desc}{' '}
                                {offer.quote && (
                                  <span className="azora-surprise-quote">{offer.quote}</span>
                                )}
                              </p>
                            </div>
                            <div className="azora-surprise-btn-wrap">
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline-gold azora-claim-surprise-btn"
                              >
                                <Sparkles size={14} /> {offer.btnText || 'Claim on WhatsApp'}
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Combos & Packages Grid for THIS category */}
                {section.combos.length > 0 && (
                  <div className="admin-packages-records-grid">
                    {section.combos.map((combo) => {
                      const packageTitle = combo.name || combo.displayName;
                      const packageDesc = combo.desc || '';
                      const rawPrice = (combo.price || combo.priceVal || '').trim();
                      let packagePrice = rawPrice;
                      if (
                        packagePrice &&
                        !/^(special\s*price|starting\s*at|from|offer\s*price|deal\s*price)/i.test(packagePrice)
                      ) {
                        packagePrice = `${packagePrice.startsWith('₹') ? packagePrice : `₹${packagePrice}`}`;
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
                          {/* Top Bar: Category on Left, Custom Badge, Price on Right */}
                          <div className="pkg-card-top">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <span className="pkg-card-cat-badge">{packageCategory}</span>
                              {combo.badge && (
                                <span className="pkg-card-custom-badge">
                                  <Sparkles size={11} /> {combo.badge}
                                </span>
                              )}
                            </div>
                            <span className="pkg-card-price-badge">{packagePrice}</span>
                          </div>

                          {/* Title */}
                          <h3 className="pkg-card-title">{packageTitle}</h3>

                          {/* Description */}
                          {packageDesc && (
                            <p className="pkg-card-desc">{packageDesc}</p>
                          )}

                          {/* Inclusion Tag Chips if available */}
                          {combo.inclusions && combo.inclusions.length > 1 && (
                            <div className="pkg-card-inclusions-list">
                              {combo.inclusions.map((inc, i) => (
                                <span key={i} className="pkg-inclusion-chip">
                                  <Check size={11} className="text-gold" /> {inc}
                                </span>
                              ))}
                            </div>
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
              </div>
            );
          })
        )}

        {/* ========================================================= */}
        {/* BOTTOM ASSISTANCE & CALL-TO-ACTION BAR                    */}
        {/* ========================================================= */}
        <div className="azora-offers-bottom-cta glass-panel">
          <div className="azora-bottom-cta-text">
            <h3>Need a Custom Makeover, Bridal or Group Booking?</h3>
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
                        onOpenBooking(combosList?.[0]?.id || 'offer-combo', 2);
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
