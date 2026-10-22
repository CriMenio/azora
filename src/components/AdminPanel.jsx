import React, { useState, useCallback, useEffect } from 'react';
import {
  LogOut,
  Sun,
  Moon,
  Receipt,
  ArrowLeft,
  Lock,
  Database,
  Menu,
  X,
  Images,
  Sparkles,
  Users,
  LayoutDashboard,
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import AdminBilling from './AdminBilling';
import AdminCustomers from './AdminCustomers';
import AdminRecords from './AdminRecords';
import AdminGallery from './AdminGallery';
import AdminOffers from './AdminOffers';
import Logo from './Logo';

const ADMIN_SESSION_KEY = 'azora_admin_auth';

export const ADMIN_NAV_ITEMS = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    badge: 'Overview',
    desc: 'Executive summary of bills, client counts, revenue & customer reviews',
    icon: LayoutDashboard,
  },
  {
    id: 'billing',
    title: 'Billing',
    badge: 'Invoices',
    desc: 'Invoice records list, bill viewer, WhatsApp sharing & bill creation',
    icon: Receipt,
  },
  {
    id: 'customers',
    title: 'Customer Diary',
    badge: 'Clients & CRM',
    desc: 'Client profiles, addresses, makeover photos, feedback & remarks',
    icon: Users,
  },
  {
    id: 'records',
    title: 'Sheet Records',
    badge: 'Live Data',
    desc: 'Explore real-time bookings, client contacts, bills, feedback & offers',
    icon: Database,
  },
  {
    id: 'gallery',
    title: 'Gallery',
    badge: 'Media Library',
    desc: 'Manage salon portfolio photos hosted securely on Google Drive',
    icon: Images,
  },
  {
    id: 'offers',
    title: 'Offers & Packages',
    badge: 'Promotions',
    desc: 'Seasonal flyers, bookable combos & Google Sheets sync',
    icon: Sparkles,
  },
];

function getInitialAdminView() {
  const hash = window.location.hash || '';
  if (hash.includes('/billing')) return 'billing';
  if (hash.includes('/customers')) return 'customers';
  if (hash.includes('/records')) return 'records';
  if (hash.includes('/gallery')) return 'gallery';
  if (hash.includes('/offers')) return 'offers';
  if (hash.includes('/dashboard')) return 'dashboard';
  return 'dashboard';
}

function getAdminPin() {
  return import.meta.env.VITE_ADMIN_PIN || 'azora2024';
}

