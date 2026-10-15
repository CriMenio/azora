import React, { useState } from 'react';
import { Scissors, Sparkles, Smile } from 'lucide-react';
import { SERVICES_CATALOG } from '../data/servicesCatalog';
import OfferSection from './OfferSection';

const SERVICES_CATEGORIES = [
  { id: 'all', label: 'All Services' },
  { id: 'hair', label: 'Hair Care', icon: <Scissors size={16} /> },
  { id: 'nails', label: 'Nails & Nail Art', icon: <Smile size={16} /> },
  { id: 'beauty', label: 'Beauty & Skin', icon: <Sparkles size={16} /> },
  { id: 'grooming', label: 'Grooming & Wellness', icon: <Smile size={16} /> },
];

const SERVICES_MENU = SERVICES_CATALOG.map(({ id, category, name, desc }) => ({
  id,
  category,
  name,
  desc,
}));

export default function Services({ onBookService }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredServices = activeCategory === 'all' 
    ? SERVICES_MENU 
    : SERVICES_MENU.filter(s => s.category === activeCategory);

  return (
    <div className="animate-fade-in page-padding">
      <div className="container">
        {/* Page Header */}
        <div className="section-header">
          <span className="section-subtitle">Our Offerings</span>
          <h2 className="section-title">Services Menu</h2>
          <p className="section-desc">
            From signature hair colour and blow-dry styling to creative nail art — explore our most loved salon rituals.
          </p>
        </div>

        {/* Festive Special Offers Banner Section */}
        <div style={{ marginBottom: '4rem' }}>
          <OfferSection 
            variant="compact" 
            onOpenBooking={(serviceId) => onBookService(serviceId || 'navratri-offers', 2)} 
            onBookCombo={(combo) => onBookService(combo.id, 2)}
          />
        </div>

        {/* Category Filter Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginBottom: '3.5rem'
        }}>
          {SERVICES_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '0.6rem 1.2rem',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: activeCategory === cat.id ? 'var(--color-primary)' : 'transparent',
                color: activeCategory === cat.id ? 'var(--color-text-dark)' : 'var(--color-text-muted)',
                border: '1px solid',
                borderColor: activeCategory === cat.id ? 'var(--color-primary)' : 'var(--color-border)',
                transition: 'var(--transition-fast)',
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid-3">
          {filteredServices.map((service) => (
            <div 
              key={service.id} 
              className="glass-panel"
              style={{ 
                padding: '2rem', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '280px'
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>
                  {service.name}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  {service.desc}
                </p>
              </div>
              
              <div>
                <button 
                  className="btn btn-outline-gold" 
                  style={{ width: '100%', marginTop: '1.25rem' }}
                  onClick={() => onBookService(service.id)}
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
