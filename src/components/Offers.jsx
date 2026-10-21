import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  MessageCircle,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  HeartHandshake,
  Award,
  Scissors,
  Bell,
  Check,
  Crown
} from 'lucide-react';
import OfferSection from './OfferSection';
import { getOfferConfig, fetchOfferFromSpreadsheet } from '../services/offerService';

const SIGNATURE_CURATED_PACKAGES = [
  {
    id: 'pkg-radiance-glow',
    category: 'Full-Service Ritual',
    tag: 'Client Favorite',
    title: 'The Signature Radiance Glow Suite',
    desc: 'Our premier head-to-toe beauty ritual combining clinical skin nourishment with glossy hair finishing and hand care.',
    services: [
      'O3+ Dermatological Radiance Facial / Gold Facial',
      'Signature Wash, Conditioning Mask & Gloss Blow-Dry',
      'Nourishing Spa Manicure with Crystal Exfoliation',
      'Complimentary Skin & Hair Type Consultation'
    ],
    primaryServiceId: 'o3-plus-facial',
    actionText: 'Book This Ritual',
  },
  {
    id: 'pkg-bridal-makeover',
    category: 'Bridal & Occasion',
    tag: 'Bespoke Artistry',
    title: 'Royal Bridal & Milestone Styling Suite',
    desc: 'An exquisite milestone transformation curated personally by senior stylist Preeti for brides, bridesmaids, and gala occasions.',
    services: [
      'Deep Hydra / Ultra-Luminous Bridal Facial Prep',
      'Global Hair Colour / Custom Dimension Highlights',
      'Deluxe Gel Extension / Art Manicure & Pedicure',
      'Gentle Full Body Waxing & Body D-Tan Ritual'
    ],
    primaryServiceId: 'bridal-facial',
    actionText: 'Consult on WhatsApp',
    isWhatsAppAction: true,
  },
  {
    id: 'pkg-executive-grooming',
    category: 'Men’s Grooming',
    tag: 'Popular',
    title: 'Executive Men’s Grooming Lounge',
    desc: 'Sharp, precision detailing designed for professionals and grooms seeking fresh confidence and impeccable grooming.',
    services: [
      'Precision Scissor Haircut & Crisp Contouring',
      'Beard Sculpting, Beard Colour & Hot Towel Treatment',
      'De-Tan Face Pack & Deep Pore Purification Clean-Up',
      'Relaxing Scalp & Facial Stress-Relief Treatment'
    ],
    primaryServiceId: 'mens-basic-haircut',
    actionText: 'Book Grooming Suite',
  },
  {
    id: 'pkg-velvet-spa',
    category: 'Hands & Feet Therapy',
    tag: 'Deep Relaxation',
    title: 'Deluxe Velvet Hand & Foot Indulgence',
    desc: 'A restorative sanctuary for dry skin, tired heels, and dull nails with soothing crystal salt rubs and warm paraffin wax.',
    services: [
      'O3+ Brightening Hand Spa Manicure & Cuticle Care',
      'Restorative Crystal Salt Foot Spa Pedicure',
      'Warm Paraffin Wax Deep Hydration Seal',
      'Long-Wear Chip-Resistant Gel Polish Finishing'
    ],
    primaryServiceId: 'spa-manicure',
    actionText: 'Book Nail Spa',
  },
];

