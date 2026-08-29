import React, { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import Logo from './Logo';

export default function Header({ activePage, setActivePage, onOpenBooking, theme, toggleTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'about', label: 'About Us' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        <a href="#home" className="logo" onClick={(e) => { e.preventDefault(); handleNavClick('home'); }}>
          <Logo variant="header" />
        </a>

        {/* Navigation Menu */}
        <nav>
          <ul className={`nav-menu ${isOpen ? 'open' : ''}`}>
            {navLinks.map((link) => (
              <li key={link.id}>
                <span 
                  className={`nav-link ${activePage === link.id ? 'active' : ''}`}
                  onClick={() => handleNavClick(link.id)}
                >
                  {link.label}
                </span>
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

          <button className="btn btn-outline-gold" onClick={onOpenBooking}>
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
