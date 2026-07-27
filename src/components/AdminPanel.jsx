import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  LogOut,
  Sun,
  Moon,
  User,
  Plus,
  Trash2,
  FileText,
  MessageCircle,
  Download,
  Receipt,
  ArrowLeft,
  Lock,
  Database,
  Menu,
  X,
} from 'lucide-react';
import { SERVICES_CATALOG, formatCurrency } from '../data/servicesCatalog';
import {
  buildBillWhatsAppMessage,
  shareBillToCustomer,
  downloadBillImage,
  openWhatsAppChat,
} from '../services/billShareService';
import {
  getNextBillNumber,
  saveBillingToSpreadsheet,
} from '../services/spreadsheetService';
import { getLocalNextBillNumber } from '../services/billNumberService';
import AdminRecords from './AdminRecords';
import Logo from './Logo';

const ADMIN_SESSION_KEY = 'azora_admin_auth';

function getAdminPin() {
  return import.meta.env.VITE_ADMIN_PIN || 'azora2024';
}

function createLineItem(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    serviceId: '',
    name: '',
    qty: 1,
    rate: 0,
    ...overrides,
  };
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
        <button type="button" className="admin-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
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

function BillPreview({ bill, billRef }) {
  return (
    <div ref={billRef} className="admin-bill-card">
      <div className="admin-bill-header">
        <div className="admin-bill-header-left">
          <Logo variant="bill" className="admin-bill-logo" alt="Azora Salon" />
          <p className="admin-bill-subtitle">Payment Bill / Invoice</p>
        </div>
        <div className="admin-bill-meta">
          <span className="admin-bill-meta-label">BILL NO</span>
          <strong className="admin-bill-meta-value">{bill.billNo}</strong>
        </div>
      </div>

      <div className="admin-bill-divider" />

      <div className="admin-bill-info-grid">
        <div>
          <span>Client</span>
          <strong>{bill.clientName}</strong>
        </div>
        <div>
          <span>Date</span>
          <strong>{bill.serviceDate}</strong>
        </div>
        <div>
          <span>Phone</span>
          <strong>{bill.clientPhone}</strong>
        </div>
        {bill.clientEmail && (
          <div>
            <span>Email</span>
            <strong>{bill.clientEmail}</strong>
          </div>
        )}
      </div>

      <table className="admin-bill-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.lineItems.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.qty}</td>
              <td>{formatCurrency(item.rate)}</td>
              <td>{formatCurrency(item.qty * item.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="admin-bill-totals">
        <div><span>Subtotal</span><strong>{formatCurrency(bill.subtotal)}</strong></div>
        {bill.discount > 0 && (
          <div><span>Discount</span><strong>-{formatCurrency(bill.discount)}</strong></div>
        )}
        <div className="admin-bill-total-row">
          <span>Total Payable</span>
          <strong>{formatCurrency(bill.total)}</strong>
        </div>
      </div>

      {bill.notes?.trim() && (
        <p className="admin-bill-notes"><strong>Notes:</strong> {bill.notes}</p>
      )}

      <p className="admin-bill-footer">Thank you for choosing Azora. Kamothe, Navi Mumbai</p>
    </div>
  );
}

export default function AdminPanel({ theme, toggleTheme, onExit }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true'
  );
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState([createLineItem()]);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [bill, setBill] = useState(null);
  const [errors, setErrors] = useState({});
  const [shareStatus, setShareStatus] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);
  const [formError, setFormError] = useState('');
  const [adminView, setAdminView] = useState('billing');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const billRef = useRef(null);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleAdminViewChange = (view) => {
    setAdminView(view);
    closeMobileMenu();
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
    closeMobileMenu();
    onExit();
  };

  const updateLineItem = (id, field, value) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    setBill(null);
  };

  const updateLineItemFields = (id, fields) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...fields } : item))
    );
    setBill(null);
  };

  const removeLineItem = (id) => {
    setLineItems((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== id)));
    setBill(null);
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, createLineItem()]);
    setBill(null);
  };

  const addFromCatalog = () => {
    if (!selectedCatalogId) return;
    const service = SERVICES_CATALOG.find((s) => s.id === selectedCatalogId);
    if (!service) return;

    setLineItems((prev) => {
      const emptyRow = prev.find((item) => !item.name.trim() && !item.rate);
      if (emptyRow) {
        return prev.map((item) =>
          item.id === emptyRow.id
            ? { ...item, serviceId: service.id, name: service.name, qty: 1, rate: 0 }
            : item
        );
      }

      const existing = prev.find((item) => item.serviceId === service.id && item.rate === 0);
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id ? { ...item, qty: item.qty + 1 } : item
        );
      }

      return [
        ...prev,
        createLineItem({
          serviceId: service.id,
          name: service.name,
          qty: 1,
          rate: 0,
        }),
      ];
    });
    setSelectedCatalogId('');
    setBill(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!clientName.trim()) newErrors.clientName = 'Client name is required';
    if (!clientPhone.trim()) {
      newErrors.clientPhone = 'WhatsApp phone number is required';
    } else if (!/^[+]?[0-9\s-]{7,15}$/.test(clientPhone)) {
      newErrors.clientPhone = 'Enter a valid phone number';
    }
    if (!serviceDate) newErrors.serviceDate = 'Service date is required';

    const validItems = lineItems.filter((item) => item.name.trim() && item.rate > 0);
    if (validItems.length === 0) {
      newErrors.lineItems = 'Add at least one service with name and price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const computeTotals = (items, discountAmount) => {
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
    const discountValue = Math.min(Number(discountAmount) || 0, subtotal);
    return { subtotal, discount: discountValue, total: subtotal - discountValue };
  };

  const handleGenerateBill = async () => {
    if (!validateForm()) return;

    setIsGeneratingBill(true);
    setFormError('');
    setShareStatus('idle');
    setStatusMessage('Fetching next invoice number from sheet…');

    const validItems = lineItems.filter((item) => item.name.trim() && item.rate > 0);
    const totals = computeTotals(validItems, discount);

    let billNo;
    let usedSheetSequence = true;

    try {
      billNo = await getNextBillNumber(serviceDate);
    } catch (error) {
      console.warn('Sheet bill number lookup failed, using local sequence:', error);
      billNo = getLocalNextBillNumber(serviceDate);
      usedSheetSequence = false;
    }

    const billData = {
      billNo,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim(),
      serviceDate,
      notes: notes.trim(),
      lineItems: validItems,
      ...totals,
    };

    setBill(billData);

    const saveResult = await saveBillingToSpreadsheet(billData);

    if (saveResult.success && usedSheetSequence) {
      setStatusMessage(`✓ Saved to Billing sheet as ${billNo}. You can now download or send via WhatsApp.`);
      setShareStatus('saved');
    } else if (saveResult.success) {
      setStatusMessage(`✓ Saved to Billing sheet as ${billNo}. Invoice sequence is local — redeploy Apps Script for sheet sync.`);
      setShareStatus('saved');
    } else {
      setStatusMessage(`Bill ${billNo} created but NOT saved to sheet: ${saveResult.error || 'Unknown error'}. Check Apps Script billing code and redeploy.`);
      setShareStatus('error');
    }

    setIsGeneratingBill(false);
  };

  const handleReset = () => {
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setServiceDate(new Date().toISOString().split('T')[0]);
    setDiscount(0);
    setNotes('');
    setLineItems([createLineItem()]);
    setBill(null);
    setErrors({});
    setShareStatus('idle');
    setStatusMessage('');
    setFormError('');
  };

  const handleShareBillImage = useCallback(async () => {
    if (!bill || !billRef.current) return;

    setShareStatus('sharing');
    setStatusMessage('Preparing bill image…');
    try {
      const result = await shareBillToCustomer(billRef.current, bill.clientPhone, bill.billNo);
      if (result.method === 'native-share') {
        setShareStatus('shared-native');
        setStatusMessage('Bill image shared successfully.');
      } else {
        setShareStatus('shared-download');
        setStatusMessage('Bill image downloaded. WhatsApp opened — attach the image and send.');
      }
    } catch (error) {
      console.error('Failed to share bill:', error);
      setShareStatus('error');
      setStatusMessage(error.message || 'Could not share bill. Try download or send text only.');
    }
  }, [bill]);

  const handleSendTextOnly = () => {
    if (!bill) return;
    const message = buildBillWhatsAppMessage(bill);
    openWhatsAppChat(bill.clientPhone, message);
    setShareStatus('text-sent');
    setStatusMessage('WhatsApp opened with bill details.');
  };

  const handleDownloadBill = async () => {
    if (!bill || !billRef.current) return;

    setShareStatus('sharing');
    setStatusMessage('Generating bill image…');
    try {
      await downloadBillImage(billRef.current, bill.billNo);
      setShareStatus('downloaded');
      setStatusMessage('Bill image downloaded successfully.');
    } catch (error) {
      console.error('Failed to download bill:', error);
      setShareStatus('error');
      setStatusMessage(error.message || 'Could not download bill image. Please try again.');
    }
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

  const previewTotals = computeTotals(
    lineItems.filter((item) => item.name.trim() && item.rate > 0),
    discount
  );

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div className="admin-header-mobile-bar">
          <div className="admin-header-brand">
            <Logo variant="admin" alt="Azora Admin" />
          </div>
          <button
            type="button"
            className="admin-menu-toggle"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <div className={`admin-mobile-menu${isMobileMenuOpen ? ' open' : ''}`}>
          <button
            type="button"
            className={`admin-mobile-menu-item${adminView === 'billing' ? ' active' : ''}`}
            onClick={() => handleAdminViewChange('billing')}
          >
            <Receipt size={18} /> Billing
          </button>
          <button
            type="button"
            className={`admin-mobile-menu-item${adminView === 'records' ? ' active' : ''}`}
            onClick={() => handleAdminViewChange('records')}
          >
            <Database size={18} /> Sheet Records
          </button>
          <button
            type="button"
            className="admin-mobile-menu-item"
            onClick={() => {
              toggleTheme();
              closeMobileMenu();
            }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button type="button" className="admin-mobile-menu-item admin-mobile-menu-logout" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>

        <div className="admin-header-desktop">
          <div className="admin-header-left">
            <div className="admin-header-brand">
              <Logo variant="admin" alt="Azora Admin" />
            </div>
            <nav className="admin-nav-tabs" aria-label="Admin sections">
              <button
                type="button"
                className={`admin-nav-tab${adminView === 'billing' ? ' active' : ''}`}
                onClick={() => setAdminView('billing')}
              >
                <Receipt size={16} /> Billing
              </button>
              <button
                type="button"
                className={`admin-nav-tab${adminView === 'records' ? ' active' : ''}`}
                onClick={() => setAdminView('records')}
              >
                <Database size={16} /> Sheet Records
              </button>
            </nav>
          </div>
          <div className="admin-header-actions">
            <button type="button" className="admin-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button type="button" className="btn btn-secondary admin-logout-btn" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main container">
        {adminView === 'records' ? (
          <AdminRecords adminPin={getAdminPin()} />
        ) : (
        <div className="admin-grid">
          {/* Form Column */}
          <section className="admin-form-section glass-panel">
            <h2>Create Payment Bill</h2>
            <p className="admin-section-desc">Fill in client details and services, then generate and send the bill via WhatsApp.</p>

            <h3 className="admin-subheading"><User size={16} /> Client Details</h3>
            <div className="admin-form-grid">
              <div className="form-group">
                <label className="form-label">Client Name *</label>
                <input
                  className="form-control"
                  value={clientName}
                  onChange={(e) => { setClientName(e.target.value); setBill(null); }}
                  placeholder="Full name"
                />
                {errors.clientName && <p className="admin-error-text">{errors.clientName}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp Phone *</label>
                <input
                  className="form-control"
                  value={clientPhone}
                  onChange={(e) => { setClientPhone(e.target.value); setBill(null); }}
                  placeholder="+91 98765 43210"
                />
                {errors.clientPhone && <p className="admin-error-text">{errors.clientPhone}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Email (Optional)</label>
                <input
                  type="email"
                  className="form-control"
                  value={clientEmail}
                  onChange={(e) => { setClientEmail(e.target.value); setBill(null); }}
                  placeholder="client@email.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Service Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={serviceDate}
                  onChange={(e) => { setServiceDate(e.target.value); setBill(null); }}
                />
                {errors.serviceDate && <p className="admin-error-text">{errors.serviceDate}</p>}
              </div>
            </div>

            <h3 className="admin-subheading"><Receipt size={16} /> Services & Charges</h3>
            <p className="admin-section-desc admin-service-hint">
              Choose a service from the list or type your own. Enter the price for each service yourself.
            </p>

            <div className="admin-catalog-add">
              <select
                className="form-control"
                value={selectedCatalogId}
                onChange={(e) => setSelectedCatalogId(e.target.value)}
              >
                <option value="">— Select service from list —</option>
                {SERVICES_CATALOG.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              <button type="button" className="btn btn-outline-gold" onClick={addFromCatalog} disabled={!selectedCatalogId}>
                <Plus size={16} /> Add
              </button>
            </div>

            <div className="admin-line-items-header" aria-hidden="true">
              <span>Service</span>
              <span>Qty</span>
              <span>Price (₹)</span>
              <span>Amount</span>
              <span />
            </div>

            <datalist id="admin-service-suggestions">
              {SERVICES_CATALOG.map((service) => (
                <option key={service.id} value={service.name} />
              ))}
            </datalist>

            <div className="admin-line-items">
              {lineItems.map((item) => (
                <div key={item.id} className="admin-line-item">
                  <input
                    className="form-control"
                    list="admin-service-suggestions"
                    value={item.name}
                    onChange={(e) => updateLineItemFields(item.id, { name: e.target.value, serviceId: '' })}
                    placeholder="Service name"
                  />
                  <input
                    type="number"
                    className="form-control admin-qty-input"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateLineItem(item.id, 'qty', Math.max(1, Number(e.target.value) || 1))}
                    aria-label="Quantity"
                  />
                  <input
                    type="number"
                    className="form-control admin-rate-input"
                    min="0"
                    value={item.rate || ''}
                    onChange={(e) => updateLineItem(item.id, 'rate', Math.max(0, Number(e.target.value) || 0))}
                    placeholder="Enter price"
                    aria-label="Price"
                  />
                  <span className="admin-line-amount">{formatCurrency(item.qty * item.rate)}</span>
                  <button
                    type="button"
                    className="admin-remove-btn"
                    onClick={() => removeLineItem(item.id)}
                    aria-label="Remove line item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            {errors.lineItems && <p className="admin-error-text">{errors.lineItems}</p>}

            <button type="button" className="btn btn-secondary admin-add-row-btn" onClick={addLineItem}>
              <Plus size={16} /> Add Another Service
            </button>

            <div className="admin-form-grid" style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Discount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  value={discount}
                  onChange={(e) => { setDiscount(Math.max(0, Number(e.target.value) || 0)); setBill(null); }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Live Total</label>
                <div className="admin-live-total">{formatCurrency(previewTotals.total)}</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="form-control"
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setBill(null); }}
                placeholder="Payment terms, thank-you note, etc."
                rows={3}
              />
            </div>

            <div className="admin-form-actions">
              {formError && <p className="admin-error-text" style={{ width: '100%' }}>{formError}</p>}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGenerateBill}
                disabled={isGeneratingBill}
              >
                <FileText size={16} /> {isGeneratingBill ? 'Generating…' : 'Generate Bill'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleReset}>
                New Bill
              </button>
              <p className="admin-save-hint">Data is saved to the <strong>Billing</strong> Google Sheet when you click <strong>Generate Bill</strong> — not on Download or WhatsApp.</p>
            </div>
          </section>

          {/* Preview Column */}
          <section className="admin-preview-section">
            {!bill ? (
              <div className="admin-preview-placeholder glass-panel">
                <Receipt size={48} style={{ color: 'var(--color-primary)', opacity: 0.5 }} />
                <h3>Bill Preview</h3>
                <p>Fill in the details and click <strong>Generate Bill</strong> to preview and send to the client&apos;s WhatsApp.</p>
              </div>
            ) : (
              <>
                <BillPreview bill={bill} billRef={billRef} />

                {statusMessage && (
                  <p className={`admin-status-text${shareStatus === 'error' ? ' error' : shareStatus === 'saved' || shareStatus === 'downloaded' || shareStatus === 'shared-native' || shareStatus === 'shared-download' || shareStatus === 'text-sent' ? ' success' : ''}`}>
                    {statusMessage}
                  </p>
                )}

                <div className="admin-send-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleShareBillImage}
                    disabled={shareStatus === 'sharing'}
                  >
                    <MessageCircle size={16} /> Send Bill Image to WhatsApp
                  </button>
                  <button type="button" className="btn btn-outline-gold" onClick={handleSendTextOnly}>
                    <MessageCircle size={16} /> Send Text Message Only
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleDownloadBill}
                    disabled={shareStatus === 'sharing'}
                  >
                    <Download size={16} /> Download Bill Image
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
        )}
      </main>
    </div>
  );
}
