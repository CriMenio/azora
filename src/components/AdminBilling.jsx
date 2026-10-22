import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  X,
  FileText,
  MessageCircle,
  Download,
  Trash2,
  Eye,
  Printer,
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Mail,
  RefreshCw,
  CheckCircle,
  TrendingUp,
  Sparkles,
  Clock,
  Share2,
  AlertCircle,
  DollarSign,
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
  getAdminRecords,
} from '../services/spreadsheetService';
import { getLocalNextBillNumber } from '../services/billNumberService';
import {
  getLocalBills,
  saveLocalBill,
  deleteLocalBill,
} from '../services/billingHistoryService';
import Logo from './Logo';
import UiSelect from './UiSelect';
import ConfirmModal from './ConfirmModal';

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

function parseServicesString(str, total = 0) {
  if (!str || typeof str !== 'string') return [];
  const parts = str.split(';').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return [];

  return parts.map((part, idx) => {
    // Matches patterns like: "Hydra Facial x1 @ 2499" or "Blowdry @ 799"
    const match = part.match(/^(.*?)(?:\s+x(\d+))?(?:\s+@\s*(\d+(?:\.\d+)?))?$/);
    if (match && (match[2] || match[3])) {
      const name = (match[1] || part).trim();
      const qty = match[2] ? parseInt(match[2], 10) : 1;
      const rate = match[3] ? parseFloat(match[3]) : 0;
      return { id: `parsed-${idx}`, name, qty, rate };
    }
    return {
      id: `parsed-${idx}`,
      name: part,
      qty: 1,
      rate: parts.length === 1 && total ? total : 0,
    };
  });
}

export function normalizeBill(bill) {
  if (!bill) return null;
  const billNo = bill.billNo || bill.bill_no || 'AZR-BILL';
  const clientName = bill.clientName || bill.name || 'Valued Client';
  const clientPhone = bill.clientPhone || bill.phone || '';
  const clientEmail = bill.clientEmail || bill.email || '';
  const serviceDate =
    bill.serviceDate || bill.date || (bill.createdAt ? bill.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);
  const subtotal = Number(bill.subtotal) || 0;
  const discount = Number(bill.discount) || 0;
  const total = Number(bill.total) || (subtotal > 0 ? subtotal - discount : 0);
  const notes = bill.notes || '';

  let lineItems = [];
  if (Array.isArray(bill.lineItems) && bill.lineItems.length > 0) {
    lineItems = bill.lineItems;
  } else if (bill.services) {
    lineItems = parseServicesString(bill.services, total);
  } else {
    lineItems = [{ id: 'item-default', name: 'Salon Services', qty: 1, rate: total }];
  }

  return {
    billNo,
    clientName,
    clientPhone,
    clientEmail,
    serviceDate,
    subtotal: subtotal || total + discount,
    discount,
    total,
    notes,
    lineItems,
    createdAt: bill.createdAt || new Date().toISOString(),
  };
}

