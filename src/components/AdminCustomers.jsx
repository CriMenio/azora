import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  X,
  Phone,
  MapPin,
  Calendar,
  Tag,
  Star,
  MessageSquare,
  Edit2,
  Trash2,
  Camera,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Image as ImageIcon,
  FileText,
  Download,
  Filter,
  Plus,
  Maximize2,
  Clock,
  Sparkles,
  RefreshCw,
  Eye,
  IndianRupee,
  Table as TableIcon,
  LayoutGrid,
  CheckCircle2,
} from 'lucide-react';
import {
  getCustomers,
  saveCustomer,
  deleteCustomer,
  compressCustomerImage,
  filterCustomers,
  formatVisitDate,
  formatVisitTime,
  syncCustomersWithSheet,
} from '../services/customerService';
import { SERVICES_CATALOG } from '../data/servicesCatalog';
import ConfirmModal from './ConfirmModal';

const REFERENCE_OPTIONS = [
  'Instagram / Social Media',
  'Google Search / Maps',
  'Friend / Family Referral',
  'Walk-in Client',
  'Preeti’s Direct Client',
  'Local Banner / Flyer',
  'Other',
];

const QUICK_SERVICE_TAGS = [
  'Haircut & Styling',
  'Hydra Facial',
  'Hair Color / Balayage',
  'Hair Spa / Botox',
  'Bridal Makeover',
  'Gel Nail Extensions',
  'Waxing & D-Tan',
  'Men’s Grooming',
];

export const VISIT_TIME_SLOTS = [
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
  '05:30 PM',
  '06:00 PM',
  '06:30 PM',
  '07:00 PM',
  '07:30 PM',
  '08:00 PM',
  '08:30 PM',
  '09:00 PM',
  '09:30 PM',
  '10:00 PM',
  '10:30 PM',
  '11:00 PM',
  '11:30 PM',
  '12:00 AM',
];

