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
} from 'lucide-react';
import {
  getCustomers,
  saveCustomer,
  deleteCustomer,
  compressCustomerImage,
  filterCustomers,
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

  // Form Data State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    service: '',
    reference: 'Instagram / Social Media',
    visitDate: new Date().toISOString().split('T')[0],
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

  // Filtered customer list
  const filteredList = useMemo(() => {
    return filterCustomers(customers, searchQuery, filterCategory);
  }, [customers, searchQuery, filterCategory]);

  // Statistics
  const stats = useMemo(() => {
    const total = customers.length;
    const withFeedback = customers.filter((c) => c.feedback && c.feedback.trim()).length;
    const fiveStars = customers.filter((c) => c.rating === 5).length;
    const totalPhotos = customers.reduce((acc, c) => acc + (Array.isArray(c.images) ? c.images.length : 0), 0);
    return { total, withFeedback, fiveStars, totalPhotos };
  }, [customers]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      address: '',
      service: '',
      reference: 'Instagram / Social Media',
      visitDate: new Date().toISOString().split('T')[0],
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
    setFormData({
      fullName: customer.fullName || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      service: customer.service || '',
      reference: customer.reference || 'Instagram / Social Media',
      visitDate: customer.visitDate || new Date().toISOString().split('T')[0],
      rating: customer.rating || 5,
      feedback: customer.feedback || '',
      remarks: customer.remarks || '',
      images: Array.isArray(customer.images) ? [...customer.images] : [],
    });
    setFormErrors({});
    setImageError('');
    setIsFormOpen(true);
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
      reference: formData.reference,
      visitDate: formData.visitDate,
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
      'Reference',
      'Visit Date',
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
      `"${(c.reference || '').replace(/"/g, '""')}"`,
      c.visitDate || '',
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
          <span className="stat-label">5-Star Praises</span>
          <strong className="stat-val">{stats.fiveStars}</strong>
          <span className="stat-sub">Top satisfied clients</span>
        </div>
        <div className="admin-customer-stat-card glass-panel">
          <span className="stat-label">Reviews Recorded</span>
          <strong className="stat-val">{stats.withFeedback}</strong>
          <span className="stat-sub">Quotes &amp; testimonies</span>
        </div>
        <div className="admin-customer-stat-card glass-panel">
          <span className="stat-label">Makeover Photos</span>
          <strong className="stat-val text-gold">{stats.totalPhotos}</strong>
          <span className="stat-sub">Saved client pictures</span>
        </div>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="admin-customers-toolbar glass-panel">
        <div className="admin-customers-search-wrap">
          <Search size={16} className="admin-customers-search-icon" aria-hidden="true" />
          <input
            type="search"
            className="form-control admin-customers-search-input"
            placeholder="Search by client name, phone, address, service, or remarks..."
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

        <div className="admin-customers-filter-pills">
          <button
            type="button"
            className={`admin-filter-pill ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            All Clients ({customers.length})
          </button>
          <button
            type="button"
            className={`admin-filter-pill ${filterCategory === '5star' ? 'active' : ''}`}
            onClick={() => setFilterCategory('5star')}
          >
            ⭐ 5-Star Reviews
          </button>
          <button
            type="button"
            className={`admin-filter-pill ${filterCategory === 'hasImages' ? 'active' : ''}`}
            onClick={() => setFilterCategory('hasImages')}
          >
            📸 With Photos
          </button>
          <button
            type="button"
            className={`admin-filter-pill ${filterCategory === 'hasFeedback' ? 'active' : ''}`}
            onClick={() => setFilterCategory('hasFeedback')}
          >
            💬 Has Feedback
          </button>
        </div>
      </div>

      {/* Customer Cards List */}
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
        <div className="admin-customers-grid">
          {filteredList.map((client) => {
            const cleanPhone = String(client.phone || '').replace(/[^0-9]/g, '');
            const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
            const waMsg = encodeURIComponent(`Hi ${client.fullName}, thank you for choosing Azora Salon & Spa! We hope you loved your ${client.service || 'service'}.`);

            return (
              <div
                key={client.id}
                className="admin-customer-card glass-panel admin-customer-card--clickable"
                onClick={() => setViewingCustomer(client)}
                title="Click to view full customer dossier"
              >
                {/* Card Top: Identity & Action Menu */}
                <div className="admin-cust-top">
                  <div className="admin-cust-identity">
                    <div className="admin-cust-avatar">
                      {client.fullName.trim().split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase() || 'C'}
                    </div>
                    <div>
                      <h3 className="admin-cust-name">{client.fullName}</h3>
                      <div className="admin-cust-contact-chips">
                        {client.phone && (
                          <span className="admin-cust-chip">
                            <Phone size={12} /> {String(client.phone)}
                          </span>
                        )}
                        {client.address && (
                          <span className="admin-cust-chip" title={client.address}>
                            <MapPin size={12} /> {client.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="admin-cust-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="admin-cust-btn admin-cust-btn--view"
                      onClick={() => setViewingCustomer(client)}
                      title="View Full Profile Dossier"
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      type="button"
                      className="admin-cust-btn admin-cust-btn--edit"
                      onClick={() => openEditModal(client)}
                      title="Edit Customer Details"
                    >
                      <Edit2 size={14} /> Edit
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
                </div>

                {/* Visit Badges */}
                <div className="admin-cust-meta-row">
                  <span className="admin-cust-badge admin-cust-badge--service">
                    <Sparkles size={13} /> {client.service || 'General Service'}
                  </span>
                  {client.reference && (
                    <span className="admin-cust-badge admin-cust-badge--ref">
                      <Tag size={13} /> Ref: {client.reference}
                    </span>
                  )}
                  {client.visitDate && (
                    <span className="admin-cust-badge admin-cust-badge--date">
                      <Calendar size={13} /> Visit: {client.visitDate}
                    </span>
                  )}
                </div>

                {/* Review & Feedback Section */}
                <div className="admin-cust-feedback-box">
                  <div className="admin-cust-stars-row">
                    <div className="stars-wrap">
                      {[...Array(Math.max(1, Math.min(5, Math.round(Number(client.rating) || 5))))].map((_, idx) => (
                        <Star key={idx} size={14} fill="currentColor" className="text-gold" />
                      ))}
                    </div>
                    <span className="rating-val">{client.rating || 5}.0 Client Rating</span>
                  </div>

                  {client.feedback ? (
                    <p className="admin-cust-quote">"{client.feedback}"</p>
                  ) : (
                    <p className="admin-cust-quote-missing">No feedback recorded yet</p>
                  )}
                </div>

                {/* Stylist Remarks & Technical Notes */}
                {client.remarks && (
                  <div className="admin-cust-remarks-box">
                    <div className="admin-cust-remarks-label">
                      <FileText size={13} /> Stylist &amp; Technical Remarks:
                    </div>
                    <p className="admin-cust-remarks-text">{client.remarks}</p>
                  </div>
                )}

                {/* Makeover Photos Strip */}
                {Array.isArray(client.images) && client.images.length > 0 && (
                  <div className="admin-cust-photos-wrap">
                    <div className="admin-cust-photos-label">
                      <Camera size={13} /> Customer &amp; Makeover Photos ({client.images.length})
                    </div>
                    <div className="admin-cust-photos-strip">
                      {client.images.map((imgSrc, imgIdx) => (
                        <div
                          key={imgIdx}
                          className="admin-cust-photo-thumb"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxImage(imgSrc);
                          }}
                          title="Click to enlarge"
                        >
                          <img src={imgSrc} alt={`Makeover ${imgIdx + 1}`} />
                          <div className="photo-zoom-hint"><Maximize2 size={12} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card Footer: Fast Messaging */}
                <div className="admin-cust-card-footer" onClick={(e) => e.stopPropagation()}>
                  {client.phone && (
                    <>
                      <a
                        href={`https://wa.me/${waPhone}?text=${waMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary admin-cust-wa-btn"
                      >
                        <MessageCircle size={15} /> WhatsApp Client
                      </a>
                      <a
                        href={`tel:${client.phone}`}
                        className="btn btn-outline-gold admin-cust-call-btn"
                      >
                        <Phone size={14} /> Call
                      </a>
                    </>
                  )}
                </div>
              </div>
            );
          })}
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

              {/* Row 4: Reference Source & Visit Date */}
              <div className="admin-form-row-2">
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

                <div className="form-group">
                  <label className="form-label">Visit Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.visitDate}
                    onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  />
                </div>
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
      {viewingCustomer && (
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
                  <span className="cust-dossier-verified-badge">● Registered Profile</span>
                </div>
                <h3 className="cust-dossier-name">{viewingCustomer.fullName}</h3>
                <p className="cust-dossier-subtitle">
                  Primary Treatment: <strong className="text-gold">{viewingCustomer.service || 'General Salon Care'}</strong>
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
                  <span className="info-card-label"><Calendar size={13} /> Last Visit Date</span>
                  <strong className="info-card-val">{viewingCustomer.visitDate || 'Recent'}</strong>
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

              {/* Rating & Client Feedback Quote */}
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
      )}

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
                { label: 'Contact Phone', value: customerToDelete.phone },
                { label: 'Address / Area', value: customerToDelete.address },
              ].filter((d) => d.value)
            : []
        }
      />
    </div>
  );
}
