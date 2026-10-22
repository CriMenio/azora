import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Users,
  Star,
  Calendar,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Plus,
  ArrowRight,
  MessageCircle,
  ExternalLink,
  CheckCircle,
  Clock,
  MapPin,
  Tag,
  Phone,
  Images,
  Database,
  ArrowUpRight,
} from 'lucide-react';
import { getLocalBills } from '../services/billingHistoryService';
import { getCustomers } from '../services/customerService';
import { getAdminRecords } from '../services/spreadsheetService';
import { formatCurrency } from '../data/servicesCatalog';

export default function AdminDashboard({ adminPin, onNavigate }) {
  const [localBills, setLocalBills] = useState(getLocalBills);
  const [customers, setCustomers] = useState(getCustomers);
  const [sheetRecords, setSheetRecords] = useState(null);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  // Listen for local updates to customer diary or bills
  useEffect(() => {
    const handleCustomerUpdate = (e) => {
      setCustomers(e.detail || getCustomers());
    };
    const handleBillingUpdate = (e) => {
      setLocalBills(e.detail || getLocalBills());
    };

    window.addEventListener('azora-customers-updated', handleCustomerUpdate);
    window.addEventListener('azora-billing-updated', handleBillingUpdate);

    return () => {
      window.removeEventListener('azora-customers-updated', handleCustomerUpdate);
      window.removeEventListener('azora-billing-updated', handleBillingUpdate);
    };
  }, []);

  // Fetch sheet records
  const fetchRecords = useCallback(async () => {
    setLoadingSheet(true);
    setSheetError('');
    try {
      const data = await getAdminRecords(adminPin);
      setSheetRecords(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('Dashboard sheet fetch notice:', err.message);
      setSheetError(err.message || 'Sheet sync not configured or requires redeploy.');
    } finally {
      setLoadingSheet(false);
    }
  }, [adminPin]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Combined Billing Metrics
  const billingStats = useMemo(() => {
    const sheetBills = sheetRecords?.billing || [];
    // Combine unique bills by billNo
    const billMap = new Map();
    // Add local bills first
    localBills.forEach((b) => {
      if (b.billNo) billMap.set(b.billNo, b);
    });
    // Merge sheet bills
    sheetBills.forEach((b) => {
      if (b.billNo) {
        billMap.set(b.billNo, {
          ...b,
          total: Number(b.total) || 0,
          subtotal: Number(b.subtotal) || 0,
        });
      }
    });

    const combinedList = Array.from(billMap.values());
    const count = Math.max(combinedList.length, sheetRecords?.counts?.billing || 0);
    const totalRevenue = combinedList.reduce((acc, b) => acc + (Number(b.total) || 0), 0);
    const avgBill = count > 0 ? Math.round(totalRevenue / count) : 0;

    return {
      count,
      totalRevenue,
      avgBill,
      recentBills: combinedList.slice(0, 5),
    };
  }, [localBills, sheetRecords]);

  // Combined Client Metrics
  const clientStats = useMemo(() => {
    const crmCount = customers.length;
    const sheetBookings = sheetRecords?.bookings || [];
    const sheetContacts = sheetRecords?.contacts || [];
    const sheetCustomers = sheetRecords?.customers || [];

    // Unique phone numbers across sources
    const uniquePhones = new Set();
    customers.forEach((c) => {
      if (c.phone) uniquePhones.add(c.phone.replace(/\D/g, ''));
    });
    sheetCustomers.forEach((c) => {
      if (c.phone) uniquePhones.add(String(c.phone).replace(/\D/g, ''));
    });
    sheetBookings.forEach((b) => {
      if (b.phone) uniquePhones.add(String(b.phone).replace(/\D/g, ''));
    });
    sheetContacts.forEach((c) => {
      if (c.phone) uniquePhones.add(String(c.phone).replace(/\D/g, ''));
    });

    const totalUnique = Math.max(uniquePhones.size, crmCount, sheetCustomers.length);

    return {
      crmCount: Math.max(crmCount, sheetCustomers.length),
      bookingsCount: sheetBookings.length,
      totalUnique,
      recentBookings: sheetBookings.slice(0, 4),
    };
  }, [customers, sheetRecords]);

  // Combined Reviews / Feedback Metrics
  const reviewStats = useMemo(() => {
    // Reviews from CRM Customer Diary
    const crmReviews = customers
      .filter((c) => c.feedback && c.feedback.trim())
      .map((c) => ({
        id: `crm-${c.id}`,
        name: c.fullName,
        service: c.service,
        rating: c.rating || 5,
        quote: c.feedback,
        date: c.visitDate,
        source: 'Customer Diary',
      }));

    // Reviews from Google Sheet Feedback
    const sheetFeedback = (sheetRecords?.feedback || []).map((f, idx) => ({
      id: `sheet-${f.id || idx}`,
      name: f.name || 'Salon Client',
      service: f.role || 'Client Feedback',
      rating: Number(f.stars) || 5,
      quote: f.quote || '',
      date: f.timestamp ? new Date(f.timestamp).toLocaleDateString() : 'Recent',
      source: 'Website / Google',
    }));

    const allReviews = [...crmReviews, ...sheetFeedback];
    const totalCount = Math.max(allReviews.length, sheetRecords?.counts?.feedback || 0);

    const fiveStarCount = allReviews.filter((r) => r.rating === 5).length;
    const sumRatings = allReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    const avgRating = allReviews.length > 0 ? (sumRatings / allReviews.length).toFixed(1) : '5.0';

    return {
      totalCount,
      fiveStarCount,
      avgRating,
      recentReviews: allReviews.slice(0, 4),
    };
  }, [customers, sheetRecords]);

  return (
    <div className="admin-dashboard-page">
      {/* Top Welcome & Actions Header */}
      <div className="admin-dashboard-header glass-panel">
        <div>
          <span className="admin-panel-badge">
            <LayoutDashboard size={14} /> Executive Salon Overview
          </span>
          <h1 className="admin-dashboard-title">Operations Dashboard</h1>
          <p className="admin-section-desc">
            Real-time visibility into generated billing invoices, active client records, customer reviews, and appointments.
          </p>
        </div>

        <div className="admin-dashboard-header-actions">
          <button
            type="button"
            className="btn btn-outline-gold admin-dashboard-refresh-btn"
            onClick={fetchRecords}
            disabled={loadingSheet}
            title="Refresh records from Google Sheets"
          >
            <RefreshCw size={15} className={loadingSheet ? 'admin-records-spin' : ''} />
            <span>{loadingSheet ? 'Syncing...' : 'Sync Data'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary admin-dashboard-action-btn"
            onClick={() => onNavigate('billing')}
          >
            <Plus size={16} /> Create New Bill
          </button>
        </div>
      </div>

      {sheetError && (
        <div className="admin-dashboard-sync-banner">
          <Clock size={16} />
          <span>
            Google Sheets sync note: Displaying local records. ({sheetError})
          </span>
          <button
            type="button"
            className="admin-dashboard-sync-link"
            onClick={() => onNavigate('records')}
          >
            Check Sheet Config →
          </button>
        </div>
      )}

      {/* 3 Core Metric Cards Requested by User + 1 Highlight Card */}
      <div className="admin-dashboard-metrics-grid">
        {/* Metric 1: How many billing are generated */}
        <div
          className="admin-metric-card glass-panel admin-metric-card--gold"
          onClick={() => onNavigate('billing')}
          role="button"
          tabIndex={0}
          title="Click to open Billing screen"
        >
          <div className="admin-metric-card-top">
            <div className="admin-metric-icon-wrap admin-metric-icon--gold">
              <Receipt size={22} />
            </div>
            <span className="admin-metric-pill">Invoices</span>
          </div>

          <div className="admin-metric-body">
            <span className="admin-metric-label">Bills Generated</span>
            <div className="admin-metric-main-val">
              <strong>{billingStats.count}</strong>
              <span className="admin-metric-unit">Invoices</span>
            </div>
            <div className="admin-metric-subtext">
              Total Invoiced: <strong className="text-gold">{formatCurrency(billingStats.totalRevenue)}</strong>
            </div>
          </div>

          <div className="admin-metric-footer">
            <span>Manage billing &amp; receipts</span>
            <ArrowRight size={14} className="metric-arrow" />
          </div>
        </div>

        {/* Metric 2: How many clients we have in records */}
        <div
          className="admin-metric-card glass-panel admin-metric-card--blue"
          onClick={() => onNavigate('customers')}
          role="button"
          tabIndex={0}
          title="Click to open Customer Diary"
        >
          <div className="admin-metric-card-top">
            <div className="admin-metric-icon-wrap admin-metric-icon--blue">
              <Users size={22} />
            </div>
            <span className="admin-metric-pill">Client Base</span>
          </div>

          <div className="admin-metric-body">
            <span className="admin-metric-label">Clients in Records</span>
            <div className="admin-metric-main-val">
              <strong>{clientStats.totalUnique}</strong>
              <span className="admin-metric-unit">Contacts</span>
            </div>
            <div className="admin-metric-subtext">
              <span>{clientStats.crmCount} in CRM Diary</span>
              <span className="admin-metric-bullet">•</span>
              <span>{clientStats.bookingsCount} via Bookings</span>
            </div>
          </div>

          <div className="admin-metric-footer">
            <span>Open Customer Profiles</span>
            <ArrowRight size={14} className="metric-arrow" />
          </div>
        </div>

        {/* Metric 3: Customer review count */}
        <div
          className="admin-metric-card glass-panel admin-metric-card--purple"
          onClick={() => onNavigate('customers')}
          role="button"
          tabIndex={0}
          title="Click to view Customer Reviews"
        >
          <div className="admin-metric-card-top">
            <div className="admin-metric-icon-wrap admin-metric-icon--purple">
              <Star size={22} />
            </div>
            <span className="admin-metric-pill">Testimonials</span>
          </div>

          <div className="admin-metric-body">
            <span className="admin-metric-label">Customer Reviews</span>
            <div className="admin-metric-main-val">
              <strong>{reviewStats.totalCount}</strong>
              <span className="admin-metric-unit">Reviews</span>
            </div>
            <div className="admin-metric-subtext">
              <span className="text-gold">★ {reviewStats.avgRating} Avg Rating</span>
              <span className="admin-metric-bullet">•</span>
              <span>{reviewStats.fiveStarCount} 5-Star</span>
            </div>
          </div>

          <div className="admin-metric-footer">
            <span>Explore reviews &amp; feedback</span>
            <ArrowRight size={14} className="metric-arrow" />
          </div>
        </div>

        {/* Metric 4: Online Bookings & Appointments */}
        <div
          className="admin-metric-card glass-panel admin-metric-card--emerald"
          onClick={() => onNavigate('records')}
          role="button"
          tabIndex={0}
          title="Click to view Sheet Records"
        >
          <div className="admin-metric-card-top">
            <div className="admin-metric-icon-wrap admin-metric-icon--emerald">
              <Calendar size={22} />
            </div>
            <span className="admin-metric-pill">Appointments</span>
          </div>

          <div className="admin-metric-body">
            <span className="admin-metric-label">Online Bookings</span>
            <div className="admin-metric-main-val">
              <strong>{clientStats.bookingsCount}</strong>
              <span className="admin-metric-unit">Booked</span>
            </div>
            <div className="admin-metric-subtext">
              Real-time Google Sheet appointments
            </div>
          </div>

          <div className="admin-metric-footer">
            <span>Inspect appointment log</span>
            <ArrowRight size={14} className="metric-arrow" />
          </div>
        </div>
      </div>

      {/* Fast Navigation Workspace Tiles */}
      <div className="admin-dashboard-section-title">
        <h3>Workspace Modules</h3>
        <span className="admin-dashboard-section-sub">Quick jump to any admin function</span>
      </div>

      <div className="admin-dashboard-nav-tiles">
        <button
          type="button"
          className="admin-nav-tile glass-panel"
          onClick={() => onNavigate('billing')}
        >
          <div className="nav-tile-icon-box">
            <Receipt size={20} />
          </div>
          <div className="nav-tile-info">
            <h4>Billing &amp; Invoices</h4>
            <p>Compute charges, generate invoice numbers &amp; send WhatsApp bills</p>
          </div>
          <ArrowUpRight size={18} className="nav-tile-arrow" />
        </button>

        <button
          type="button"
          className="admin-nav-tile glass-panel"
          onClick={() => onNavigate('customers')}
        >
          <div className="nav-tile-icon-box">
            <Users size={20} />
          </div>
          <div className="nav-tile-info">
            <h4>Customer Diary</h4>
            <p>Full name, area address, makeover photos, feedback &amp; stylist remarks</p>
          </div>
          <ArrowUpRight size={18} className="nav-tile-arrow" />
        </button>

        <button
          type="button"
          className="admin-nav-tile glass-panel"
          onClick={() => onNavigate('records')}
        >
          <div className="nav-tile-icon-box">
            <Database size={20} />
          </div>
          <div className="nav-tile-info">
            <h4>Sheet Records</h4>
            <p>Explore live data sync for bookings, contacts, bills &amp; feedback</p>
          </div>
          <ArrowUpRight size={18} className="nav-tile-arrow" />
        </button>

        <button
          type="button"
          className="admin-nav-tile glass-panel"
          onClick={() => onNavigate('offers')}
        >
          <div className="nav-tile-icon-box">
            <Sparkles size={20} />
          </div>
          <div className="nav-tile-info">
            <h4>Offers &amp; Packages</h4>
            <p>Manage festive combos, deal banners &amp; website visibility</p>
          </div>
          <ArrowUpRight size={18} className="nav-tile-arrow" />
        </button>

        <button
          type="button"
          className="admin-nav-tile glass-panel"
          onClick={() => onNavigate('gallery')}
        >
          <div className="nav-tile-icon-box">
            <Images size={20} />
          </div>
          <div className="nav-tile-info">
            <h4>Gallery Portfolio</h4>
            <p>Google Drive salon photos, haircut &amp; bridal makeover images</p>
          </div>
          <ArrowUpRight size={18} className="nav-tile-arrow" />
        </button>
      </div>

      {/* Recent Activity: Bills & Reviews Split Grid */}
      <div className="admin-dashboard-split-grid">
        {/* Left Column: Recent Generated Invoices */}
        <div className="admin-dashboard-card glass-panel">
          <div className="admin-dash-card-header">
            <div>
              <h3>Recent Invoices Generated</h3>
              <p className="dash-card-sub">Latest customer bills created in Azora</p>
            </div>
            <button
              type="button"
              className="btn btn-outline-gold btn-sm"
              onClick={() => onNavigate('billing')}
            >
              + New Bill
            </button>
          </div>

          <div className="admin-dash-bills-list">
            {billingStats.recentBills.length === 0 ? (
              <p className="admin-dash-empty">No billing invoices generated yet.</p>
            ) : (
              billingStats.recentBills.map((b, idx) => {
                const phoneClean = (b.clientPhone || b.phone || '').replace(/\D/g, '');
                const waPhone = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;

                return (
                  <div key={b.billNo || idx} className="admin-dash-bill-item">
                    <div className="dash-bill-left">
                      <div className="dash-bill-no-badge">{b.billNo}</div>
                      <div>
                        <h4 className="dash-bill-client">{b.clientName}</h4>
                        <div className="dash-bill-meta">
                          <span>{b.serviceDate}</span>
                          {b.clientPhone && <span>• {b.clientPhone}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="dash-bill-right">
                      <strong className="dash-bill-amount text-gold">
                        {formatCurrency(b.total)}
                      </strong>
                      {phoneClean && (
                        <a
                          href={`https://wa.me/${waPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dash-bill-wa-btn"
                          title="Open WhatsApp chat"
                        >
                          <MessageCircle size={15} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="admin-dash-card-footer">
            <button
              type="button"
              className="dash-card-more-link"
              onClick={() => onNavigate('billing')}
            >
              Go to Billing Screen <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Column: Recent Customer Reviews & Feedback */}
        <div className="admin-dashboard-card glass-panel">
          <div className="admin-dash-card-header">
            <div>
              <h3>Recent Customer Reviews</h3>
              <p className="dash-card-sub">Client feedback from diary &amp; website</p>
            </div>
            <button
              type="button"
              className="btn btn-outline-gold btn-sm"
              onClick={() => onNavigate('customers')}
            >
              Customer Diary
            </button>
          </div>

          <div className="admin-dash-reviews-list">
            {reviewStats.recentReviews.length === 0 ? (
              <p className="admin-dash-empty">No reviews recorded yet.</p>
            ) : (
              reviewStats.recentReviews.map((rev) => (
                <div key={rev.id} className="admin-dash-review-item">
                  <div className="dash-rev-top">
                    <div>
                      <h4 className="dash-rev-name">{rev.name}</h4>
                      {rev.service && (
                        <span className="dash-rev-service">{rev.service}</span>
                      )}
                    </div>
                    <div className="dash-rev-stars">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} size={13} fill="currentColor" className="text-gold" />
                      ))}
                    </div>
                  </div>

                  <p className="dash-rev-quote">"{rev.quote}"</p>

                  <div className="dash-rev-meta">
                    <span className="dash-rev-badge">{rev.source}</span>
                    <span className="dash-rev-date">{rev.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="admin-dash-card-footer">
            <button
              type="button"
              className="dash-card-more-link"
              onClick={() => onNavigate('customers')}
            >
              Manage in Customer Diary <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