export function BillPreview({ bill, billRef }) {
  const normalized = normalizeBill(bill);
  if (!normalized) return null;

  return (
    <div ref={billRef} className="admin-bill-card">
      <div className="admin-bill-header">
        <div className="admin-bill-header-left">
          <Logo variant="bill" className="admin-bill-logo" alt="Azora Salon" />
          <p className="admin-bill-subtitle">Payment Bill / Invoice</p>
        </div>
        <div className="admin-bill-meta">
          <span className="admin-bill-meta-label">BILL NO</span>
          <strong className="admin-bill-meta-value">{normalized.billNo}</strong>
        </div>
      </div>

      <div className="admin-bill-divider" />

      <div className="admin-bill-info-grid">
        <div>
          <span>Client</span>
          <strong>{normalized.clientName}</strong>
        </div>
        <div>
          <span>Date</span>
          <strong>{normalized.serviceDate}</strong>
        </div>
        <div>
          <span>Phone</span>
          <strong>{normalized.clientPhone || '—'}</strong>
        </div>
        {normalized.clientEmail && (
          <div>
            <span>Email</span>
            <strong>{normalized.clientEmail}</strong>
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
          {normalized.lineItems.map((item) => (
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
        <div>
          <span>Subtotal</span>
          <strong>{formatCurrency(normalized.subtotal)}</strong>
        </div>
        {normalized.discount > 0 && (
          <div>
            <span>Discount</span>
            <strong>-{formatCurrency(normalized.discount)}</strong>
          </div>
        )}
        <div className="admin-bill-total-row">
          <span>Total Payable</span>
          <strong>{formatCurrency(normalized.total)}</strong>
        </div>
      </div>

      {normalized.notes?.trim() && (
        <p className="admin-bill-notes">
          <strong>Notes:</strong> {normalized.notes}
        </p>
      )}

      <p className="admin-bill-footer">Thank you for choosing Azora. Kamothe, Navi Mumbai</p>
    </div>
  );
}

export default function AdminBilling({ adminPin, onNavigate }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create'
  const [bills, setBills] = useState(getLocalBills);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'thisMonth'
  const [selectedBillForView, setSelectedBillForView] = useState(null);
  const [billToDelete, setBillToDelete] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');

  // Form State for creating a bill
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState([createLineItem()]);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [generatedBill, setGeneratedBill] = useState(null);
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [shareStatus, setShareStatus] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Refs for rendering bill cards as images
  const formBillRef = useRef(null);
  const modalBillRef = useRef(null);

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail) setBills(e.detail);
      else setBills(getLocalBills());
    };
    window.addEventListener('azora-billing-updated', handleUpdate);
    return () => window.removeEventListener('azora-billing-updated', handleUpdate);
  }, []);

  // Compute metrics
  const stats = useMemo(() => {
    const totalCount = bills.length;
    const totalRevenue = bills.reduce((sum, b) => sum + (Number(b.total) || 0), 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBills = bills.filter((b) => (b.serviceDate || '').startsWith(todayStr));
    const todayRevenue = todayBills.reduce((sum, b) => sum + (Number(b.total) || 0), 0);
    const avgValue = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;
    return {
      totalCount,
      totalRevenue,
      todayCount: todayBills.length,
      todayRevenue,
      avgValue,
    };
  }, [bills]);

  // Filtered bills
  const filteredBills = useMemo(() => {
    let result = [...bills];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((b) => {
        const no = (b.billNo || '').toLowerCase();
        const name = (b.clientName || '').toLowerCase();
        const phone = (b.clientPhone || '').toLowerCase();
        const services = Array.isArray(b.lineItems)
          ? b.lineItems.map((i) => i.name).join(' ').toLowerCase()
          : (b.services || '').toLowerCase();
        return no.includes(q) || name.includes(q) || phone.includes(q) || services.includes(q);
      });
    }

    if (dateFilter === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      result = result.filter((b) => (b.serviceDate || '').startsWith(todayStr));
    } else if (dateFilter === 'thisMonth') {
      const currentMonth = new Date().toISOString().substring(0, 7);
      result = result.filter((b) => (b.serviceDate || '').startsWith(currentMonth));
    }

    // Sort descending by date/createdAt/billNo
    return result.sort((a, b) => {
      const dateA = a.createdAt || a.serviceDate || '';
      const dateB = b.createdAt || b.serviceDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [bills, searchQuery, dateFilter]);

  // Sync with Google Sheets billing records
  const handleSyncWithSheet = async () => {
    setIsSyncing(true);
    setSyncNotice('');
    try {
      const sheetData = await getAdminRecords(adminPin);
      if (sheetData && Array.isArray(sheetData.billing)) {
        let addedCount = 0;
        const currentBills = getLocalBills();
        const merged = [...currentBills];

        sheetData.billing.forEach((sheetRow) => {
          if (!sheetRow.billNo) return;
          const exists = merged.some((b) => b.billNo === sheetRow.billNo);
          if (!exists) {
            merged.push(normalizeBill(sheetRow));
            addedCount++;
          }
        });

        localStorage.setItem('azora_local_bills', JSON.stringify(merged));
        setBills(merged);
        setSyncNotice(`Synced with Google Sheets. ${addedCount} new invoices imported.`);
      } else {
        setSyncNotice('Sheet connected, but no new billing rows found.');
      }
    } catch (err) {
      console.warn('Billing sync warning:', err);
      setSyncNotice('Could not fetch from sheet. Showing local records.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncNotice(''), 4000);
    }
  };

  // Form helpers
  const updateLineItem = (id, field, value) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    setGeneratedBill(null);
  };

  const updateLineItemFields = (id, fields) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...fields } : item))
    );
    setGeneratedBill(null);
  };

  const removeLineItem = (id) => {
    setLineItems((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== id)));
    setGeneratedBill(null);
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, createLineItem()]);
    setGeneratedBill(null);
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
    setGeneratedBill(null);
  };

  const computeTotals = (items, discountAmount) => {
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
    const discountValue = Math.min(Number(discountAmount) || 0, subtotal);
    return { subtotal, discount: discountValue, total: subtotal - discountValue };
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
      createdAt: new Date().toISOString(),
    };

    setGeneratedBill(billData);
    saveLocalBill(billData);

    const saveResult = await saveBillingToSpreadsheet(billData);

    if (saveResult.success && usedSheetSequence) {
      setStatusMessage(`✓ Saved to Billing sheet as ${billNo}. You can now download or send via WhatsApp.`);
      setShareStatus('saved');
    } else if (saveResult.success) {
      setStatusMessage(`✓ Saved to Billing sheet as ${billNo}. Invoice sequence is local.`);
      setShareStatus('saved');
    } else {
      setStatusMessage(`Bill ${billNo} created locally. Note: ${saveResult.error || 'Check Google Sheet sync'}.`);
      setShareStatus('error');
    }

    setIsGeneratingBill(false);
  };

  const handleResetForm = () => {
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setServiceDate(new Date().toISOString().split('T')[0]);
    setDiscount(0);
    setNotes('');
    setLineItems([createLineItem()]);
    setGeneratedBill(null);
    setErrors({});
    setShareStatus('idle');
    setStatusMessage('');
    setFormError('');
  };

  // WhatsApp and download handlers
  const handleShareBillImage = useCallback(async (billToShare, elementRef) => {
    if (!billToShare || !elementRef.current) return;

    setShareStatus('sharing');
    setStatusMessage('Preparing bill image…');
    try {
      const result = await shareBillToCustomer(elementRef.current, billToShare.clientPhone, billToShare.billNo);
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
  }, []);

  const handleSendTextOnly = (billToSend) => {
    if (!billToSend) return;
    const message = buildBillWhatsAppMessage(billToSend);
    openWhatsAppChat(billToSend.clientPhone, message);
    setShareStatus('text-sent');
    setStatusMessage('WhatsApp opened with bill details.');
  };

  const handleDownloadBill = async (billToDownload, elementRef) => {
    if (!billToDownload || !elementRef.current) return;

    setShareStatus('sharing');
    setStatusMessage('Generating bill image…');
    try {
      await downloadBillImage(elementRef.current, billToDownload.billNo);
      setShareStatus('downloaded');
      setStatusMessage('Bill image downloaded successfully.');
    } catch (error) {
      console.error('Failed to download bill:', error);
      setShareStatus('error');
      setStatusMessage(error.message || 'Could not download bill image. Please try again.');
    }
  };

  const handlePrintBill = () => {
    window.print();
  };

  const confirmDeleteBill = () => {
    if (!billToDelete) return;
    deleteLocalBill(billToDelete.billNo);
    if (selectedBillForView?.billNo === billToDelete.billNo) {
      setSelectedBillForView(null);
    }
    setBillToDelete(null);
  };

  const previewTotals = computeTotals(
    lineItems.filter((item) => item.name.trim() && item.rate > 0),
    discount
  );

  return (
    <div className="admin-billing-page">
      {/* View Switcher / Top Header */}
      <div className="admin-billing-topbar glass-panel">
        <div className="admin-billing-title-group">
          <div className="admin-billing-icon-wrap">
            <Receipt size={22} className="text-gold" />
          </div>
          <div>
            <div className="admin-billing-heading-row">
              <h2 className="admin-billing-heading">
                {viewMode === 'list' ? 'Billing & Invoices' : 'Create Payment Bill'}
              </h2>
              <span className="admin-billing-records-badge">
                {bills.length} {bills.length === 1 ? 'Invoice Record' : 'Invoice Records'}
              </span>
            </div>
            <p className="admin-billing-subheading">
              {viewMode === 'list'
                ? 'Review salon billing records, click any invoice to view receipt details, or create a new customer bill.'
                : 'Fill in client details and services, compute totals, and save to Google Sheet & send to WhatsApp.'}
            </p>
          </div>
        </div>

        <div className="admin-billing-topbar-actions">
          {viewMode === 'list' ? (
            <>
              <button
                type="button"
                className="btn btn-secondary admin-sync-btn"
                onClick={handleSyncWithSheet}
                disabled={isSyncing}
                title="Sync and import invoices from Google Sheet"
              >
                <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Sheet'}</span>
              </button>

              <button
                type="button"
                className="btn btn-primary admin-create-bill-btn"
                onClick={() => {
                  handleResetForm();
                  setViewMode('create');
                }}
              >
                <Plus size={16} /> <span>Create New Bill</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-secondary admin-back-btn"
              onClick={() => {
                setViewMode('list');
                setGeneratedBill(null);
              }}
            >
              <ArrowLeft size={16} /> <span>Back to Invoices List</span>
            </button>
          )}
        </div>
      </div>

      {syncNotice && (
        <div className="admin-offers-alert admin-offers-alert--success">
          <CheckCircle size={18} />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. RECORDS LIST VIEW (DEFAULT SCREEN)                          */}
      {/* ============================================================== */}
      {viewMode === 'list' && (
        <div className="admin-billing-records-view">
          {/* Metrics Grid */}
          <div className="admin-billing-metrics-grid">
            <div className="admin-metric-card glass-panel">
              <div className="admin-metric-icon">
                <Receipt size={22} className="text-gold" />
              </div>
              <div className="admin-metric-body">
                <span className="admin-metric-label">Total Bills Generated</span>
                <strong className="admin-metric-value">{stats.totalCount}</strong>
                <span className="admin-metric-hint">All recorded salon invoices</span>
              </div>
            </div>

            <div className="admin-metric-card glass-panel">
              <div className="admin-metric-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' }}>
                <TrendingUp size={22} />
              </div>
              <div className="admin-metric-body">
                <span className="admin-metric-label">Total Revenue</span>
                <strong className="admin-metric-value">{formatCurrency(stats.totalRevenue)}</strong>
                <span className="admin-metric-hint">Gross billed amount</span>
              </div>
            </div>

            <div className="admin-metric-card glass-panel">
              <div className="admin-metric-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                <Calendar size={22} />
              </div>
              <div className="admin-metric-body">
                <span className="admin-metric-label">Today's Invoices</span>
                <strong className="admin-metric-value">{stats.todayCount}</strong>
                <span className="admin-metric-hint">{formatCurrency(stats.todayRevenue)} billed today</span>
              </div>
            </div>

            <div className="admin-metric-card glass-panel">
              <div className="admin-metric-icon" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#eab308' }}>
                <DollarSign size={22} />
              </div>
              <div className="admin-metric-body">
                <span className="admin-metric-label">Avg. Invoice Value</span>
                <strong className="admin-metric-value">{formatCurrency(stats.avgValue)}</strong>
                <span className="admin-metric-hint">Per transaction average</span>
              </div>
            </div>
          </div>

          {/* Toolbar: Search and Filter Tabs */}
          <div className="admin-billing-toolbar glass-panel">
            <div className="admin-billing-search-wrap">
              <Search size={16} className="admin-billing-search-icon" aria-hidden="true" />
              <input
                type="search"
                className="form-control admin-billing-search-input"
                placeholder="Search by Bill No (e.g. AZR2026...), client name, phone, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="admin-customers-search-clear"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="admin-billing-filter-pills">
              <button
                type="button"
                className={`admin-filter-pill ${dateFilter === 'all' ? 'active' : ''}`}
                onClick={() => setDateFilter('all')}
              >
                All Invoices ({bills.length})
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${dateFilter === 'today' ? 'active' : ''}`}
                onClick={() => setDateFilter('today')}
              >
                📅 Today's Bills
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${dateFilter === 'thisMonth' ? 'active' : ''}`}
                onClick={() => setDateFilter('thisMonth')}
              >
                🗓️ This Month
              </button>
            </div>
          </div>

          {/* Invoices List Display */}
          {filteredBills.length === 0 ? (
            <div className="admin-billing-empty glass-panel">
              <Receipt size={40} className="text-gold" style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
              <h3>No Invoices Found</h3>
              <p>
                {searchQuery
                  ? `No invoices matched "${searchQuery}". Try a different keyword.`
                  : 'No billing records have been created yet.'}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  handleResetForm();
                  setViewMode('create');
                }}
                style={{ marginTop: '1rem' }}
              >
                <Plus size={16} /> Create First Invoice
              </button>
            </div>
          ) : (
            <div className="admin-billing-table-card glass-panel">
              <div className="admin-billing-table-responsive">
                <table className="admin-billing-records-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Date</th>
                      <th>Client Name &amp; Contact</th>
                      <th>Services Availed</th>
                      <th>Subtotal</th>
                      <th>Discount</th>
                      <th>Total Payable</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBills.map((rawBill) => {
                      const bill = normalizeBill(rawBill);
                      const cleanPhone = (bill.clientPhone || '').replace(/[^0-9]/g, '');

                      return (
                        <tr
                          key={bill.billNo}
                          className="admin-billing-record-row"
                          onClick={() => setSelectedBillForView(bill)}
                          title="Click to view complete invoice record"
                        >
                          <td className="bill-no-cell">
                            <span className="bill-badge">{bill.billNo}</span>
                          </td>
                          <td className="bill-date-cell">
                            <span className="bill-date-text">{bill.serviceDate}</span>
                          </td>
                          <td className="bill-client-cell">
                            <strong className="bill-client-name">{bill.clientName}</strong>
                            {bill.clientPhone && (
                              <span className="bill-client-phone">
                                <Phone size={11} /> {bill.clientPhone}
                              </span>
                            )}
                          </td>
                          <td className="bill-services-cell">
                            <div className="bill-services-pills">
                              {bill.lineItems.map((item, idx) => (
                                <span key={idx} className="bill-service-tag">
                                  {item.name} {item.qty > 1 ? `x${item.qty}` : ''}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="bill-amount-cell">
                            {formatCurrency(bill.subtotal)}
                          </td>
                          <td className="bill-discount-cell">
                            {bill.discount > 0 ? (
                              <span className="bill-discount-pill">-{formatCurrency(bill.discount)}</span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="bill-total-cell">
                            <strong className="bill-total-amount text-gold">
                              {formatCurrency(bill.total)}
                            </strong>
                          </td>
                          <td className="bill-actions-cell" onClick={(e) => e.stopPropagation()}>
                            <div className="bill-row-actions">
                              <button
                                type="button"
                                className="bill-action-btn bill-action-btn--view"
                                onClick={() => setSelectedBillForView(bill)}
                                title="Open full invoice"
                              >
                                <Eye size={15} />
                                <span>View</span>
                              </button>
                              {cleanPhone && (
                                <button
                                  type="button"
                                  className="bill-action-btn bill-action-btn--wa"
                                  onClick={() => handleSendTextOnly(bill)}
                                  title="Send invoice via WhatsApp"
                                >
                                  <MessageCircle size={15} />
                                </button>
                              )}
                              <button
                                type="button"
                                className="bill-action-btn bill-action-btn--delete"
                                onClick={() => setBillToDelete(bill)}
                                title="Delete invoice record"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. CREATE BILL FORM VIEW                                      */}
      {/* ============================================================== */}
      {viewMode === 'create' && (
        <div className="admin-grid">
          {/* Form Column */}
          <section className="admin-form-section glass-panel">
            <div className="admin-form-header-bar">
              <div>
                <h2>Create Payment Bill</h2>
                <p className="admin-section-desc">
                  Fill in client details and services, then generate and send the bill via WhatsApp.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setViewMode('list')}
              >
                <ArrowLeft size={14} /> Back to Records
              </button>
            </div>

            <h3 className="admin-subheading">
              <User size={16} /> Client Details
            </h3>
            <div className="admin-form-grid">
              <div className="form-group">
                <label className="form-label">Client Name *</label>
                <input
                  className="form-control"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    setGeneratedBill(null);
                  }}
                  placeholder="Full name"
                />
                {errors.clientName && <p className="admin-error-text">{errors.clientName}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp Phone *</label>
                <input
                  className="form-control"
                  value={clientPhone}
                  onChange={(e) => {
                    setClientPhone(e.target.value);
                    setGeneratedBill(null);
                  }}
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
                  onChange={(e) => {
                    setClientEmail(e.target.value);
                    setGeneratedBill(null);
                  }}
                  placeholder="client@email.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Service Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={serviceDate}
                  onChange={(e) => {
                    setServiceDate(e.target.value);
                    setGeneratedBill(null);
                  }}
                />
                {errors.serviceDate && <p className="admin-error-text">{errors.serviceDate}</p>}
              </div>
            </div>

            <h3 className="admin-subheading">
              <Receipt size={16} /> Services &amp; Charges
            </h3>
            <p className="admin-section-desc admin-service-hint">
              Choose a service from the list or type your own. Enter the price for each service yourself.
            </p>

            <div className="admin-catalog-add">
              <UiSelect
                value={selectedCatalogId}
                onChange={setSelectedCatalogId}
                placeholder="— Select service from list —"
                searchPlaceholder="Type to search service (e.g. Pedicure, Wax, Facial)..."
                options={SERVICES_CATALOG.map((service) => ({
                  value: service.id,
                  label: service.name,
                }))}
              />
              <button
                type="button"
                className="btn btn-outline-gold"
                onClick={addFromCatalog}
                disabled={!selectedCatalogId}
              >
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
                    onChange={(e) =>
                      updateLineItemFields(item.id, { name: e.target.value, serviceId: '' })
                    }
                    placeholder="Service name"
                  />
                  <input
                    type="number"
                    className="form-control admin-qty-input"
                    min="1"
                    value={item.qty}
                    onChange={(e) =>
                      updateLineItem(item.id, 'qty', Math.max(1, Number(e.target.value) || 1))
                    }
                    aria-label="Quantity"
                  />
                  <input
                    type="number"
                    className="form-control admin-rate-input"
                    min="0"
                    value={item.rate || ''}
                    onChange={(e) =>
                      updateLineItem(item.id, 'rate', Math.max(0, Number(e.target.value) || 0))
                    }
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

            <button
              type="button"
              className="btn btn-secondary admin-add-row-btn"
              onClick={addLineItem}
            >
              <Plus size={16} /> Add Service
            </button>

            <div className="admin-form-grid" style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Discount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  value={discount}
                  onChange={(e) => {
                    setDiscount(Math.max(0, Number(e.target.value) || 0));
                    setGeneratedBill(null);
                  }}
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
                onChange={(e) => {
                  setNotes(e.target.value);
                  setGeneratedBill(null);
                }}
                placeholder="Payment terms, thank-you note, etc."
                rows={3}
              />
            </div>

            <div className="admin-form-actions">
              {formError && (
                <p className="admin-error-text" style={{ width: '100%' }}>
                  {formError}
                </p>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGenerateBill}
                disabled={isGeneratingBill}
              >
                <FileText size={16} /> {isGeneratingBill ? 'Generating…' : 'Generate Bill'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleResetForm}>
                New Bill
              </button>
              <p className="admin-save-hint">
                Data is saved to the <strong>Billing</strong> Google Sheet when you click{' '}
                <strong>Generate Bill</strong> — not on Download or WhatsApp.
              </p>
            </div>
          </section>

          {/* Preview Column */}
          <section className="admin-preview-section">
            {!generatedBill ? (
              <div className="admin-preview-placeholder glass-panel">
                <Receipt size={48} style={{ color: 'var(--color-primary)', opacity: 0.5 }} />
                <h3>Bill Preview</h3>
                <p>
                  Fill in the details and click <strong>Generate Bill</strong> to preview, save to records, and send to the client&apos;s WhatsApp.
                </p>
              </div>
            ) : (
              <>
                <BillPreview bill={generatedBill} billRef={formBillRef} />

                {statusMessage && (
                  <p
                    className={`admin-status-text${
                      shareStatus === 'error'
                        ? ' error'
                        : shareStatus === 'saved' ||
                          shareStatus === 'downloaded' ||
                          shareStatus === 'shared-native' ||
                          shareStatus === 'shared-download' ||
                          shareStatus === 'text-sent'
                        ? ' success'
                        : ''
                    }`}
                  >
                    {statusMessage}
                  </p>
                )}

                <div className="admin-send-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleShareBillImage(generatedBill, formBillRef)}
                    disabled={shareStatus === 'sharing'}
                  >
                    <MessageCircle size={16} /> Send Bill Image to WhatsApp
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-gold"
                    onClick={() => handleSendTextOnly(generatedBill)}
                  >
                    <MessageCircle size={16} /> Send Text Message Only
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleDownloadBill(generatedBill, formBillRef)}
                    disabled={shareStatus === 'sharing'}
                  >
                    <Download size={16} /> Download Bill Image
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setViewMode('list')}
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    <ArrowLeft size={16} /> View in Invoices Records List
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. INDIVIDUAL INVOICE RECORD DETAILS MODAL                     */}
      {/* ============================================================== */}
      {selectedBillForView && (
        <div className="modal-overlay" onClick={() => setSelectedBillForView(null)}>
          <div
            className="modal-content admin-bill-record-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="admin-bill-modal-top">
              <div className="admin-bill-modal-title-wrap">
                <Receipt size={22} className="text-gold" />
                <div>
                  <h3 className="admin-bill-modal-title">
                    Invoice Record: {selectedBillForView.billNo}
                  </h3>
                  <span className="admin-bill-modal-subtitle">
                    Client: {selectedBillForView.clientName} • Billed on {selectedBillForView.serviceDate}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedBillForView(null)}
                aria-label="Close invoice"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Bill Preview + Quick Actions */}
            <div className="admin-bill-modal-body">
              <div className="admin-bill-modal-preview-wrap">
                <BillPreview bill={selectedBillForView} billRef={modalBillRef} />
              </div>

              {/* Sidebar Action Buttons */}
              <div className="admin-bill-modal-sidebar">
                <h4 className="sidebar-section-title">Invoice Actions</h4>

                <div className="admin-bill-modal-actions-list">
                  <button
                    type="button"
                    className="btn btn-primary admin-modal-act-btn"
                    onClick={() => handleShareBillImage(selectedBillForView, modalBillRef)}
                    disabled={shareStatus === 'sharing'}
                  >
                    <MessageCircle size={16} /> Send Bill Image to WhatsApp
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-gold admin-modal-act-btn"
                    onClick={() => handleSendTextOnly(selectedBillForView)}
                  >
                    <MessageCircle size={16} /> Send Text Summary Only
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary admin-modal-act-btn"
                    onClick={() => handleDownloadBill(selectedBillForView, modalBillRef)}
                    disabled={shareStatus === 'sharing'}
                  >
                    <Download size={16} /> Download Invoice (PNG)
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary admin-modal-act-btn"
                    onClick={handlePrintBill}
                  >
                    <Printer size={16} /> Print Receipt
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger-outline admin-modal-act-btn"
                    onClick={() => setBillToDelete(selectedBillForView)}
                    style={{
                      borderColor: 'rgba(239, 68, 68, 0.4)',
                      color: '#f87171',
                      marginTop: '0.75rem',
                    }}
                  >
                    <Trash2 size={16} /> Delete Invoice Record
                  </button>
                </div>

                {statusMessage && (
                  <p
                    className={`admin-status-text${
                      shareStatus === 'error'
                        ? ' error'
                        : shareStatus === 'saved' ||
                          shareStatus === 'downloaded' ||
                          shareStatus === 'shared-native' ||
                          shareStatus === 'shared-download' ||
                          shareStatus === 'text-sent'
                        ? ' success'
                        : ''
                    }`}
                    style={{ marginTop: '1rem' }}
                  >
                    {statusMessage}
                  </p>
                )}

                <div className="admin-bill-record-info-box">
                  <div className="info-row">
                    <span className="info-label">Invoice Number:</span>
                    <strong className="info-val">{selectedBillForView.billNo}</strong>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Client Name:</span>
                    <strong className="info-val">{selectedBillForView.clientName}</strong>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Phone:</span>
                    <strong className="info-val">{selectedBillForView.clientPhone || '—'}</strong>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Net Payable:</span>
                    <strong className="info-val text-gold">
                      {formatCurrency(selectedBillForView.total)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Invoice Confirmation Modal */}
      {billToDelete && (
        <ConfirmModal
          isOpen={Boolean(billToDelete)}
          title="Delete Invoice Record"
          message={`Are you sure you want to delete invoice ${billToDelete.billNo} for "${billToDelete.clientName}"?`}
          itemName={`${billToDelete.billNo} — ${formatCurrency(billToDelete.total)}`}
          confirmLabel="Yes, Delete Invoice"
          cancelLabel="Keep Invoice"
          variant="danger"
          details={[
            { label: 'Client', value: billToDelete.clientName },
            { label: 'Service Date', value: billToDelete.serviceDate },
            { label: 'Total Payable', value: formatCurrency(billToDelete.total) },
          ]}
          onConfirm={confirmDeleteBill}
          onCancel={() => setBillToDelete(null)}
        />
      )}
    </div>
  );
}
