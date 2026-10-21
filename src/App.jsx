import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Services from './components/Services';
import Gallery from './components/Gallery';
import AboutUs from './components/AboutUs';
import Contact from './components/Contact';
import BookingModal from './components/BookingModal';
import AdminPanel from './components/AdminPanel';
import Offers from './components/Offers';
import Celebration from './components/Celebration';
import ScrollToFooter from './components/ScrollToFooter';
import SeoMeta from './components/SeoMeta';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [bookingInitialStep, setBookingInitialStep] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Backward compatibility: Convert legacy hash URLs (#services, #admin, etc.) to proper clean paths
  useEffect(() => {
    const hash = window.location.hash || '';
    if (hash) {
      if (hash.startsWith('#admin')) {
        navigate('/admin', { replace: true });
      } else if (hash === '#offers') {
        navigate('/offers', { replace: true });
      } else if (hash === '#services') {
        navigate('/services', { replace: true });
      } else if (hash === '#gallery') {
        navigate('/gallery', { replace: true });
      } else if (hash === '#about') {
        navigate('/about', { replace: true });
      } else if (hash === '#contact') {
        navigate('/contact', { replace: true });
      } else if (hash === '#home') {
        navigate('/', { replace: true });
      }
    }
  }, [navigate]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Celebration animation on Home page
  useEffect(() => {
    if (location.pathname === '/') {
      setShowCelebration(false);
      const delayTimer = setTimeout(() => {
        setShowCelebration(true);
      }, 100);

      const clearTimer = setTimeout(() => {
        setShowCelebration(false);
      }, 4000);

      return () => {
        clearTimeout(delayTimer);
        clearTimeout(clearTimer);
      };
    } else {
      setShowCelebration(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const navigateTo = (page) => {
    if (!page || page === 'home' || page === '/') {
      navigate('/');
    } else {
      navigate(`/${page.replace(/^\//, '')}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleOpenBooking = (serviceId = '', step = 1) => {
    setSelectedServiceId(serviceId);
    setBookingInitialStep(step);
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    setSelectedServiceId('');
    setBookingInitialStep(1);
  };

  // Dedicated Admin Screen (no customer header/footer)
  if (location.pathname.startsWith('/admin')) {
    return (
      <>
        <SeoMeta
          title="Admin Portal | Azora Salon & Spa"
          description="Restricted admin portal for Azora Salon & Spa."
          canonicalPath="/admin"
          noindex={true}
        />
        <AdminPanel
          theme={theme}
          toggleTheme={toggleTheme}
          onExit={() => navigateTo('home')}
        />
      </>
    );
  }

  return (
    <div className="app-container">
      {showCelebration && <Celebration />}

      {/* Premium Sticky Navigation Header */}
      <Header 
        onOpenBooking={() => handleOpenBooking()} 
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area with Route Switching */}
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <SeoMeta
                  title="Azora Salon & Spa | Premium Hair, Beauty & Grooming in Kamothe, Navi Mumbai"
                  description="Experience premium grooming, hair spa, balayage coloring, and rejuvenating beauty treatments at Azora Salon & Spa in Kamothe, Navi Mumbai. Book your experience today."
                  canonicalPath="/"
                />
                <Home 
                  setActivePage={navigateTo} 
                  onOpenBooking={(serviceId, step) => handleOpenBooking(serviceId, step)} 
                  theme={theme}
                />
              </>
            }
          />
          <Route
            path="/services"
            element={
              <>
                <SeoMeta
                  title="Salon Services & Menu | Hair, Skin & Spa | Azora Salon Kamothe"
                  description="Explore our full menu of hair styling, keratin treatments, skin care, facials, bridal packages, and grooming rituals at Azora Salon & Spa."
                  canonicalPath="/services"
                />
                <Services 
                  onBookService={(serviceId, step) => handleOpenBooking(serviceId, step)} 
                />
              </>
            }
          />
          <Route
            path="/offers"
            element={
              <>
                <SeoMeta
                  title="Exclusive Offers & Packages | Azora Salon & Spa Kamothe"
                  description="Check out current seasonal salon offers, bridal specials, combo packages, and exclusive grooming deals at Azora Salon."
                  canonicalPath="/offers"
                />
                <Offers 
                  onOpenBooking={(serviceId, step) => handleOpenBooking(serviceId, step)} 
                  setActivePage={navigateTo}
                />
              </>
            }
          />
          <Route
            path="/gallery"
            element={
              <>
                <SeoMeta
                  title="Gallery & Transformations | Azora Salon & Spa Kamothe"
                  description="Take a visual tour of Azora Salon's aesthetic interiors, state-of-the-art workstations, and beautiful client hair and beauty transformations."
                  canonicalPath="/gallery"
                />
                <Gallery />
              </>
            }
          />
          <Route
            path="/about"
            element={
              <>
                <SeoMeta
                  title="About Us | Luxury Salon Experience | Azora Salon Kamothe"
                  description="Discover the story behind Azora Salon & Spa, founded by Jyoti Chauhan & Preeti Chauhan. Dedicated to providing personalized, luxury beauty and grooming."
                  canonicalPath="/about"
                />
                <AboutUs />
              </>
            }
          />
          <Route
            path="/contact"
            element={
              <>
                <SeoMeta
                  title="Contact Us & Salon Location | Sector 8 Kamothe | Azora Salon"
                  description="Visit Azora Salon & Spa at Skyline Residency, Sector 8, Kamothe, Navi Mumbai. Call +91 70219 29588 or get directions. Open 10 AM to 10 PM daily."
                  canonicalPath="/contact"
                />
                <Contact />
              </>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Persistent Global Footer */}
      <Footer />

      <ScrollToFooter />

      {/* Step-by-Step Booking Form wizard Modal */}
      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={handleCloseBooking} 
        initialServiceId={selectedServiceId} 
        initialStep={bookingInitialStep}
        theme={theme}
      />
    </div>
  );
}

