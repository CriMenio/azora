import { Phone, Mail, MapPin } from 'lucide-react';
import Logo from './Logo';

const Instagram = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Facebook = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Twitter = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

export default function Footer({ setActivePage }) {
  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="site-footer" className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-col">
            <div className="logo footer-logo">
              <Logo variant="footer" />
            </div>
            <p style={{ maxWidth: '280px', marginBottom: '1rem' }}>
              A sanctuary of elegance and luxury. Experience premium hair, beauty, and grooming rituals designed to revive your senses and enhance your natural beauty.
            </p>
            <p className="footer-founders">
              <span className="footer-founders-label">Co-Founders</span>
              <span className="footer-founders-names">Jyoti Chauhan &amp; Preeti Chauhan</span>
            </p>
            <div className="social-links">
              <a href="https://instagram.com/azorasalon" target="_blank" rel="noreferrer" className="social-icon" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="https://facebook.com/azorasalon" target="_blank" rel="noreferrer" className="social-icon" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="https://twitter.com/azorasalon" target="_blank" rel="noreferrer" className="social-icon" aria-label="Twitter">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><span onClick={() => handleNavClick('home')}>Home</span></li>
              <li><span onClick={() => handleNavClick('services')}>Services</span></li>
              <li><span onClick={() => handleNavClick('about')}>About Us</span></li>
              <li><span onClick={() => handleNavClick('contact')}>Contact</span></li>
              <li><span onClick={() => handleNavClick('admin')}>Admin</span></li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div className="footer-col">
            <h3>Hours</h3>
            <p className="footer-hours">Mon – Sun: 10AM to 10PM</p>
          </div>

          {/* Contact Details */}
          <div className="footer-col">
            <h3>Contact Us</h3>
            <ul className="footer-links" style={{ gap: '1rem' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                <MapPin size={18} className="text-gold" style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '0.2rem' }} />
                <span>Shop No:4, Floor No:Ground, Skyline Residency CHS LTD, Sector: 08, Plot: 05, Kamothe, Navi Mumbai, District: Raigad, Maharashtra 410209</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                <Phone size={18} className="text-gold" style={{ color: 'var(--color-primary)' }} />
                <a href="tel:+917021929588">+91 70219 29588</a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                <Mail size={18} className="text-gold" style={{ color: 'var(--color-primary)' }} />
                <a href="mailto:azorasalon@gmail.com">azorasalon@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Azora Salon & Spa. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => handleNavClick('about')}>Privacy Policy</span>
            <span style={{ cursor: 'pointer' }} onClick={() => handleNavClick('contact')}>Terms of Service</span>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .footer-links span {
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .footer-links span:hover {
          color: var(--color-primary);
          padding-left: 5px;
        }
      `}} />
    </footer>
  );
}
