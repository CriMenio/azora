import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, Sparkles } from 'lucide-react';
import Logo from './Logo';

export default function Header({ onOpenBooking, theme, toggleTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { path: '/', label: 'Home', end: true },
    { path: '/services', label: 'Services' },
    { path: '/offers', label: 'Offers', badge: 'Special' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/about', label: 'About Us' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <header 
      className="site-header"
      style={{
        boxShadow: scrolled ? 'var(--shadow-md)' : 'none',
        backgroundColor: scrolled ? 'var(--color-header-bg-scrolled)' : 'var(--color-header-bg)',
        borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
      }}
    >
      <div className="container header-container">
        {/* Logo */}
        <Link 
          to="/" 
          className="logo" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Azora Salon & Spa Home"
        >
          <Logo variant="header" />
        </Link>

        {/* Navigation Menu */}
        <nav aria-label="Main Navigation">
          <ul className={`nav-menu ${isOpen ? 'open' : ''}`}>
            {navLinks.map((link) => (
              <li key={link.path}>
                <NavLink 
                  to={link.path}
                  end={link.end}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setIsOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {link.label}
                  {link.badge && (
                    <span className="nav-offer-pill">
                      <Sparkles size={11} style={{ marginRight: '2px' }} />
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
            {/* Mobile Only CTA */}
            <li style={{ display: 'none' }} className="mobile-cta-li">
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={() => { setIsOpen(false); onOpenBooking(); }}
              >
                Book Appointment
              </button>
            </li>
          </ul>
        </nav>

        {/* Desktop Actions */}
        <div className="header-actions" style={{ gap: '1rem' }}>
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme} 
            style={{
              background: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.6rem',
              transition: 'var(--transition-fast)',
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 175, 55, 0.05)',
              border: '1px solid var(--color-gold-border)'
            }}
            className="theme-toggle-btn"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="btn btn-outline-gold" onClick={() => onOpenBooking?.()}>
            Book Appointment
          </button>

          {/* Toggle Menu for Mobile */}
          <button 
            className="menu-toggle" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .mobile-cta-li {
            display: block !important;
          }
        }
      `}} />
    </header>
  );
}

