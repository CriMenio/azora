import React from 'react';
import { ShieldCheck, Eye, Heart, Sparkles } from 'lucide-react';

const STAFF_MEMBERS = [
  {
    name: 'Preeti',
    role: 'Founder & Senior Beauty Specialist',
    bio: 'With over 3 years of professional salon experience, Preeti specializes in custom bridal styling, advanced facials, and modern haircuts, delivering premium personal care to each guest.',
    image: '/images/gallery_makeup.png'
  }
];

export default function AboutUs() {
  return (
    <div className="animate-fade-in page-padding">
      <div className="container">
        {/* Page Header */}
        <div className="section-header">
          <span className="section-subtitle">Our Legacy</span>
          <h2 className="section-title">About Azora Salon</h2>
        </div>

        {/* Salon Story Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center',
          marginBottom: '7rem'
        }} className="story-grid-mobile">
          {/* Story Text */}
          <div>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
              A New Sanctuary of Beauty & Styling
            </h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '1.05rem', lineHeight: '1.7' }}>
              Azora is a newly opened boutique beauty salon in Kamothe, Navi Mumbai. We were founded on the principle of providing a calm, premium space where clients can receive undivided personal care.
            </p>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: '1.7' }}>
              What started as a boutique beauty studio has evolved into a premier wellness retreat in Kamothe, Navi Mumbai. Our name, Azora, represents the unique radiant energy that each of our clients possesses. We don't change how you look—we highlight your existing natural beauty so your inner aura shines through.
            </p>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.7' }}>
              We collaborate with premier global brands to procure organic, botanical hair masks, non-toxic colors, and advanced dermatology-tested serums. Your wellness, safety, and sensory pleasure are at the center of everything we do.
            </p>
          </div>

          {/* Large Visual Story Block */}
          <div 
            className="glass-panel"
            style={{
              padding: '0',
              height: '450px',
              overflow: 'hidden',
              border: '1px solid var(--color-border)',
              position: 'relative'
            }}
          >
            <img 
              src="/images/hero_salon.png" 
              alt="Salon Interior" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            {/* Embedded Badge overlay */}
            <div style={{
              position: 'absolute',
              bottom: '2rem',
              left: '2rem',
              backgroundColor: 'rgba(13, 13, 13, 0.9)',
              border: '1px solid var(--color-primary)',
              padding: '1.5rem 2.5rem',
              backdropFilter: 'blur(5px)'
            }}>
              <h4 style={{ color: 'var(--color-primary)', fontSize: '2rem', fontWeight: '600' }}>3+</h4>
              <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff' }}>
                Years of Styling Expertise
              </p>
            </div>
          </div>
        </div>

        {/* Core Values Section */}
        <div style={{ marginBottom: '8rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span className="section-subtitle">Our Values</span>
            <h3 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)' }}>What Makes Us Unique</h3>
          </div>

          <div className="grid-3">
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{ color: 'var(--color-primary)', marginBottom: '1.5rem', display: 'inline-block' }}>
                <Sparkles size={32} />
              </div>
              <h4 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text-bright)' }}>Bespoke Tailoring</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                Every scalp, face shape, and skin tone is unique. We conduct detailed consultations before every service to ensure optimal personalized outcomes.
              </p>
            </div>

            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{ color: 'var(--color-primary)', marginBottom: '1.5rem', display: 'inline-block' }}>
                <ShieldCheck size={32} />
              </div>
              <h4 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text-bright)' }}>Purity & Safety</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                Medical-grade sterilization for all metal instruments, clean air filters, and entirely cruelty-free, paraben-free luxury skincare formulas.
              </p>
            </div>

            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{ color: 'var(--color-primary)', marginBottom: '1.5rem', display: 'inline-block' }}>
                <Heart size={32} />
              </div>
              <h4 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text-bright)' }}>Mindful Rejuvenation</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                A salon experience shouldn't feel rushed. We pace our appointments to ensure you enjoy complimentary espresso, tea, and warm scalp massages.
              </p>
            </div>
          </div>
        </div>

        {/* Staff / Artists Section
        <div>
          <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
            <span className="section-subtitle">The Experts</span>
            <h3 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-heading)' }}>Meet Our Master Artists</h3>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {STAFF_MEMBERS.map((staff, index) => (
              <div 
                key={index} 
                className="staff-card"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                  transition: 'var(--transition-smooth)',
                  maxWidth: '380px',
                  width: '100%'
                }}
              >
                <div style={{ height: '280px', overflow: 'hidden' }}>
                  <img 
                    src={staff.image} 
                    alt={staff.name} 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'var(--transition-smooth)'
                    }}
                    className="staff-img"
                  />
                </div>
                <div style={{ padding: '2rem' }}>
                  <span style={{ color: 'var(--color-primary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>
                    {staff.role}
                  </span>
                  <h4 style={{ fontSize: '1.3rem', color: 'var(--color-text-bright)', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
                    {staff.name}
                  </h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    {staff.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div> */}

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .story-grid-mobile {
            grid-template-columns: 1fr !important;
          }
        }
        .staff-card:hover {
          border-color: var(--color-primary) !important;
          box-shadow: var(--shadow-md), var(--shadow-glow);
          transform: translateY(-5px);
        }
        .staff-card:hover .staff-img {
          transform: scale(1.05);
        }
      `}} />
    </div>
  );
}
