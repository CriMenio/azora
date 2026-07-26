import React, { useState } from 'react';
import { Scissors, Sparkles, Smile, Clock } from 'lucide-react';

const SERVICES_CATEGORIES = [
  { id: 'all', label: 'All Services' },
  { id: 'hair', label: 'Hair Care', icon: <Scissors size={16} /> },
  { id: 'beauty', label: 'Beauty & Skincare', icon: <Sparkles size={16} /> },
  { id: 'grooming', label: 'Grooming & Nails', icon: <Smile size={16} /> },
];

const SERVICES_MENU = [
  // Hair Category
  {
    id: 'haircut',
    category: 'hair',
    name: 'Artisanal Hair Cut',
    price: 500,
    duration: '45 mins',
    desc: 'Bespoke precision cut tailored to your hair texture and facial structure. Includes refreshing scalp massage and hot-towel blow-out styling.'
  },
  {
    id: 'hairspa',
    category: 'hair',
    name: 'Nourishing Hair Spa',
    price: 1200,
    duration: '60 mins',
    desc: 'Deep conditioning service using botanical moisture masks and steam activation to repair cuticles and restore natural luster.'
  },
  {
    id: 'haircoloring',
    category: 'hair',
    name: 'Balayage & Hair Coloring',
    price: 2500,
    duration: '120 mins',
    desc: 'Expert color formulation including full foils, creative highlights, or root touchups, using premium damage-free organic dyes.'
  },
  // Beauty Category
  {
    id: 'facial',
    category: 'beauty',
    name: 'Radiance Gold Facial',
    price: 1500,
    duration: '60 mins',
    desc: 'Indulgent multi-step skin therapy: gentle steam exfoliation, ultrasonic blackhead cleaning, hydration facial massage, and luxury mask.'
  },
  {
    id: 'waxing',
    category: 'beauty',
    name: 'Silk Touch Waxing (Full)',
    price: 1000,
    duration: '45 mins',
    desc: 'Gentle, low-temperature wax service for smooth skin. Includes nourishing aloe vera post-wax calming serum.'
  },
  {
    id: 'threading',
    category: 'beauty',
    name: 'Precision Threading (Brows)',
    price: 150,
    duration: '15 mins',
    desc: 'Organic cotton threading technique to map and sculpt perfect eyebrows and clean facial line definition.'
  },
  // Grooming Category
  {
    id: 'beardstyling',
    category: 'grooming',
    name: 'Classic Beard Styling & Shave',
    price: 300,
    duration: '30 mins',
    desc: 'Straight razor trim, edge alignment, essential oil hot towel wrap, and moisturizing balm application.'
  },
  {
    id: 'manicure',
    category: 'grooming',
    name: 'Azora Signature Manicure',
    price: 600,
    duration: '45 mins',
    desc: 'Nail shaping, cuticle grooming, exfoliating hand massage, and professional regular or gel polish application.'
  },
  {
    id: 'pedicure',
    category: 'grooming',
    name: 'Restorative Pedicure Ritual',
    price: 800,
    duration: '50 mins',
    desc: 'Warm foot soak, sea salt scrub, nail/heel smoothing, calming massage, and polish inside our massage chair.'
  }
];

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
          <span className="section-subtitle">Our Rituals</span>
          <h2 className="section-title">Our Salon Services</h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '600px', margin: '1.5rem auto 0', fontSize: '1rem' }}>
            Explore our curated menu of hair, beauty, and grooming services. We combine luxury products with master techniques to give you exceptional results.
          </p>
        </div>

        {/* Categories Tab Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '4.5rem'
        }}>
          {SERVICES_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.8rem 1.8rem',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: '500',
                cursor: 'pointer',
                backgroundColor: activeCategory === cat.id ? 'var(--color-primary)' : 'rgba(22, 22, 22, 0.4)',
                color: activeCategory === cat.id ? 'var(--color-text-dark)' : 'var(--color-text)',
                border: '1px solid',
                borderColor: activeCategory === cat.id ? 'var(--color-primary)' : 'var(--color-border)',
                transition: 'var(--transition-smooth)',
                borderRadius: '0'
              }}
              className="service-tab-btn"
            >
              {cat.icon && cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services Menu Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '3rem 2.5rem',
        }} className="menu-grid-mobile">
          {filteredServices.map(service => (
            <div 
              key={service.id}
              className="glass-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '2.5rem',
                height: '100%',
                position: 'relative'
              }}
            >
              <div>
                {/* Header item */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-bright)', fontWeight: '600' }}>{service.name}</h3>
                </div>

                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.7' }}>
                  {service.desc}
                </p>
              </div>

              {/* CTA Booking hook */}
              <button 
                className="btn btn-outline-gold" 
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.8rem' }}
                onClick={() => onBookService(service.id)}
              >
                Book This Service
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 576px) {
          .menu-grid-mobile {
            grid-template-columns: 1fr !important;
          }
        }
        .service-tab-btn:hover {
          border-color: var(--color-primary) !important;
          color: var(--color-primary) !important;
          background-color: transparent !important;
        }
        .service-tab-btn:hover svg {
          stroke: var(--color-primary);
        }
      `}} />
    </div>
  );
}