export default function Offers({ onOpenBooking, setActivePage }) {
  const [offerConfig, setOfferConfig] = useState(getOfferConfig);

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

  const handleBookCombo = (combo) => {
    if (onOpenBooking) {
      onOpenBooking(combo.id || 'offer-combo', 2);
    }
  };

  const isSeasonalActive = Boolean(offerConfig?.isActive);

  const whatsappMessage = encodeURIComponent(
    isSeasonalActive
      ? `Hi Azora Salon, I saw your Special Offers on your website and would like to book an appointment!`
      : `Hi Azora Salon, I would like to inquire about booking a signature package / customized beauty ritual!`
  );

  const whatsappVipMessage = encodeURIComponent(
    `Hi Azora Salon, please add me to your VIP Guest List for priority alerts and early-bird notifications on upcoming festive specials!`
  );

  return (
    <div className="azora-offers-page">
      {/* Hero Header */}
      <section className="azora-offers-hero">
        <div className="container">
          <div className="azora-offers-hero-content text-center">
            <div className="azora-offers-hero-badge">
              <Sparkles size={15} className="text-gold" />
              <span>
                {isSeasonalActive ? 'Festive & Seasonal Celebrations' : 'Curated Experiences & Bespoke Rituals'}
              </span>
            </div>

            <h1 className="azora-offers-hero-title">
              {isSeasonalActive ? 'Special Offers & Packages' : 'Curated Packages & Bespoke Rituals'}
            </h1>

            <p className="azora-offers-hero-desc">
              {isSeasonalActive
                ? 'Indulge in tailored festive combos, rejuvenating hair rituals, and luxury grooming packages crafted with care at Azora Salon & Spa, Kamothe.'
                : 'Indulge in personalized full-service makeover rituals, bespoke bridal preparations, and luxury grooming packages crafted with care by founder Preeti at Azora Salon & Spa.'
              }
            </p>

            <div className="azora-offers-hero-actions">
              {isSeasonalActive ? (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onOpenBooking('offer-combo', 1)}
                  >
                    <Calendar size={16} /> Book Current Offer
                  </button>
                  <a
                    href={`https://wa.me/917021929588?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-gold"
                  >
                    <MessageCircle size={16} /> WhatsApp Inquiry
                  </a>
                </>
              ) : (
                <>
                  <Link
                    to="/services"
                    className="btn btn-primary"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    Explore Complete Menu <ArrowRight size={16} />
                  </Link>
                  <a
                    href={`https://wa.me/917021929588?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-gold"
                  >
                    <MessageCircle size={16} /> Request Custom Package
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      {isSeasonalActive ? (
        /* Active Seasonal Interactive Showcase */
        <OfferSection
          variant="page"
          onOpenBooking={(serviceId) => onOpenBooking(serviceId || 'navratri-offers', 2)}
          onBookCombo={handleBookCombo}
        />
      ) : (
        /* Professional Year-Round Curated Packages Showcase */
        <section className="azora-curated-packages-section container">
          <div className="azora-curated-header">
            <span className="section-subtitle">Tailored Luxury Suites</span>
            <h2 className="section-title">Signature Experience Packages</h2>
            <p className="section-desc">
              Hand-selected ritual combinations designed for full-body revitalization, special milestones, and comprehensive pampering.
            </p>
          </div>

          <div className="azora-curated-grid">
            {SIGNATURE_CURATED_PACKAGES.map((pkg) => (
              <div key={pkg.id} className="azora-curated-card">
                <div>
                  <div className="azora-curated-badge-row">
                    <span className="azora-curated-category">{pkg.category}</span>
                    <span className="azora-curated-tag">{pkg.tag}</span>
                  </div>

                  <h3 className="azora-curated-title">{pkg.title}</h3>
                  <p className="azora-curated-desc">{pkg.desc}</p>

                  <ul className="azora-curated-items">
                    {pkg.services.map((item, idx) => (
                      <li key={idx} className="azora-curated-item">
                        <Check size={15} className="azora-curated-item-icon" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="azora-curated-footer">
                  {pkg.isWhatsAppAction ? (
                    <a
                      href={`https://wa.me/917021929588?text=${encodeURIComponent(`Hi Preeti, I am interested in inquiring about the ${pkg.title} at Azora Salon!`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-gold"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <MessageCircle size={15} /> {pkg.actionText}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => onOpenBooking(pkg.primaryServiceId, 1)}
                    >
                      <Calendar size={15} /> {pkg.actionText}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* VIP Festive Notification Banner */}
          <div className="azora-vip-banner">
            <div className="azora-vip-content">
              <div className="azora-vip-icon-wrap">
                <Crown size={24} />
              </div>
              <div className="azora-vip-text">
                <h3>VIP Seasonal Advance Notice</h3>
                <p>
                  We curate exclusive limited-time specials during festive celebrations like Diwali, Navratri, Eid, and New Year. Connect with us to join our VIP Guest List for priority slot bookings and early previews.
                </p>
              </div>
            </div>
            <div className="azora-vip-actions">
              <a
                href={`https://wa.me/917021929588?text=${whatsappVipMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-gold"
              >
                <Bell size={16} /> Join VIP Guest List
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Azora Offers Perks */}
      <section className="azora-offers-perks-section section-padding">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-subtitle">The Azora Difference</span>
            <h2 className="section-title">
              {isSeasonalActive ? 'Why Book Our Special Packages?' : 'Why Choose Azora Rituals?'}
            </h2>
            <p className="section-desc" style={{ maxWidth: '620px', margin: '0 auto' }}>
              Every visit combines personalized stylist attention, hospital-grade hygiene, and authentic luxury products for an uncompromising salon experience.
            </p>
          </div>

          <div className="azora-offers-perks-grid">
            <div className="azora-offers-perk-card glass-panel">
              <div className="azora-offers-perk-icon">
                <Award size={24} />
              </div>
              <h3>100% Genuine Brands</h3>
              <p>We strictly formulate with authentic L'Oréal Professionnel, INOA, OPI, and certified botanical skincare.</p>
            </div>

            <div className="azora-offers-perk-card glass-panel">
              <div className="azora-offers-perk-icon">
                <Scissors size={24} />
              </div>
              <h3>Senior Stylist Preeti</h3>
              <p>10+ years of bridal and hair artistry ensures you receive flawless, customized care tailored to you.</p>
            </div>

            <div className="azora-offers-perk-card glass-panel">
              <div className="azora-offers-perk-icon">
                <ShieldCheck size={24} />
              </div>
              <h3>Hygienic &amp; Sanitized</h3>
              <p>Single-use disposable kits, sterilised tools, and a peaceful, private boutique atmosphere.</p>
            </div>

            <div className="azora-offers-perk-card glass-panel">
              <div className="azora-offers-perk-icon">
                <HeartHandshake size={24} />
              </div>
              <h3>Instant WhatsApp Slip</h3>
              <p>Book online and receive a digital appointment confirmation slip delivered right to WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Book / Redeem */}
      <section className="azora-offers-steps-section container">
        <div className="azora-offers-steps-card glass-panel">
          <div className="section-header text-center" style={{ marginBottom: '2.5rem' }}>
            <span className="section-subtitle">Simple 3-Step Process</span>
            <h2 className="section-title">How Your Booking Works</h2>
          </div>

          <div className="azora-offers-steps-grid">
            <div className="azora-step-box">
              <span className="azora-step-num">01</span>
              <h4>{isSeasonalActive ? 'Choose a Combo' : 'Choose Your Ritual'}</h4>
              <p>
                {isSeasonalActive
                  ? 'Click on any festive combo above to select your preferred package.'
                  : 'Select from our signature suites above or explore our 100+ services catalog.'
                }
              </p>
            </div>

            <div className="azora-step-box">
              <span className="azora-step-num">02</span>
              <h4>Select Date &amp; Slot</h4>
              <p>Pick a date and convenient time slot with founder Preeti at our Kamothe salon.</p>
            </div>

            <div className="azora-step-box">
              <span className="azora-step-num">03</span>
              <h4>Receive Confirmation</h4>
              <p>Your digital slip is generated instantly and shared with our team for zero waiting.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="azora-offers-cta-banner container">
        <div className="azora-offers-cta-box glass-panel">
          <div>
            <h3>Need a Custom Group, Family, or Bridal Bundle?</h3>
            <p>Visiting with friends or planning a bridal party? Talk to our stylist to curate custom celebration bundles.</p>
          </div>
          <div className="azora-offers-cta-actions">
            <a
              href="tel:+917021929588"
              className="btn btn-secondary"
            >
              <Phone size={16} /> Call +91 70219 29588
            </a>
            <a
              href={`https://wa.me/917021929588?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <MessageCircle size={16} /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
