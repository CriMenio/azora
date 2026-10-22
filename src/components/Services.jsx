import React, { useState, useMemo } from 'react';
import { 
  Scissors, 
  Sparkles, 
  Smile, 
  Search, 
  X, 
  Layers, 
  ArrowRight,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { SERVICES_CATALOG, BOOKING_CATEGORIES } from '../data/servicesCatalog';

const MAIN_CATEGORIES = [
  { 
    id: 'all', 
    label: 'All Services', 
    icon: Layers,
    subcategories: null 
  },
  { 
    id: 'hair', 
    label: 'Hair & Beard', 
    icon: Scissors,
    subcategories: ['Haircut (Women)', 'Haircut & Beard (Men)', 'Hair Colour (Women)', 'Hair Colour (Men)'] 
  },
  { 
    id: 'facial', 
    label: 'Facial & Skin', 
    icon: Sparkles,
    subcategories: ['Facial', 'Clean Up'] 
  },
  { 
    id: 'nails', 
    label: 'Nails & Mani-Pedi', 
    icon: Smile,
    subcategories: ['Nails & Extensions', 'Manicure', 'Pedicure'] 
  },
  { 
    id: 'waxing', 
    label: 'Body Wax & Bleach', 
    icon: Sparkles,
    subcategories: ['Body Waxing', 'Bleach & D-Tan'] 
  },
  { 
    id: 'threading', 
    label: 'Threading & Facial Wax', 
    icon: Scissors,
    subcategories: ['Threading', 'Facial Waxing'] 
  },
];

const SECTION_CONFIG = {
  'Haircut (Women)': {
    badge: 'Styling',
    subtitle: 'Precision cuts, face-framing layers, and modern textured styling.',
    icon: Scissors,
  },
  'Haircut & Beard (Men)': {
    badge: 'Men’s Grooming',
    subtitle: 'Classic sharp contours, clean scissor cuts, and precise beard shaping.',
    icon: Scissors,
  },
  'Hair Colour (Women)': {
    badge: 'Colour',
    subtitle: 'L’Oréal Majirel, INOA ammonia-free root touch-ups, global colour & highlights.',
    icon: Sparkles,
  },
  'Hair Colour (Men)': {
    badge: 'Men’s Colour',
    subtitle: 'Discreet natural grey coverage, beard colour, and highlights.',
    icon: Sparkles,
  },
  'Facial': {
    badge: 'Skincare',
    subtitle: 'Targeted skin therapy, O3+ radiance, Hydra facial, and anti-ageing rituals.',
    icon: Sparkles,
  },
  'Clean Up': {
    badge: 'Express Glow',
    subtitle: 'Express deep pore purification, fruit cleansing, and instant radiance.',
    icon: Sparkles,
  },
  'Nails & Extensions': {
    badge: 'Nails & Art',
    subtitle: 'Sculpted acrylics, gel extensions, polygel, gel polish, and creative art.',
    icon: Smile,
  },
  'Manicure': {
    badge: 'Hand Spa',
    subtitle: 'Nourishing botanical spa, crystal scrubs, O3+ brightening, and warm paraffin.',
    icon: Smile,
  },
  'Pedicure': {
    badge: 'Foot Spa',
    subtitle: 'Relaxing foot spas, cracked heel care, crystal exfoliation, and nail grooming.',
    icon: Smile,
  },
  'Threading': {
    badge: 'Definition',
    subtitle: 'Delicate high-definition threading for clean brow contours and facial lines.',
    icon: Scissors,
  },
  'Facial Waxing': {
    badge: 'Gentle Wax',
    subtitle: 'Gentle facial waxing removing peach fuzz for soft, luminous skin.',
    icon: Sparkles,
  },
  'Body Waxing': {
    badge: 'Smooth Skin',
    subtitle: 'Hygienic arms, legs, full body waxing, and premium Rica bikini care.',
    icon: Sparkles,
  },
  'Bleach & D-Tan': {
    badge: 'De-Tan',
    subtitle: 'Sun tan reversal, deep skin clarifying, and illuminating body treatments.',
    icon: Sparkles,
  },
};

export default function Services({ onBookService }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Filter services by searchQuery
  const searchedCatalog = useMemo(() => {
    if (!searchQuery.trim()) return SERVICES_CATALOG;
    const q = searchQuery.toLowerCase().trim();
    return SERVICES_CATALOG.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.desc && s.desc.toLowerCase().includes(q)) ||
      (s.bookingCategory && s.bookingCategory.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // 2. Identify active sections to display
  const currentCategoryObj = MAIN_CATEGORIES.find(c => c.id === activeCategory) || MAIN_CATEGORIES[0];
  
  // All section keys from BOOKING_CATEGORIES (excluding Special Offers banner which is rendered at top)
  const allSectionKeys = useMemo(() => {
    return BOOKING_CATEGORIES
      .filter(c => c.key !== 'Special Offers')
      .map(c => c.key);
  }, []);

  const visibleSectionKeys = useMemo(() => {
    if (currentCategoryObj.id === 'all') {
      return allSectionKeys;
    }
    return currentCategoryObj.subcategories || allSectionKeys;
  }, [currentCategoryObj, allSectionKeys]);

  // Group services by section key
  const groupedSections = useMemo(() => {
    return visibleSectionKeys
      .map(key => {
        const services = searchedCatalog.filter(s => s.bookingCategory === key);
        const config = SECTION_CONFIG[key] || { badge: 'Ritual', subtitle: '', icon: Sparkles };
        return {
          key,
          title: key,
          services,
          config,
        };
      })
      .filter(sec => sec.services.length > 0);
  }, [visibleSectionKeys, searchedCatalog]);

  const totalFilteredCount = useMemo(() => {
    return groupedSections.reduce((sum, sec) => sum + sec.services.length, 0);
  }, [groupedSections]);

  // Count per main category for tab badges
  const categoryCounts = useMemo(() => {
    const counts = {};
    counts['all'] = searchedCatalog.length;
    MAIN_CATEGORIES.forEach(cat => {
      if (cat.id !== 'all' && cat.subcategories) {
        counts[cat.id] = searchedCatalog.filter(s => cat.subcategories.includes(s.bookingCategory)).length;
      }
    });
    return counts;
  }, [searchedCatalog]);

  return (
    <div className="animate-fade-in page-padding">
      <div className="container">
        {/* Page Header */}
        <div className="section-header">
          <span className="section-subtitle">Our Complete Salon Menu</span>
          <h2 className="section-title">Organized Services Catalog</h2>
          <p className="section-desc">
            Explore our curated beauty rituals, expert hair styling, revitalizing skincare, and nail artistry.
          </p>
        </div>


        {/* Filter & Search Bar */}
        <div className="services-filter-bar">
          {/* Live Search Input */}
          <div className="services-search-wrapper">
            <Search size={18} className="services-search-icon" />
            <input 
              type="text" 
              className="services-search-input"
              placeholder="Search services (e.g., Hydra, Wolf Cut, Majirel, Pedicure, Rica Wax, O3+)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="services-search-clear" 
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Department Tabs */}
          <div className="services-category-tabs">
            {MAIN_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const count = categoryCounts[cat.id] ?? 0;
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`services-cat-tab ${isActive ? 'active' : ''}`}
                >
                  <Icon size={15} />
                  <span>{cat.label}</span>
                  <span className="services-cat-tab-badge">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Multiple Services Notice Banner */}
        <div className="services-notice-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.88rem', color: 'var(--color-text)' }}>
              {searchQuery ? (
                <>Found <strong>{totalFilteredCount}</strong> services matching "<strong>{searchQuery}</strong>"</>
              ) : (
                <>Showing <strong>{totalFilteredCount}</strong> organized services across <strong>{groupedSections.length}</strong> categories.</>
              )}
            </span>
          </div>
          <button 
            type="button" 
            className="btn btn-outline-gold" 
            style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
            onClick={() => onBookService(null)}
          >
            <Calendar size={14} style={{ marginRight: '0.35rem' }} /> Select Multiple &amp; Book
          </button>
        </div>

        {/* Empty State */}
        {groupedSections.length === 0 && (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '600px', margin: '0 auto' }}>
            <Sparkles size={36} style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>No services found</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              We couldn't find any services matching "<strong>{searchQuery}</strong>" in this category.
            </p>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Structured Sections Masonry */}
        <div className="services-sections-masonry">
          {groupedSections.map((section) => {
            const Icon = section.config.icon || Sparkles;

            return (
              <div key={section.key} className="salon-section-card">
                {/* Section Header */}
                <div className="salon-section-header">
                  <div className="salon-section-title-wrap">
                    <div className="salon-section-badge-row">
                      <span className="salon-section-badge">
                        <Icon size={12} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: '-1px' }} />
                        {section.config.badge}
                      </span>
                      <span className="salon-section-count">
                        {section.services.length} {section.services.length === 1 ? 'Service' : 'Services'}
                      </span>
                    </div>
                    <h3 className="salon-section-title">{section.title}</h3>
                    {section.config.subtitle && (
                      <p className="salon-section-desc">{section.config.subtitle}</p>
                    )}
                  </div>
                </div>

                {/* Services List inside this Section */}
                <div className="salon-section-items-list">
                  {section.services.map((service) => (
                    <div key={service.id} className="salon-menu-item-row">
                      <div className="salon-menu-item-info">
                        <div className="salon-menu-item-header">
                          <h4 className="salon-menu-item-name">{service.name}</h4>
                          {service.popular && (
                            <span className="service-popular-tag">Popular</span>
                          )}
                        </div>
                        {service.desc && (
                          <p className="salon-menu-item-desc">{service.desc}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        className="salon-menu-book-btn"
                        onClick={() => onBookService(service.id)}
                        title={`Book ${service.name}`}
                      >
                        Book <ArrowRight size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Navigation CTA */}
        <div style={{ textAlign: 'center', marginTop: '4.5rem' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
            Prefer personal styling recommendations or a bespoke consultation?
          </p>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => onBookService(null)}
          >
            Schedule Consultation Appointment
          </button>
        </div>
      </div>
    </div>
  );
}
