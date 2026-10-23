import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShieldCheck, Award, Sparkles, MapPin, Phone, MessageCircle, ArrowRight } from 'lucide-react';

import { getTestimonials, saveToSpreadsheet } from '../services/spreadsheetService';
import ScrollDownButton from './ScrollDownButton';
import Logo from './Logo';
import { SITE_IMAGES } from '../assets/siteImages';

function TestimonialCard({ test }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const WORD_LIMIT = 20;

  const quote = (test.quote || '').trim();
  const words = quote ? quote.split(/\s+/) : [];
  const isLong = words.length > WORD_LIMIT;

  const truncatedQuote = isLong ? words.slice(0, WORD_LIMIT).join(' ') : quote;

  return (
    <div 
      className="glass-panel animate-scale-up testimonial-card" 
      style={{ 
        padding: '2.2rem', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        borderRadius: '16px',
        transition: 'all 0.3s ease',
        height: '100%',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', gap: '0.2rem', color: 'var(--color-primary)' }}>
            {[...Array(test.stars || 5)].map((_, i) => (
              <Star key={i} size={15} fill="currentColor" />
            ))}
          </div>
          {test.role && String(test.role).toLowerCase().includes('google') && (
            <span style={{ 
              fontSize: '0.72rem', 
              color: 'var(--color-primary)', 
              fontWeight: '600', 
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              ✓ Google Verified
            </span>
          )}
        </div>

        <p style={{ 
          fontStyle: 'italic', 
          color: 'var(--color-text)', 
          fontSize: '0.94rem', 
          marginBottom: '1.75rem', 
          lineHeight: '1.7' 
        }}>
          "{isExpanded || !isLong ? quote : `${truncatedQuote}...`}"
          {isLong && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: '600',
                fontSize: '0.88rem',
                cursor: 'pointer',
                padding: '0 0 0 6px',
                fontStyle: 'normal',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                display: 'inline',
              }}
              aria-expanded={isExpanded}
            >
              {isExpanded ? 'Show less' : '..more'}
            </button>
          )}
        </p>
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.9rem', 
        borderTop: '1px solid var(--color-border)', 
        paddingTop: '1.25rem',
        marginTop: 'auto'
      }}>
        <div style={{ 
          width: '42px', 
          height: '42px', 
          borderRadius: '50%', 
          backgroundColor: 'var(--color-primary)', 
          color: 'var(--color-text-dark)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontWeight: '700', 
          fontSize: '0.9rem',
          flexShrink: 0
        }}>
          {test.avatar || (test.name ? test.name.trim().substring(0, 2).toUpperCase() : 'U')}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <h4 style={{ 
            fontSize: '0.92rem', 
            fontWeight: '600', 
            color: 'var(--color-text-bright)', 
            margin: 0,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden'
          }}>
            {test.name}
          </h4>
          <p style={{ 
            fontSize: '0.74rem', 
            color: 'var(--color-text-muted)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            margin: '2px 0 0'
          }}>
            {test.role}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home({ setActivePage, onOpenBooking, theme }) {
  const DEFAULT_TESTIMONIALS = [
    {
      name: "Ananya Mehta",
      role: "Bridal Client",
      quote: "Azora is a beautiful new salon in Kamothe! Preeti did my bridal makeup and it was absolutely stunning. She took her time, was extremely gentle, and understood exactly what look I wanted.",
      stars: 5,
      avatar: "AM"
    },
    {
      name: "Rahul Patel",
      role: "Regular Client",
      quote: "Excellent service! Visited for a haircut and beard styling. Preeti has great styling sense and the salon environment is very clean and peaceful. Highly recommend this new place.",
      stars: 5,
      avatar: "RP"
    },
    {
      name: "Priya Sharma",
      role: "Skincare Client",
      quote: "Tried their gold facial service. Preeti's years of experience really shows in her massage technique and skin service. So happy to have a high-quality salon nearby!",
      stars: 5,
      avatar: "PS"
    }
  ];

  const [reviews, setReviews] = useState(DEFAULT_TESTIMONIALS);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState({ name: '', role: '', quote: '', stars: 5 });
  const [formErrors, setFormErrors] = useState({});
  const [hoveredStar, setHoveredStar] = useState(0);

  // Target date set to exactly 1 week from June 28 (July 5, 2026, 10:00:00 AM)
  const targetDate = new Date('2026-07-05T10:00:00').getTime();

  const calculateTimeLeft = () => {
    const difference = targetDate - new Date().getTime();
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isOver: false
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadReviews() {
      const data = await getTestimonials();
      if (data && data.length > 0) {
        setReviews(data);
      }
      setLoading(false);
    }
    loadReviews();
  }, []);

  const handleStarClick = (rating) => {
    setFeedbackInput(prev => ({ ...prev, stars: rating }));
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!feedbackInput.name.trim()) newErrors.name = 'Name is required';
    if (!feedbackInput.role.trim()) newErrors.role = 'Service is required (e.g. Haircut Client)';
    if (!feedbackInput.quote.trim()) newErrors.quote = 'Feedback text is required';

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setFormErrors({});

    const result = await saveToSpreadsheet({
      formType: 'feedback',
      name: feedbackInput.name,
      role: feedbackInput.role,
      quote: feedbackInput.quote,
      stars: feedbackInput.stars
    });

    setSubmitting(false);

    if (result.success) {
      setSubmitSuccess(true);
      
      const parts = feedbackInput.name.split(" ");
      const avatar = parts.map(p => p[0]).join("").substring(0, 2).toUpperCase();
      
      const newReview = {
        name: feedbackInput.name,
        role: feedbackInput.role,
        quote: feedbackInput.quote,
        stars: feedbackInput.stars,
        avatar: avatar || 'U'
      };

      setReviews(prev => [newReview, ...prev]);
      setFeedbackInput({ name: '', role: '', quote: '', stars: 5 });
    } else {
      alert('Failed to submit review: ' + (result.error || 'Unknown error'));
    }
  };

  const features = [
    {
      icon: <Sparkles size={24} />,
      title: "Expert Professionals",
      desc: "Our experienced stylists provide personalized hair and beauty services with attention to every detail."
    },
    {
      icon: <ShieldCheck size={24}/>,
      title: "Premium Products",
      desc: "We use trusted, high-quality products that are safe for your hair and skin."
    },
    {
      icon: <Award size={24}  />,
      title: "Relaxing Experience",
      desc: "Enjoy a clean, comfortable, and welcoming environment where you can unwind and feel refreshed."
    }
  ];

  const featuredServices = [
    {
      name: "Rich Hair Color & Blow-Dry",
      desc: "Deep burgundy tones with layered V-cut, conditioning treatment, and a glossy signature blow-dry.",
      image: SITE_IMAGES.featured.hairColor,
    },
    {
      name: "Elegant French Manicure",
      desc: "Almond-shaped nails with a sheer nude base, precise burgundy French tips, and a premium gel finish.",
      image: SITE_IMAGES.featured.frenchManicure,
    },
    {
      name: "Creative Nail Art",
      desc: "Playful hand-painted designs with bold colours, custom patterns, and long-lasting gel polish.",
      image: SITE_IMAGES.featured.nailArt,
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Banner Section */}
      <section 
        className="hero-section"
        style={{
          backgroundImage: theme === 'dark'
            ? 'linear-gradient(to right, rgba(0, 0, 0, 0.85) 40%, rgba(0, 0, 0, 0.4) 100%), url("/images/hero_salon.png")'
            : 'linear-gradient(to right, rgba(243, 238, 228, 0.88) 0%, rgba(243, 238, 228, 0.62) 38%, rgba(243, 238, 228, 0.22) 62%, rgba(20, 18, 15, 0.12) 100%), url("/images/hero_salon.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '650px' }}>
            <div className="hero-signboard animate-fade-in">
              <div className="hero-signboard-logo">
                <Logo variant="hero" className="hero-signboard-logo-img" alt="Azora" />
              </div>
              <p className="hero-signboard-family">Family Salon</p>
              <p className="hero-signboard-services">Nail | Hair | Makeup | Skin</p>
            </div>

            <h1 className="hero-title animate-fade-in">
              Where Luxury <br />Meets Perfection.
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', marginBottom: '2.5rem', maxWidth: '500px' }}>
              Experience premium salon services designed to help you look confident, feel refreshed, and express your unique style. 
            </p>

            {/* Live Hero Countdown */}
            {!timeLeft.isOver && (
              <div className="hero-countdown animate-fade-in">
                <span className="hero-countdown-label">GRAND OPENING COUNTDOWN</span>
                <div className="hero-countdown-timer">
                  <div className="timer-block">
                    <span className="timer-val">{String(timeLeft.days).padStart(2, '0')}</span>
                    <span className="timer-unit">Days</span>
                  </div>
                  <div className="timer-divider">:</div>
                  <div className="timer-block">
                    <span className="timer-val">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="timer-unit">Hours</span>
                  </div>
                  <div className="timer-divider">:</div>
                  <div className="timer-block">
                    <span className="timer-val">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="timer-unit">Mins</span>
                  </div>
                  <div className="timer-divider">:</div>
                  <div className="timer-block">
                    <span className="timer-val pulse-val">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="timer-unit">Secs</span>
                  </div>
                </div>
              </div>
            )}

            <div className="hero-cta">
              <button className="btn btn-primary" onClick={() => onOpenBooking?.()}>
                Book Appointment
              </button>
              <Link 
                to="/services" 
                className="btn btn-secondary" 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Explore Services
              </Link>
            </div>
          </div>
        </div>
        <ScrollDownButton targetId="home-intro" />
      </section>

      {/* Salon Introduction / Trust Badges */}
      <section id="home-intro" className="section-padding" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="container">
          <div className="intro-grid">
            <div>
              <span className="section-subtitle">Our Philosophy</span>
              <h2 className="section-title" style={{ marginBottom: '2rem' }}>Redefine Your Style, Renew Your Spirit</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '1.05rem' }}>
                Azora is a newly opened boutique beauty salon in Kamothe, Navi Mumbai. Co-founded by <strong style={{ color: 'var(--color-text-bright)' }}>Jyoti Chauhan</strong> and <strong style={{ color: 'var(--color-text-bright)' }}>Preeti Chauhan</strong>, we combine dedicated personal care with a relaxing atmosphere to help you shine.
              </p>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                Every tool is meticulously sterilized, and every product is hand-selected from top organic luxury brands. Experience personalized beauty services designed for your ultimate comfort.
              </p>
              
              {/* Stat Counters */}
              <div className="stats-container">
                <div className="stat-item">
                  <h3>8+</h3>
                  <p>Years of Experience</p>
                </div>
                <div className="stat-item">
                  <h3>1-on-1</h3>
                  <p>Personal Care</p>
                </div>
                <div className="stat-item">
                  <h3>100%</h3>
                  <p>Premium Products</p>
                </div>
              </div>
            </div>

            {/* Introduction Icons Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {features.map((feature, index) => (
                <div key={index} className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--color-primary)', backgroundColor: 'rgba(212, 175, 55, 0.08)', padding: '1rem', borderRadius: '4px' }}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--color-text-bright)' }}>{feature.title}</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* Featured Services */}
      <section className="section-padding">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Exquisite Highlights</span>
            <h2 className="section-title">Featured Services</h2>
          </div>

          <div className="grid-3" style={{ marginBottom: '4rem' }}>
            {featuredServices.map((service, index) => (
              <div 
                key={index} 
                className="featured-card"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <div style={{ height: '220px', overflow: 'hidden', position: 'relative' }}>
                  <img 
                    src={service.image} 
                    alt={service.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'var(--transition-smooth)' }} 
                    className="card-image"
                  />
                </div>
                <div style={{ padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>{service.name}</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', minHeight: '66px', marginBottom: '1.5rem' }}>{service.desc}</p>
                  <button 
                    className="btn btn-outline-gold" 
                    style={{ width: '100%', padding: '0.75rem' }}
                    onClick={() => onOpenBooking?.()}
                  >
                    Reserve Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link 
              to="/services"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                color: 'var(--color-primary)',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontSize: '0.85rem'
              }}
              className="view-all-link"
            >
              View Full Service Menu <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="section-padding" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Client Praise</span>
            <h2 className="section-title">Customer Testimonials</h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
              Loading testimonials...
            </div>
          ) : (
            <div className="grid-3">
              {reviews.slice(0, 6).map((test, index) => (
                <TestimonialCard key={index} test={test} />
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            {!showForm ? (
              <button 
                className="btn btn-primary" 
                onClick={() => { setShowForm(true); setSubmitSuccess(false); }}
              >
                Write a Review
              </button>
            ) : (
              <div className="glass-panel form-panel review-form-panel animate-scale-up">
                <h3 style={{ fontSize: '1.5rem', color: 'var(--color-text-bright)', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
                  Share Your Experience
                </h3>
                
                {submitSuccess ? (
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ color: 'var(--color-primary)', marginBottom: '1rem', display: 'inline-flex' }}>
                      <Star size={44} fill="currentColor" />
                    </div>
                    <h4 style={{ fontSize: '1.25rem', color: 'var(--color-text-bright)', marginBottom: '0.5rem' }}>
                      Thank You!
                    </h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                      Your review has been successfully submitted and saved. We appreciate your feedback!
                    </p>
                    <button className="btn btn-outline-gold" onClick={() => setShowForm(false)}>
                      Close Form
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={feedbackInput.name} 
                        onChange={(e) => {
                          setFeedbackInput(prev => ({ ...prev, name: e.target.value }));
                          if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                        }}
                        placeholder="E.g., Sarah Jenkins"
                      />
                      {formErrors.name && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.35rem' }}>{formErrors.name}</p>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Service Received</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={feedbackInput.role} 
                        onChange={(e) => {
                          setFeedbackInput(prev => ({ ...prev, role: e.target.value }));
                          if (formErrors.role) setFormErrors(prev => ({ ...prev, role: '' }));
                        }}
                        placeholder="E.g., Hair Spa Client"
                      />
                      {formErrors.role && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.35rem' }}>{formErrors.role}</p>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Rating</label>
                      <div style={{ display: 'flex', gap: '0.4rem', fontSize: '1.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleStarClick(star)}
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0',
                              color: star <= (hoveredStar || feedbackInput.stars) ? 'var(--color-primary)' : 'var(--color-border)',
                              transition: 'var(--transition-fast)'
                            }}
                          >
                            <Star size={24} fill={star <= (hoveredStar || feedbackInput.stars) ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Your Review</label>
                      <textarea 
                        className="form-control" 
                        value={feedbackInput.quote} 
                        onChange={(e) => {
                          setFeedbackInput(prev => ({ ...prev, quote: e.target.value }));
                          if (formErrors.quote) setFormErrors(prev => ({ ...prev, quote: '' }));
                        }}
                        placeholder="Tell others about your experience at Azora..."
                        rows="4"
                      />
                      {formErrors.quote && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.35rem' }}>{formErrors.quote}</p>}
                    </div>

                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => setShowForm(false)}
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary" 
                        style={{ flex: 2 }}
                        disabled={submitting}
                      >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </section>


      {/* Quick Contact & Directions */}
      <section className="section-padding">
        <div className="container">
          <div className="grid-2" style={{ alignItems: 'center' }}>
            <div>
              <span className="section-subtitle">Plan Your Visit</span>
              <h2 className="section-title" style={{ marginBottom: '2rem' }}>We Welcome You to Azora</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
                Walk-ins are welcomed, but booking in advance secures your stylist and avoids any wait time. Click below to secure your spot or connect with us directly on WhatsApp.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <MapPin size={20} style={{ color: 'var(--color-primary)' }} />
                  <span style={{ color: 'var(--color-text-muted)' }}>Shop No:4, Ground Floor, Skyline Residency CHS LTD, Sector: 08, Plot: 05, Kamothe, Navi Mumbai, Maharashtra 410209</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Phone size={20} style={{ color: 'var(--color-primary)' }} />
                  <span style={{ color: 'var(--color-text-muted)' }}>+91 70219 29588</span>
                </div>
              </div>

              <div className="hero-cta">
                <button className="btn btn-primary" onClick={() => onOpenBooking?.()}>
                  Book Appointment
                </button>
                <a 
                  href="https://wa.me/917021929588?text=Hello%20Azora%20Salon!%20I'd%20like%20to%20inquire%20about%20booking%20an%20appointment." 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-secondary btn-whatsapp"
                >
                  <MessageCircle size={18} fill="currentColor" /> Chat on WhatsApp
                </a>
              </div>
            </div>

            {/* Quick Map Placeholder Card */}
            <div className="glass-panel" style={{ padding: '0.5rem', overflow: 'hidden', height: '400px', display: 'flex' }}>
              <iframe 
                title="Azora Location Map"
                src="https://maps.google.com/maps?q=Skyline%20Residency%20CHS%20LTD%2C%20Sector%208%2C%20Kamothe%2C%20Navi%20Mumbai&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Style blocks are now moved to index.css */}
    </div>
  );
}
