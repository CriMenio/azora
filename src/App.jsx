import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Services from './components/Services';
import Gallery from './components/Gallery';
import AboutUs from './components/AboutUs';
import Contact from './components/Contact';
import BookingModal from './components/BookingModal';
import AdminPanel from './components/AdminPanel';
import Celebration from './components/Celebration';
import ScrollToFooter from './components/ScrollToFooter';

function getInitialPage() {
  return window.location.hash === '#admin' ? 'admin' : 'home';
}

export default function App() {
  const [activePage, setActivePage] = useState(getInitialPage);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    if (activePage === 'home') {
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
    }
  }, [activePage]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const syncHash = () => {
      if (window.location.hash === '#admin') {
        setActivePage('admin');
      }
    };
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  const navigateTo = (page) => {
    setActivePage(page);
    if (page === 'admin') {
      window.location.hash = 'admin';
    } else if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleOpenBooking = (serviceId = '') => {
    setSelectedServiceId(serviceId);
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    setSelectedServiceId('');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return (
          <Home 
            setActivePage={navigateTo} 
            onOpenBooking={() => handleOpenBooking()} 
            theme={theme}
          />
        );
      case 'services':
        return (
          <Services 
            onBookService={(serviceId) => handleOpenBooking(serviceId)} 
          />
        );
      case 'gallery':
        return <Gallery />;
      case 'about':
        return <AboutUs />;
      case 'contact':
        return <Contact />;
      default:
        return (
          <Home 
            setActivePage={navigateTo} 
            onOpenBooking={() => handleOpenBooking()} 
            theme={theme}
          />
        );
    }
  };

  if (activePage === 'admin') {
    return (
      <AdminPanel
        theme={theme}
        toggleTheme={toggleTheme}
        onExit={() => navigateTo('home')}
      />
    );
  }

  return (
    <div className="app-container">
      {showCelebration && <Celebration />}

      {/* Premium Sticky Navigation Header */}
      <Header 
        activePage={activePage} 
        setActivePage={navigateTo} 
        onOpenBooking={() => handleOpenBooking()} 
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area with Fade In Router Transition */}
      <main className="main-content">
        {renderPage()}
      </main>

      {/* Persistent Global Footer */}
      <Footer setActivePage={navigateTo} />

      <ScrollToFooter />

      {/* Step-by-Step Booking Form wizard Modal */}
      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={handleCloseBooking} 
        initialServiceId={selectedServiceId} 
        theme={theme}
      />
    </div>
  );
}