function LoginScreen({ onLogin, onBack, theme, toggleTheme }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === getAdminPin()) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      onLogin();
    } else {
      setError('Invalid admin PIN');
    }
  };

  return (
    <div className="admin-login-page">
      <header className="admin-login-header">
        <button type="button" className="admin-login-header-back" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <div className="admin-login-header-brand">
          <Logo variant="admin" alt="Azora Admin" />
        </div>
        <button
          type="button"
          className="admin-theme-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <div className="admin-login-body">
        <div className="admin-login-card glass-panel">
          <div className="admin-login-icon">
            <Lock size={28} />
          </div>
          <h1>Sign In</h1>
          <p>Enter your PIN to manage billing and customer records.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Admin PIN</label>
              <input
                type="password"
                className="form-control"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="Enter admin PIN"
                autoFocus
              />
            </div>
            {error && <p className="admin-error-text">{error}</p>}
            <button type="submit" className="btn btn-primary admin-login-submit">
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel({ theme, toggleTheme, onExit }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true'
  );
  const [adminView, setAdminView] = useState(getInitialAdminView);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleAdminViewChange = useCallback((view) => {
    setAdminView(view);
    window.location.hash = `admin/${view}`;
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Sync adminView from URL hash
  useEffect(() => {
    const handleHash = () => {
      const nextView = getInitialAdminView();
      setAdminView(nextView);
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Update hash if user is on base #admin
  useEffect(() => {
    if (!window.location.hash || window.location.hash === '#admin') {
      window.history.replaceState(null, '', `#admin/${adminView}`);
    }
  }, [adminView]);

  // Close drawer on Escape key
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
    setIsMenuOpen(false);
    onExit();
  };

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={() => setIsAuthenticated(true)}
        onBack={onExit}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  const activeNav = ADMIN_NAV_ITEMS.find((item) => item.id === adminView) || ADMIN_NAV_ITEMS[0];
  const ActiveIcon = activeNav.icon;

  return (
    <div className="admin-panel">
      {/* Top Navigation Bar with Toggle Button */}
      <header className="admin-header glass-panel">
        <div className="admin-header-inner">
          <div className="admin-header-left">
            {/* The Toggle Button to open the menu drawer */}
            <button
              type="button"
              className="admin-menu-toggle-btn"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open navigation menu"
              title="Open Navigation Menu"
            >
              <Menu size={20} />
              <span className="admin-menu-toggle-text">Menu</span>
            </button>

            <div
              className="admin-header-brand"
              onClick={() => handleAdminViewChange('dashboard')}
              style={{ cursor: 'pointer' }}
              title="Azora Admin Home"
            >
              <Logo variant="admin" alt="Azora Admin" />
            </div>

            {/* Current Active Screen Badge */}
            <div className="admin-header-current-badge">
              <span className="admin-badge-indicator" />
              <ActiveIcon size={14} className="text-gold" />
              <span className="admin-badge-label">{activeNav.title}</span>
            </div>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-theme-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              className="btn btn-secondary admin-logout-btn"
              onClick={handleLogout}
              title="Sign out of Admin"
            >
              <LogOut size={16} /> <span className="admin-logout-btn-text">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Menu Drawer Backdrop Overlay */}
      <div
        className={`admin-drawer-overlay ${isMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden={!isMenuOpen}
      />

      {/* Slide-out Navigation Drawer */}
      <aside
        className={`admin-drawer ${isMenuOpen ? 'open' : ''}`}
        aria-label="Admin Navigation Menu"
      >
        <div className="admin-drawer-header">
          <div className="admin-drawer-brand">
            <Logo variant="admin" alt="Azora Salon" />
            <span className="admin-drawer-portal-tag">ADMIN PORTAL</span>
          </div>
          <button
            type="button"
            className="admin-drawer-close"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <p className="admin-drawer-hint">Select a workspace module to manage:</p>

        <nav className="admin-drawer-nav">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = adminView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`admin-drawer-card ${isActive ? 'active' : ''}`}
                onClick={() => handleAdminViewChange(item.id)}
              >
                <div className="admin-drawer-card-icon">
                  <Icon size={20} />
                </div>
                <div className="admin-drawer-card-body">
                  <div className="admin-drawer-card-top">
                    <span className="admin-drawer-card-title">{item.title}</span>
                    <span className="admin-drawer-card-badge">{item.badge}</span>
                  </div>
                  <p className="admin-drawer-card-desc">{item.desc}</p>
                </div>
                {isActive && <span className="admin-drawer-active-pill">ACTIVE</span>}
              </button>
            );
          })}
        </nav>

        <div className="admin-drawer-footer">
          <button
            type="button"
            className="admin-drawer-footer-action"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
          </button>
          <button
            type="button"
            className="admin-drawer-footer-action admin-drawer-footer-logout"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Body */}
      <main className="admin-main container">
        {adminView === 'dashboard' ? (
          <AdminDashboard adminPin={getAdminPin()} onNavigate={handleAdminViewChange} />
        ) : adminView === 'billing' ? (
          <AdminBilling adminPin={getAdminPin()} onNavigate={handleAdminViewChange} />
        ) : adminView === 'customers' ? (
          <AdminCustomers adminPin={getAdminPin()} />
        ) : adminView === 'records' ? (
          <AdminRecords adminPin={getAdminPin()} />
        ) : adminView === 'gallery' ? (
          <AdminGallery adminPin={getAdminPin()} />
        ) : adminView === 'offers' ? (
          <AdminOffers adminPin={getAdminPin()} />
        ) : (
          <AdminBilling adminPin={getAdminPin()} onNavigate={handleAdminViewChange} />
        )}
      </main>
    </div>
  );
}