export default function AdminCustomers({ adminPin }) {
  const [customers, setCustomers] = useState(getCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Modal State
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customTimeMode, setCustomTimeMode] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    service: '',
    amount: '',
    status: 'Done',
    reference: 'Instagram / Social Media',
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: '',
    rating: 5,
    feedback: '',
    remarks: '',
    images: [],
  });

  const [formErrors, setFormErrors] = useState({});
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail) setCustomers(e.detail);
      else setCustomers(getCustomers());
    };
    window.addEventListener('azora-customers-updated', handleUpdate);
    return () => window.removeEventListener('azora-customers-updated', handleUpdate);
  }, []);

  const [sortOrder, setSortOrder] = useState('visit_desc');

  // Filtered customer list (Visit Date & Time on top by default)
  const filteredList = useMemo(() => {
    return filterCustomers(customers, searchQuery, filterCategory, sortOrder);
  }, [customers, searchQuery, filterCategory, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const total = customers.length;
    const doneCount = customers.filter((c) => (c.status || 'Done') === 'Done').length;
    const pendingCount = customers.filter((c) => c.status === 'Pending').length;
    const cancelCount = customers.filter((c) => c.status === 'Cancel').length;
    const withFeedback = customers.filter((c) => c.feedback && c.feedback.trim()).length;
    const fiveStars = customers.filter((c) => c.rating === 5).length;
    const totalPhotos = customers.reduce((acc, c) => acc + (Array.isArray(c.images) ? c.images.length : 0), 0);
    return { total, doneCount, pendingCount, cancelCount, withFeedback, fiveStars, totalPhotos };
  }, [customers]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setCustomTimeMode(false);
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      address: '',
      service: '',
      amount: '',
      status: 'Done',
      reference: 'Instagram / Social Media',
      visitDate: new Date().toISOString().split('T')[0],
      visitTime: '',
      rating: 5,
      feedback: '',
      remarks: '',
      images: [],
    });
    setFormErrors({});
    setImageError('');
    setIsFormOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    const existingTime = formatVisitTime(customer.visitTime || customer.time || '');
    setCustomTimeMode(Boolean(existingTime && !VISIT_TIME_SLOTS.includes(existingTime)));
    setFormData({
      fullName: customer.fullName || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      service: customer.service || '',
      amount: customer.amount || '',
      status: customer.status || 'Done',
      reference: customer.reference || 'Instagram / Social Media',
      visitDate: customer.visitDate ? String(customer.visitDate).split('T')[0] : new Date().toISOString().split('T')[0],
      visitTime: existingTime,
      rating: customer.rating || 5,
      feedback: customer.feedback || '',
      remarks: customer.remarks || '',
      images: Array.isArray(customer.images) ? [...customer.images] : [],
    });
    setFormErrors({});
    setImageError('');
    setIsFormOpen(true);
  };

  const handleQuickStatusChange = async (client, newStatus) => {
    if (!newStatus || client.status === newStatus) return;
    const updated = { ...client, status: newStatus };
    const res = await saveCustomer(updated, adminPin);
    if (res.success) {
      setFeedbackSuccess(`Status updated to "${newStatus}" for ${client.fullName}`);
      setTimeout(() => setFeedbackSuccess(''), 3000);
    }
  };

  const closeModal = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
    setFormErrors({});
  };

  // Image Upload handler
  const handleImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    setImageUploading(true);
    setImageError('');

    try {
      const newImages = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const compressedBase64 = await compressCustomerImage(file);
        newImages.push(compressedBase64);
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
    } catch (err) {
      setImageError('Failed to process image: ' + err.message);
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.fullName.trim()) errors.fullName = 'Client Full Name is required';
    if (!formData.phone.trim()) errors.phone = 'Contact phone number is required';
    if (!formData.service.trim()) errors.service = 'Please specify service(s) availed';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      ...(editingCustomer ? { id: editingCustomer.id } : {}),
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      service: formData.service.trim(),
      amount: formData.amount ? formData.amount.trim() : '',
      status: formData.status || 'Done',
      reference: formData.reference,
      visitDate: formData.visitDate,
      visitTime: (formData.visitTime || '').trim(),
      rating: Number(formData.rating) || 5,
      feedback: formData.feedback.trim(),
      remarks: formData.remarks.trim(),
      images: formData.images,
    };

    setIsSaving(true);
    try {
      const res = await saveCustomer(payload, adminPin);
      if (res.success) {
        const sheetMsg = res.sheetResult?.success
          ? ' & synced to Google Sheets (Customers tab)!'
          : ' (synced locally; redeploy script for sheet write)';
        setFeedbackSuccess(editingCustomer ? `Client profile updated${sheetMsg}` : `New client profile saved${sheetMsg}`);
        setTimeout(() => setFeedbackSuccess(''), 4500);
        closeModal();
      } else {
        alert('Error saving customer: ' + res.error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    await deleteCustomer(customerToDelete.id, adminPin);
    setFeedbackSuccess(`Profile for "${customerToDelete.fullName}" deleted locally and from sheet`);
    setTimeout(() => setFeedbackSuccess(''), 3500);
    setCustomerToDelete(null);
  };

  const handleSyncSheet = async () => {
    setIsSyncing(true);
    try {
      const merged = await syncCustomersWithSheet(adminPin);
      setCustomers(merged);
      setFeedbackSuccess(`✓ Synced ${merged.length} client profile(s) with Google Sheets (Customers tab)`);
      setTimeout(() => setFeedbackSuccess(''), 4000);
    } catch (err) {
      console.warn('Sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const exportToCSV = () => {
    if (customers.length === 0) {
      alert('No customer records to export.');
      return;
    }

    const headers = [
      'Customer ID',
      'Full Name',
      'Phone',
      'Email',
      'Address',
      'Services',
      'Amount',
      'Status',
      'Reference',
      'Visit Date',
      'Visit Time',
      'Rating',
      'Customer Feedback',
      'Stylist Remarks',
      'Photos Count',
    ];

    const rows = customers.map((c) => [
      c.id,
      `"${(c.fullName || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${(c.service || '').replace(/"/g, '""')}"`,
      `"${(c.amount || '').replace(/"/g, '""')}"`,
      `"${(c.status || 'Done').replace(/"/g, '""')}"`,
      `"${(c.reference || '').replace(/"/g, '""')}"`,
      c.visitDate || '',
      `"${(c.visitTime || c.time || '').replace(/"/g, '""')}"`,
      c.rating || 5,
      `"${(c.feedback || '').replace(/"/g, '""')}"`,
      `"${(c.remarks || '').replace(/"/g, '""')}"`,
      Array.isArray(c.images) ? c.images.length : 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Azora_Customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-customers-page">
      {/* Header & Stats Banner */}
      <div className="admin-customers-header glass-panel">
        <div>
          <span className="admin-panel-badge"><Users size={14} /> Client Directory &amp; CRM</span>
          <h2 className="admin-customers-title">Customer Profiles &amp; Makeovers</h2>
          <p className="admin-section-desc">
            Save and manage client address details, services availed, referral sources, makeover photos, reviews, and stylist remarks.
          </p>
        </div>

        <div className="admin-customers-header-actions">
          <button
            type="button"
            className="btn btn-outline-gold"
            onClick={handleSyncSheet}
            disabled={isSyncing}
            title="Sync customer records with Google Sheets"
          >
            <RefreshCw size={15} className={isSyncing ? 'admin-records-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Sheet'}</span>
          </button>
          <button type="button" className="btn btn-outline-gold" onClick={exportToCSV} title="Export customer data to CSV">
            <Download size={16} /> Export CSV
          </button>
          <button type="button" className="btn btn-primary" onClick={openAddModal}>
            <UserPlus size={16} /> Add New Client
          </button>
        </div>
      </div>

      {feedbackSuccess && (
        <div className="admin-offers-alert admin-offers-alert--success" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle size={18} />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {/* Quick Metrics Bar */}
      <div className="admin-customers-stats-grid">
        <div className="admin-customer-stat-card glass-panel">
          <span className="stat-label">Total Clients</span>
          <strong className="stat-val text-gold">{stats.total}</strong>
          <span className="stat-sub">Active in salon directory</span>
        </div>
        <div className="admin-customer-stat-card glass-panel">
          <span className="stat-label">Done (Completed)</span>
          <strong className="stat-val" style={{ color: '#10b981' }}>{stats.doneCount}</strong>
          <span className="stat-sub">Services served &amp; finished</span>
        </div>
        <div className="admin-customer-stat-card glass-panel">
          <span className="stat-label">Pending / Scheduled</span>
          <strong className="stat-val" style={{ color: '#f59e0b' }}>{stats.pendingCount}</strong>
          <span className="stat-sub">Upcoming &amp; in-progress</span>
        </div>
        <div className="admin-customer-stat-card glass-panel">
          <span className="stat-label">5-Star Praises</span>
          <strong className="stat-val text-gold">{stats.fiveStars}</strong>
          <span className="stat-sub">Top rated client visits</span>
        </div>
      </div>

      {/* Toolbar: Search, Filters & View Toggle */}
      <div className="admin-customers-toolbar glass-panel">
        <div className="admin-customers-search-wrap">
          <Search size={16} className="admin-customers-search-icon" aria-hidden="true" />
          <input
            type="search"
            className="form-control admin-customers-search-input"
            placeholder="Search by client name, phone, address, service, amount, or status..."
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

        <div className="admin-customers-toolbar-right">
          <div className="admin-customers-filter-pills">
            <button
              type="button"
              className={`admin-filter-pill ${filterCategory === 'all' ? 'active' : ''}`}
              onClick={() => setFilterCategory('all')}
            >
              All ({customers.length})
            </button>
            <button
              type="button"
              className={`admin-filter-pill admin-filter-pill--done ${filterCategory === 'done' ? 'active' : ''}`}
              onClick={() => setFilterCategory('done')}
            >
              ● Done ({stats.doneCount})
            </button>
            <button
              type="button"
              className={`admin-filter-pill admin-filter-pill--pending ${filterCategory === 'pending' ? 'active' : ''}`}
              onClick={() => setFilterCategory('pending')}
            >
              ● Pending ({stats.pendingCount})
            </button>
            {stats.cancelCount > 0 && (
              <button
                type="button"
                className={`admin-filter-pill admin-filter-pill--cancel ${filterCategory === 'cancel' ? 'active' : ''}`}
                onClick={() => setFilterCategory('cancel')}
              >
                ● Cancel ({stats.cancelCount})
              </button>
            )}
            <button
              type="button"
              className={`admin-filter-pill ${filterCategory === '5star' ? 'active' : ''}`}
              onClick={() => setFilterCategory('5star')}
            >
              ⭐ 5-Star
            </button>
            <button
              type="button"
              className={`admin-filter-pill ${filterCategory === 'hasImages' ? 'active' : ''}`}
              onClick={() => setFilterCategory('hasImages')}
            >
              📸 Photos
            </button>
          </div>

          <div className="admin-customers-sort-wrap">
            <label className="admin-customers-sort-label">
              <Clock size={13} className="text-gold" /> Sort:
            </label>
            <select
              className="admin-customers-sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              title="Change customer list order"
            >
              <option value="visit_desc">📅 Visit Date &amp; Time (Newest on top)</option>
              <option value="visit_asc">📅 Visit Date &amp; Time (Oldest first)</option>
              <option value="time_asc">⏰ Time (Morning to Night)</option>
              <option value="time_desc">⏰ Time (Night to Morning)</option>
              <option value="name_asc">👤 Customer Name (A to Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Directory Table */}
      {filteredList.length === 0 ? (
        <div className="admin-customers-empty glass-panel">
          <Users size={36} className="text-gold" style={{ opacity: 0.6, marginBottom: '0.75rem' }} />
          <h3>No Customer Records Found</h3>
          <p>{searchQuery ? `No client profiles match "${searchQuery}".` : 'Your customer directory is currently empty.'}</p>
          <button type="button" className="btn btn-primary" onClick={openAddModal} style={{ marginTop: '1rem' }}>
            <UserPlus size={16} /> Add First Customer
          </button>
        </div>
      ) : (
        <div className="admin-cust-table-card glass-panel">
          <div className="admin-cust-table-responsive">
            <table className="admin-cust-table">
              <thead>
                <tr>
                  <th style={{ width: '18%' }}>Customer Name</th>
                  <th style={{ width: '13%' }}>Phone No</th>
                  <th style={{ width: '20%' }}>Service</th>
                  <th style={{ width: '11%' }}>Amount</th>
                  <th
                    style={{ width: '12%', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setSortOrder(sortOrder === 'visit_desc' ? 'visit_asc' : 'visit_desc')}
                    title="Click to toggle sorting by Visit Date (Newest / Oldest)"
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      Visit Date
                      <span className={`admin-sort-caret ${sortOrder.startsWith('visit_') ? 'active text-gold' : ''}`}>
                        {sortOrder === 'visit_desc' ? '▼' : sortOrder === 'visit_asc' ? '▲' : '↕'}
                      </span>
                    </span>
                  </th>
                  <th
                    style={{ width: '10%', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setSortOrder(sortOrder === 'time_asc' ? 'time_desc' : 'time_asc')}
                    title="Click to toggle sorting by Time (Morning to Night / Night to Morning)"
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      Time
                      <span className={`admin-sort-caret ${sortOrder.startsWith('time_') ? 'active text-gold' : ''}`}>
                        {sortOrder === 'time_asc' ? '▲' : sortOrder === 'time_desc' ? '▼' : '↕'}
                      </span>
                    </span>
                  </th>
                  <th style={{ width: '8%' }}>Status</th>
                  <th style={{ width: '8%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((client) => {
                  const cleanPhone = String(client.phone || '').replace(/[^0-9]/g, '');
                  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                  const waMsg = encodeURIComponent(`Hi ${client.fullName}, thank you for choosing Azora Salon & Spa!`);
                  const displayStatus = client.status || 'Done';
                  const initials = client.fullName.trim().split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase() || 'C';

                  const rawAmt = client.amount ? String(client.amount).replace(/^₹\s*/, '').trim() : '';
                  const isRefNumeric = !rawAmt && /^\d+([,.]\d+)?$/.test(String(client.reference || '').trim());
                  const amtToDisplay = rawAmt || (isRefNumeric ? String(client.reference).trim() : '');

                  return (
                    <tr
                      key={client.id}
                      className="admin-cust-row"
                      onClick={() => setViewingCustomer(client)}
                      title="Click to view full customer profile dossier"
                    >
                      {/* Customer Name */}
                      <td className="admin-cust-td-name">
                        <div className="admin-cust-name-cell">
                          <div className="admin-cust-table-avatar">
                            {initials}
                          </div>
                          <div>
                            <strong className="admin-cust-table-fullname">{client.fullName}</strong>
                            {client.address && (
                              <span className="admin-cust-table-sub" title={client.address}>
                                <MapPin size={11} /> {client.address}
                              </span>
                            )}
                            {Array.isArray(client.images) && client.images.length > 0 && (
                              <span className="admin-cust-table-photos-tag">
                                <Camera size={11} /> {client.images.length} photo{client.images.length === 1 ? '' : 's'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone No */}
                      <td className="admin-cust-td-phone" onClick={(e) => e.stopPropagation()}>
                        {client.phone ? (
                          <div className="admin-cust-phone-wrap">
                            <span className="admin-cust-phone-text">{client.phone}</span>
                            <div className="admin-cust-quick-links">
                              <a
                                href={`https://wa.me/${waPhone}?text=${waMsg}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-cust-mini-action admin-cust-mini-action--wa"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle size={13} />
                              </a>
                              <a
                                href={`tel:${client.phone}`}
                                className="admin-cust-mini-action admin-cust-mini-action--call"
                                title="Call customer"
                              >
                                <Phone size={12} />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* Service */}
                      <td className="admin-cust-td-service">
                        <span className="admin-cust-table-service-pill" title={client.service || 'General Service'}>
                          <Sparkles size={12} /> {client.service || 'General Service'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="admin-cust-td-amount">
                        {amtToDisplay ? (
                          <strong className="admin-cust-table-amount text-gold">
                            ₹{amtToDisplay}
                          </strong>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* Visit Date */}
                      <td className="admin-cust-td-date">
                        <div className="admin-cust-date-wrap">
                          <span className="admin-cust-table-date">
                            <Calendar size={12} /> {formatVisitDate(client.visitDate)}
                          </span>
                          {client.reference && !isRefNumeric && (
                            <span className="admin-cust-table-ref" title={`Source: ${client.reference}`}>
                              {client.reference}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Time */}
                      <td className="admin-cust-td-time">
                        {client.visitTime || client.time ? (
                          <span className="admin-cust-table-time">
                            <Clock size={12} className="text-gold" /> {formatVisitTime(client.visitTime || client.time)}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* Status (Done / Pending / Cancel) */}
                      <td className="admin-cust-td-status" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-status-dropdown-wrap">
                          <select
                            className={`admin-status-badge-select admin-status--${displayStatus.toLowerCase()}`}
                            value={displayStatus}
                            onChange={(e) => handleQuickStatusChange(client, e.target.value)}
                            title="Click to update status"
                          >
                            <option value="Done">● Done</option>
                            <option value="Pending">● Pending</option>
                            <option value="Cancel">● Cancel</option>
                          </select>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="admin-cust-td-actions" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-cust-row-actions">
                          <button
                            type="button"
                            className="admin-cust-btn admin-cust-btn--view"
                            onClick={() => setViewingCustomer(client)}
                            title="View Full Profile Dossier"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            className="admin-cust-btn admin-cust-btn--edit"
                            onClick={() => openEditModal(client)}
                            title="Edit Customer Details"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="admin-cust-btn admin-cust-btn--delete"
                            onClick={() => handleDeleteClick(client)}
                            title="Delete Customer Profile"
                          >
                            <Trash2 size={14} />
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

      {/* Add / Edit Customer Modal */}
      {isFormOpen && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Users size={20} className="text-gold" />
                <h3 className="admin-modal-title">
                  {editingCustomer ? `Edit Client: ${editingCustomer.fullName}` : 'Add New Client Profile'}
                </h3>
              </div>
              <button type="button" className="admin-modal-close" onClick={closeModal} aria-label="Close form">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="admin-cust-form">
              {/* Row 1: Full Name & Contact Phone */}
              <div className="admin-form-row-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Vaishali Jadhav"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                  {formErrors.fullName && <p className="admin-error-text">{formErrors.fullName}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="e.g. 9820123456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  {formErrors.phone && <p className="admin-error-text">{formErrors.phone}</p>}
                </div>
              </div>

              {/* Row 2: Address & Email */}
              <div className="admin-form-row-2">
                <div className="form-group">
                  <label className="form-label">Client Address / Area</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Flat 301, Sector 8, Kamothe"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. client@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 3: Service Availed & Quick Tags */}
              <div className="form-group">
                <label className="form-label">Service(s) Availed *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Hydra Glow Facial + Balayage Highlights"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                />
                {formErrors.service && <p className="admin-error-text">{formErrors.service}</p>}

                {/* Quick suggestions */}
                <div className="admin-quick-service-chips">
                  <span className="chips-hint">Quick add:</span>
                  {QUICK_SERVICE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="quick-chip"
                      onClick={() => {
                        const existing = formData.service.trim();
                        const next = existing ? `${existing}, ${tag}` : tag;
                        setFormData({ ...formData, service: next });
                      }}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Amount & Status */}
              <div className="admin-form-row-2">
                <div className="form-group">
                  <label className="form-label">Service Amount / Bill Total (₹)</label>
                  <div className="admin-amount-input-wrap">
                    <span className="admin-amount-currency-prefix">₹</span>
                    <input
                      type="text"
                      className="form-control admin-amount-input"
                      placeholder="e.g. 2,199 or 1,500"
                      value={formData.amount}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/^₹\s*/, '');
                        setFormData({ ...formData, amount: cleaned });
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={formData.status || 'Done'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Done">● Done (Completed)</option>
                    <option value="Pending">● Pending (In Progress / Booked)</option>
                    <option value="Cancel">● Cancel (Cancelled)</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Visit Date & Visit Time */}
              <div className="admin-form-row-2">
                <div className="form-group">
                  <label className="form-label">Visit Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.visitDate}
                    onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Visit Time / Slot</label>
                    <button
                      type="button"
                      onClick={() => setCustomTimeMode(!customTimeMode)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary)',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                      title={customTimeMode ? 'Switch to standard 30-min slots' : 'Type custom time format'}
                    >
                      {customTimeMode ? 'Pick from 30-min slots' : 'Type custom time'}
                    </button>
                  </div>

                  {customTimeMode ? (
                    <input
                      type="text"
                      list="azora-visit-time-slots"
                      className="form-control"
                      placeholder="e.g. 08:00 AM, 11:30 AM or 11:45 PM"
                      value={formData.visitTime}
                      onChange={(e) => setFormData({ ...formData, visitTime: e.target.value })}
                    />
                  ) : (
                    <select
                      className="form-control"
                      value={formData.visitTime || ''}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setCustomTimeMode(true);
                        } else {
                          setFormData({ ...formData, visitTime: e.target.value });
                        }
                      }}
                    >
                      <option value="">Select Visit Time Slot (08:00 AM – 12:00 AM)...</option>
                      {VISIT_TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                      {formData.visitTime && !VISIT_TIME_SLOTS.includes(formData.visitTime) && (
                        <option value={formData.visitTime}>
                          {formData.visitTime} (Current)
                        </option>
                      )}
                      <option value="__custom__">✏️ Type Custom Time...</option>
                    </select>
                  )}

                  <datalist id="azora-visit-time-slots">
                    {VISIT_TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Row 4.5: Reference Source */}
              <div className="form-group">
                <label className="form-label">How Did They Find Azora?</label>
                <select
                  className="form-control"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                >
                  {REFERENCE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Row 5: Rating & Customer Review / Feedback */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Customer Review / Feedback</label>
                  <div className="stars-selector">
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginRight: '0.5rem' }}>Rating:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="star-btn"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px' }}
                      >
                        <Star
                          size={18}
                          className={star <= formData.rating ? 'text-gold' : 'text-muted'}
                          fill={star <= formData.rating ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="What did the client say about their hair cut, facial, or salon experience?"
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                />
              </div>

              {/* Row 6: Stylist Remarks & Formula Notes */}
              <div className="form-group">
                <label className="form-label">Stylist Remarks &amp; Technical Notes</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Record client skin allergies, hair sensitivity, color shade/formula used, style preferences..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>

              {/* Row 7: Customer Makeover Photos Upload */}
              <div className="form-group">
                <label className="form-label">Customer Makeover &amp; Service Photos</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  style={{ display: 'none' }}
                  onChange={(e) => handleImageFiles(e.target.files)}
                />

                <div className="admin-photo-upload-container">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="admin-photo-preview-item">
                      <img src={img} alt={`Uploaded ${idx + 1}`} />
                      <button
                        type="button"
                        className="photo-remove-btn"
                        onClick={() => handleRemoveImage(idx)}
                        title="Remove photo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="admin-photo-add-box"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                  >
                    <UploadCloud size={20} className="text-gold" />
                    <span>{imageUploading ? 'Processing...' : '+ Upload Photos'}</span>
                  </button>
                </div>
                {imageError && <p className="admin-error-text">{imageError}</p>}
              </div>

              {/* Modal Actions */}
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline-gold" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Update Client Record' : 'Save Client Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Zoom for Makeover Photos */}
      {lightboxImage && (
        <div className="admin-lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <div className="admin-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="admin-lightbox-close"
              onClick={() => setLightboxImage(null)}
              aria-label="Close full view"
            >
              <X size={24} />
            </button>
            <img src={lightboxImage} alt="Makeover preview" className="admin-lightbox-img" />
          </div>
        </div>
      )}

      {/* Individual Customer Record Dossier View Modal */}
      {viewingCustomer && (() => {
        const rawDossierAmt = viewingCustomer.amount ? String(viewingCustomer.amount).replace(/^₹\s*/, '').trim() : '';
        const isRefNumeric = !rawDossierAmt && /^\d+([,.]\d+)?$/.test(String(viewingCustomer.reference || '').trim());
        const dossierAmount = rawDossierAmt || (isRefNumeric ? String(viewingCustomer.reference).trim() : '');

        return (
          <div className="modal-overlay" onClick={() => setViewingCustomer(null)}>
            <div
              className="modal-content admin-cust-dossier-modal glass-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="modal-close"
                onClick={() => setViewingCustomer(null)}
                aria-label="Close dossier"
              >
                <X size={20} />
              </button>

              {/* Dossier Header */}
              <div className="cust-dossier-header">
                <div className="cust-dossier-avatar-wrap">
                  {Array.isArray(viewingCustomer.images) && viewingCustomer.images.length > 0 ? (
                    <img
                      src={viewingCustomer.images[0]}
                      alt={viewingCustomer.fullName}
                      className="cust-dossier-avatar-img"
                      onClick={() => setLightboxImage(viewingCustomer.images[0])}
                      title="Click to view full photo"
                    />
                  ) : (
                    <div className="cust-dossier-avatar-placeholder">
                      {viewingCustomer.fullName.trim().split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase() || 'C'}
                    </div>
                  )}
                </div>

                <div className="cust-dossier-title-wrap">
                  <div className="cust-dossier-badge-row">
                    <span className="cust-dossier-id-badge">CLIENT #{viewingCustomer.id || 'REG'}</span>
                    <span className={`admin-status-badge-select admin-status--${String(viewingCustomer.status || 'Done').toLowerCase()}`}>
                      ● {viewingCustomer.status || 'Done'}
                    </span>
                    <span className="cust-dossier-verified-badge">● Registered Profile</span>
                  </div>
                  <h3 className="cust-dossier-name">{viewingCustomer.fullName}</h3>
                  <p className="cust-dossier-subtitle">
                    Primary Treatment: <strong className="text-gold">{viewingCustomer.service || 'General Salon Care'}</strong>
                    {dossierAmount && (
                      <span className="cust-dossier-amount-pill">
                        <IndianRupee size={12} /> {dossierAmount}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Dossier Body */}
              <div className="cust-dossier-body">
                {/* Contact Information Bar */}
                <div className="cust-dossier-contact-grid">
                  <div className="cust-dossier-info-card">
                    <span className="info-card-label"><Phone size={13} /> Phone Number</span>
                    <strong className="info-card-val">{viewingCustomer.phone || '—'}</strong>
                    {viewingCustomer.phone && (
                      <div className="info-card-actions">
                        <a
                          href={`https://wa.me/${String(viewingCustomer.phone || '').replace(/[^0-9]/g, '').length === 10 ? '91' + String(viewingCustomer.phone || '').replace(/[^0-9]/g, '') : String(viewingCustomer.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${viewingCustomer.fullName}, thank you for choosing Azora Salon & Spa!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cust-mini-btn cust-mini-btn--wa"
                        >
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                        <a
                          href={`tel:${viewingCustomer.phone}`}
                          className="cust-mini-btn cust-mini-btn--call"
                        >
                          <Phone size={12} /> Call
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="cust-dossier-info-card">
                    <span className="info-card-label"><MapPin size={13} /> Address &amp; Area</span>
                    <strong className="info-card-val">{viewingCustomer.address || 'Kamothe, Navi Mumbai'}</strong>
                    <span className="info-card-sub">Registered client location</span>
                  </div>

                  <div className="cust-dossier-info-card">
                    <span className="info-card-label"><Calendar size={13} /> Last Visit Date &amp; Time</span>
                    <strong className="info-card-val">
                      {viewingCustomer.visitDate || 'Recent'}
                      {viewingCustomer.visitTime || viewingCustomer.time ? ` at ${formatVisitTime(viewingCustomer.visitTime || viewingCustomer.time)}` : ''}
                    </strong>
                    <span className="info-card-sub">Source: {viewingCustomer.reference || 'Direct Client'}</span>
                  </div>

                  {viewingCustomer.email && (
                    <div className="cust-dossier-info-card">
                      <span className="info-card-label"><FileText size={13} /> Email Address</span>
                      <strong className="info-card-val">{viewingCustomer.email}</strong>
                      <a href={`mailto:${viewingCustomer.email}`} className="info-card-sub text-gold">
                        Send Email
                      </a>
                    </div>
                  )}
                </div>

                {/* Middle Row: Client Feedback Quote & Billed Amount Card (Side-by-side) */}
                <div className="cust-dossier-middle-grid">
                  {/* Left Column: Rating & Client Feedback Quote */}
                  <div className="cust-dossier-feedback-section">
                    <div className="dossier-stars-row">
                      <div className="stars-wrap">
                        {[...Array(Math.max(1, Math.min(5, Math.round(Number(viewingCustomer.rating) || 5))))].map((_, idx) => (
                          <Star key={idx} size={15} fill="currentColor" className="text-gold" />
                        ))}
                      </div>
                      <strong className="dossier-rating-val">{viewingCustomer.rating || 5}.0 Client Rating</strong>
                    </div>

                    {viewingCustomer.feedback ? (
                      <blockquote className="cust-dossier-quote">
                        "{viewingCustomer.feedback}"
                      </blockquote>
                    ) : (
                      <p className="cust-dossier-quote-missing">No client feedback note recorded for this visit.</p>
                    )}
                  </div>

                  {/* Right Column: Billed Amount Card */}
                  <div className="cust-dossier-amount-card">
                    <div className="dossier-amount-header">
                      <span className="info-card-label">
                        <IndianRupee size={14} className="text-gold" /> Total Billed Amount
                      </span>
                      <span className={`admin-status-badge-select admin-status--${String(viewingCustomer.status || 'Done').toLowerCase()}`}>
                        ● {viewingCustomer.status || 'Done'}
                      </span>
                    </div>
                    <div className="dossier-amount-display">
                      {dossierAmount ? (
                        <strong className="dossier-amount-val text-gold">₹{dossierAmount}</strong>
                      ) : (
                        <span className="dossier-amount-none">—</span>
                      )}
                    </div>
                    <span className="dossier-amount-hint">
                      {dossierAmount ? 'Total service bill recorded for this visit' : 'Bill total not recorded yet'}
                    </span>
                  </div>
                </div>

              {/* Stylist & Technical Remarks */}
              {viewingCustomer.remarks && (
                <div className="cust-dossier-remarks-section">
                  <h4 className="dossier-sec-title">
                    <FileText size={14} className="text-gold" /> Stylist &amp; Technical Remarks
                  </h4>
                  <div className="cust-dossier-remarks-box">
                    <p>{viewingCustomer.remarks}</p>
                  </div>
                </div>
              )}

              {/* Makeover Photos Gallery */}
              {Array.isArray(viewingCustomer.images) && viewingCustomer.images.length > 0 && (
                <div className="cust-dossier-photos-section">
                  <h4 className="dossier-sec-title">
                    <Camera size={14} className="text-gold" /> Customer &amp; Makeover Gallery ({viewingCustomer.images.length} photos)
                  </h4>
                  <div className="cust-dossier-photos-grid">
                    {viewingCustomer.images.map((imgSrc, imgIdx) => (
                      <div
                        key={imgIdx}
                        className="cust-dossier-photo-card"
                        onClick={() => setLightboxImage(imgSrc)}
                        title="Click to view full photo"
                      >
                        <img src={imgSrc} alt={`Client makeover ${imgIdx + 1}`} />
                        <div className="photo-zoom-badge"><Maximize2 size={12} /> Zoom</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dossier Footer Actions */}
            <div className="cust-dossier-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewingCustomer(null)}
              >
                Close Profile
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  const toDelete = viewingCustomer;
                  setViewingCustomer(null);
                  handleDeleteClick(toDelete);
                }}
                style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.35)' }}
              >
                <Trash2 size={15} /> Delete Profile
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const toEdit = viewingCustomer;
                  setViewingCustomer(null);
                  openEditModal(toEdit);
                }}
              >
                <Edit2 size={15} /> Edit Customer Details
              </button>
            </div>
          </div>
        </div>
      );
    })()}

      {/* Luxury Styled Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Customer Profile?"
        message={`Are you sure you want to permanently delete the profile for "${customerToDelete?.fullName}"?`}
        subtext="All recorded client contact info, availed services, makeover photos, and feedback will be removed permanently. This action cannot be undone."
        confirmText="Yes, Delete Profile"
        cancelText="Keep Profile"
        variant="danger"
        itemName={customerToDelete?.fullName}
        itemDetails={
          customerToDelete
            ? [
                { label: 'Services Availed', value: customerToDelete.service },
                customerToDelete.amount
                  ? { label: 'Billed Amount', value: `₹${String(customerToDelete.amount).replace(/^₹\s*/, '')}` }
                  : null,
                { label: 'Status', value: customerToDelete.status || 'Done' },
                { label: 'Contact Phone', value: customerToDelete.phone },
                { label: 'Address / Area', value: customerToDelete.address },
              ].filter((d) => d && d.value)
            : []
        }
      />
    </div>
  );
}
