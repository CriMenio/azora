import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  UploadCloud,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Save,
  RotateCcw,
  Calendar,
  Tag,
  X,
  Loader,
  Image as ImageIcon,
  AlertCircle,
  Search,
  Eye,
  Layers,
  ArrowRight,
  Check,
  Percent,
} from 'lucide-react';
import {
  getOfferConfig,
  saveOfferConfig,
  resetOfferConfig,
  saveOfferToSpreadsheet,
  fetchOfferFromSpreadsheet,
  DEFAULT_OFFER_CONFIG,
  resolveOfferBannerImage,
} from '../services/offerService';
import { uploadGalleryImage } from '../services/galleryService';
import ConfirmModal from './ConfirmModal';

const CATEGORY_OPTIONS = ['Beauty', 'Hair', 'Nails', 'Grooming'];

export default function AdminOffers({ adminPin }) {
  const [config, setConfig] = useState(getOfferConfig);
  const [activeTab, setActiveTab] = useState('packages'); // 'packages' (records list) | 'poster'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Record Modals
  const [viewingCombo, setViewingCombo] = useState(null); // Individual Package Record Modal
  const [editingCombo, setEditingCombo] = useState(null);
  const [isAddComboOpen, setIsAddComboOpen] = useState(false);
  const [comboFormData, setComboFormData] = useState({
    id: '',
    name: '',
    price: '',
    numericPrice: '',
    category: 'Beauty',
    desc: '',
  });
  const [comboToDelete, setComboToDelete] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Image Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef(null);

  // Tag Input State
  const [newTagInput, setNewTagInput] = useState('');

  // Save feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingToSheet, setSavingToSheet] = useState(false);

  useEffect(() => {
    fetchOfferFromSpreadsheet();
    const handleOfferUpdated = (e) => {
      if (e.detail) setConfig(e.detail);
    };
    window.addEventListener('azora-offer-updated', handleOfferUpdated);
    return () => window.removeEventListener('azora-offer-updated', handleOfferUpdated);
  }, []);

  const handleFieldChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
    setSaveError('');
    setHasUnsavedChanges(true);
  };

  const handleAddTag = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const tag = newTagInput.trim();
    if (!tag) return;
    if (!config.tags.includes(tag)) {
      setConfig((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setSaveSuccess(false);
      setHasUnsavedChanges(true);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (indexToRemove) => {
    setConfig((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, idx) => idx !== indexToRemove),
    }));
    setSaveSuccess(false);
    setHasUnsavedChanges(true);
  };

  // Image upload handler
  const handleBannerFile = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    setUploadStatus(null);
    setUploadMessage('Uploading banner to Google Drive…');

    try {
      const result = await uploadGalleryImage({
        file,
        title: config.title || 'Offer Banner Template',
        desc: config.desc || 'Special Offer Template',
        type: 'hair',
        adminPin,
      });

      if (result.success && result.url) {
        setConfig((prev) => ({ ...prev, image: result.url }));
        setUploadStatus('success');
        setUploadMessage('Offer banner uploaded successfully!');
        setSaveSuccess(false);
        setHasUnsavedChanges(true);
      } else {
        setUploadStatus('error');
        setUploadMessage(result.error || 'Failed to upload image. Please try again.');
      }
    } catch (err) {
      console.error('Banner upload error:', err);
      setUploadStatus('error');
      setUploadMessage(err.message || 'Error connecting to Drive. Check your connection.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Combos CRUD
  const openAddCombo = () => {
    setEditingCombo(null);
    setComboFormData({
      id: '',
      name: '',
      price: '',
      numericPrice: '',
      category: 'Beauty',
      desc: '',
    });
    setIsAddComboOpen(true);
  };

  const openEditCombo = (combo) => {
    setEditingCombo(combo);
    setComboFormData({
      id: combo.id,
      name: combo.name || '',
      price: combo.price || '',
      numericPrice: combo.numericPrice || '',
      category: combo.category || 'Beauty',
      desc: combo.desc || '',
    });
    setIsAddComboOpen(true);
  };

  const closeComboModal = () => {
    setIsAddComboOpen(false);
    setEditingCombo(null);
  };

  const handleSaveCombo = (e) => {
    e.preventDefault();
    if (!comboFormData.name.trim() || !comboFormData.price.trim()) return;

    const numericVal =
      parseInt(comboFormData.numericPrice, 10) ||
      parseInt((comboFormData.price || '').replace(/[^0-9]/g, ''), 10) ||
      999;

    if (editingCombo) {
      // Edit existing
      setConfig((prev) => ({
        ...prev,
        combos: prev.combos.map((c) =>
          c.id === editingCombo.id
            ? {
                ...c,
                name: comboFormData.name.trim(),
                price: comboFormData.price.trim(),
                numericPrice: numericVal,
                category: comboFormData.category,
                desc: comboFormData.desc.trim(),
              }
            : c
        ),
      }));

      // Update viewing combo if open
      if (viewingCombo?.id === editingCombo.id) {
        setViewingCombo({
          ...viewingCombo,
          name: comboFormData.name.trim(),
          price: comboFormData.price.trim(),
          numericPrice: numericVal,
          category: comboFormData.category,
          desc: comboFormData.desc.trim(),
        });
      }
    } else {
      // Add new
      const newCombo = {
        id: `combo-${Date.now()}`,
        name: comboFormData.name.trim(),
        price: comboFormData.price.trim(),
        numericPrice: numericVal,
        category: comboFormData.category,
        desc: comboFormData.desc.trim(),
      };
      setConfig((prev) => ({
        ...prev,
        combos: [...prev.combos, newCombo],
      }));
    }

    setHasUnsavedChanges(true);
    closeComboModal();
  };

  const handleDeleteComboClick = (combo) => {
    setComboToDelete(combo);
  };

  const handleConfirmDeleteCombo = () => {
    if (!comboToDelete) return;
    setConfig((prev) => ({
      ...prev,
      combos: prev.combos.filter((c) => c.id !== comboToDelete.id),
    }));
    if (viewingCombo?.id === comboToDelete.id) {
      setViewingCombo(null);
    }
    setComboToDelete(null);
    setHasUnsavedChanges(true);
  };

  // Save All Changes (LocalStorage + Google Sheets)
  const handleSaveAll = async () => {
    setSavingToSheet(true);
    setSaveSuccess(false);
    setSaveError('');

    saveOfferConfig(config);

    try {
      const sheetResult = await saveOfferToSpreadsheet(config, adminPin);
      if (sheetResult.success) {
        setSaveSuccess(true);
        setHasUnsavedChanges(false);
      } else {
        setSaveError(
          sheetResult.error ||
            'Offer saved locally, but Google Sheet sync failed. Ensure Code.gs is deployed with action=saveOffer.'
        );
      }
    } catch (err) {
      console.error('Failed to sync offer with sheet:', err);
      setSaveError('Offer saved locally. Sheet sync error: ' + (err.message || 'Unknown network error.'));
    } finally {
      setSavingToSheet(false);
      setTimeout(() => setSaveSuccess(false), 5000);
    }
  };

  // Reset to defaults
  const handleResetClick = () => {
    setIsResetConfirmOpen(true);
  };

  const handleConfirmReset = async () => {
    setIsResetConfirmOpen(false);
    resetOfferConfig();
    setConfig(DEFAULT_OFFER_CONFIG);
    await saveOfferToSpreadsheet(DEFAULT_OFFER_CONFIG, adminPin);
    setSaveSuccess(true);
    setHasUnsavedChanges(false);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  // Filter combos by search query and category
  const filteredCombos = useMemo(() => {
    let result = config.combos || [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.desc || '').toLowerCase().includes(q) ||
          (c.price || '').toLowerCase().includes(q) ||
          (c.category || '').toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter((c) => (c.category || 'Beauty') === categoryFilter);
    }

    return result;
  }, [config.combos, searchQuery, categoryFilter]);

  return (
    <div className="admin-offers-page">
      {/* Page Header Bar */}
      <div className="admin-offers-topbar glass-panel">
        <div className="admin-offers-title-group">
          <div className="admin-offers-icon-wrap">
            <Sparkles size={22} className="text-gold" />
          </div>
          <div>
            <div className="admin-offers-heading-row">
              <h2 className="admin-offers-heading">Offers &amp; Packages Manager</h2>
              <span className={`admin-offers-live-badge ${config.isActive ? 'live' : 'hidden'}`}>
                {config.isActive ? '● Active on Site' : '○ Hidden from Site'}
              </span>
            </div>
            <p className="admin-offers-subheading">
              Browse package records, open individual package details, configure seasonal flyers, and sync bookable combos with Google Sheets.
            </p>
          </div>
        </div>

        <div className="admin-offers-topbar-actions">
          {/* Active on Site Toggle Switch */}
          <label className="admin-offers-toggle" title="Toggle offer section visibility on the website">
            <input
              type="checkbox"
              checked={config.isActive}
              onChange={(e) => handleFieldChange('isActive', e.target.checked)}
            />
            <span className="admin-offers-toggle-slider" />
            <span className="admin-offers-toggle-label">
              {config.isActive ? 'Site Visible' : 'Site Hidden'}
            </span>
          </label>

          <button
            type="button"
            className="btn btn-secondary admin-offers-reset-btn"
            onClick={handleResetClick}
            disabled={savingToSheet}
            title="Reset to factory defaults"
          >
            <RotateCcw size={15} /> Reset
          </button>

          <button
            type="button"
            className={`btn btn-primary admin-offers-save-btn ${hasUnsavedChanges ? 'highlight-save' : ''}`}
            onClick={handleSaveAll}
            disabled={savingToSheet}
          >
            {savingToSheet ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
            {savingToSheet ? 'Saving to Sheet...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Segmented Tab Navigation: Packages Records List vs. Poster & Flyer Settings */}
      <div className="admin-offers-nav-tabs glass-panel">
        <button
          type="button"
          className={`admin-offers-nav-tab ${activeTab === 'packages' ? 'active' : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          <Layers size={16} />
          <span>Package &amp; Combo Records</span>
          <span className="admin-tab-count-pill">{config.combos.length}</span>
        </button>

        <button
          type="button"
          className={`admin-offers-nav-tab ${activeTab === 'poster' ? 'active' : ''}`}
          onClick={() => setActiveTab('poster')}
        >
          <ImageIcon size={16} />
          <span>Festival Poster &amp; Flyer Settings</span>
          {config.tags.length > 0 && (
            <span className="admin-tab-count-pill" style={{ opacity: 0.8 }}>
              {config.tags.length} Tags
            </span>
          )}
        </button>
      </div>

      {saveSuccess && (
        <div className="admin-offers-alert admin-offers-alert--success">
          <CheckCircle size={18} />
          <span>All offer changes and packages saved to Google Sheet ("Offers" tab) &amp; Live Website!</span>
        </div>
      )}

      {saveError && (
        <div
          className="admin-offers-alert"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1, fontSize: '0.9rem', lineHeight: 1.45 }}>
            <strong style={{ color: '#f87171' }}>Sheet Sync Notice: </strong>
            {saveError}
          </div>
          <button
            type="button"
            onClick={() => setSaveError('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
            }}
            title="Dismiss notice"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: PACKAGES & COMBOS RECORDS LIST (DEFAULT VIEW)           */}
      {/* ============================================================== */}
      {activeTab === 'packages' && (
        <div className="admin-offers-records-section">
          {/* Top Quick Stats */}
          <div className="admin-offers-stats-row">
            <div className="admin-mini-stat-card glass-panel">
              <span className="mini-stat-label">Total Combos Available</span>
              <strong className="mini-stat-val text-gold">{config.combos.length}</strong>
              <span className="mini-stat-sub">1-Click bookable on site</span>
            </div>
            <div className="admin-mini-stat-card glass-panel">
              <span className="mini-stat-label">Active Promotion</span>
              <strong className="mini-stat-val" style={{ fontSize: '1.05rem', color: '#f59e0b' }}>
                {config.badge || 'Festive Offer'}
              </strong>
              <span className="mini-stat-sub">{config.dateRange || 'Limited Period'}</span>
            </div>
            <div className="admin-mini-stat-card glass-panel">
              <span className="mini-stat-label">Online Status</span>
              <strong
                className="mini-stat-val"
                style={{ color: config.isActive ? '#22c55e' : '#94a3b8' }}
              >
                {config.isActive ? 'Live on Website' : 'Hidden from Guests'}
              </strong>
              <span className="mini-stat-sub">
                {config.isActive ? 'Visitors can view & book' : 'Draft mode'}
              </span>
            </div>
          </div>

          {/* Search, Filter Toolbar & "+ Add Package" Button */}
          <div className="admin-offers-toolbar glass-panel">
            <div className="admin-offers-search-wrap">
              <Search size={16} className="admin-offers-search-icon" aria-hidden="true" />
              <input
                type="search"
                className="form-control admin-offers-search-input"
                placeholder="Search combo packages by name, treatments, category, or price..."
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

            <div className="admin-offers-category-pills">
              <button
                type="button"
                className={`admin-filter-pill ${categoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('all')}
              >
                All Packages ({config.combos.length})
              </button>
              {CATEGORY_OPTIONS.map((cat) => {
                const count = config.combos.filter((c) => (c.category || 'Beauty') === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`admin-filter-pill ${categoryFilter === cat ? 'active' : ''}`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="btn btn-primary admin-add-package-btn"
              onClick={openAddCombo}
            >
              <Plus size={16} /> <span>Add New Package</span>
            </button>
          </div>

          {/* Packages Records Grid */}
          {filteredCombos.length === 0 ? (
            <div className="admin-empty-combos glass-panel">
              <Sparkles size={36} className="text-gold" style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
              <h3>No Package Records Found</h3>
              <p>
                {searchQuery
                  ? `No combo packages match "${searchQuery}".`
                  : 'No packages created in this category yet.'}
              </p>
              <button
                type="button"
                className="btn btn-outline-gold"
                onClick={openAddCombo}
                style={{ marginTop: '1rem' }}
              >
                <Plus size={15} /> Create First Package
              </button>
            </div>
          ) : (
            <div className="admin-packages-records-grid">
              {filteredCombos.map((combo) => (
                <div
                  key={combo.id}
                  className="admin-package-record-card glass-panel"
                  onClick={() => setViewingCombo(combo)}
                  title="Click to open individual package record"
                >
                  <div className="pkg-card-top">
                    <span className="pkg-card-cat-badge">{combo.category || 'Beauty'}</span>
                    <span className="pkg-card-price-badge">{combo.price}</span>
                  </div>

                  <h3 className="pkg-card-title">{combo.name}</h3>

                  {combo.desc && (
                    <p className="pkg-card-desc">{combo.desc}</p>
                  )}

                  <div className="pkg-card-hover-hint">
                    <span>Click to view record</span>
                    <ArrowRight size={13} />
                  </div>

                  <div className="pkg-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="pkg-act-btn pkg-act-btn--view"
                      onClick={() => setViewingCombo(combo)}
                      title="View complete record"
                    >
                      <Eye size={14} /> <span>View</span>
                    </button>
                    <button
                      type="button"
                      className="pkg-act-btn pkg-act-btn--edit"
                      onClick={() => openEditCombo(combo)}
                      title="Edit package details"
                    >
                      <Edit2 size={14} /> <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="pkg-act-btn pkg-act-btn--delete"
                      onClick={() => handleDeleteComboClick(combo)}
                      title="Remove package"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: FESTIVAL POSTER & FLYER SETTINGS                        */}
      {/* ============================================================== */}
      {activeTab === 'poster' && (
        <div className="admin-offers-grid">
          {/* Left Column: Template Banner Poster */}
          <div className="admin-offers-col">
            <div className="admin-offers-card glass-panel">
              <div className="admin-card-header-clean">
                <h3 className="admin-offers-card-title">
                  <ImageIcon size={18} className="text-gold" /> Offer Template Poster
                </h3>
                <span className="admin-card-subtitle">Display banner flyer for the offer section</span>
              </div>

              <div className="admin-offers-banner-preview-box">
                <img
                  src={resolveOfferBannerImage(config.image)}
                  alt={config.title}
                  className="admin-offers-banner-preview-img"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_OFFER_CONFIG.image;
                  }}
                />
                {uploadingImage && (
                  <div className="admin-banner-upload-overlay">
                    <Loader size={32} className="animate-spin text-gold" />
                    <span>{uploadMessage}</span>
                  </div>
                )}
              </div>

              {uploadStatus && (
                <div
                  className={`admin-upload-toast ${uploadStatus === 'success' ? 'success' : 'error'}`}
                >
                  {uploadStatus === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{uploadMessage}</span>
                </div>
              )}

              <div className="admin-offers-upload-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleBannerFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="btn btn-outline-gold admin-upload-banner-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  <UploadCloud size={16} />
                  <span>{uploadingImage ? 'Uploading to Drive...' : 'Upload New Banner Poster'}</span>
                </button>

                <div className="admin-offers-image-url-field">
                  <label className="form-label">Or Direct Image / Drive URL:</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://drive.google.com/uc?id=... or /assets/..."
                    value={config.image}
                    onChange={(e) => handleFieldChange('image', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Promotional Copy & Highlight Tags */}
          <div className="admin-offers-col">
            <div className="admin-offers-card glass-panel">
              <div className="admin-card-header-clean">
                <h3 className="admin-offers-card-title">
                  <Tag size={18} className="text-gold" /> Promotional Copy &amp; Highlight Tags
                </h3>
                <span className="admin-card-subtitle">Headings, dates &amp; free service perks</span>
              </div>

              <div className="form-group">
                <label className="form-label">Festival Title / Heading *</label>
                <input
                  className="form-control"
                  value={config.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="e.g. Navratri &amp; Diwali Grand Makeover Special"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Promotional Badge Tag</label>
                <input
                  className="form-control"
                  value={config.badge}
                  onChange={(e) => handleFieldChange('badge', e.target.value)}
                  placeholder="e.g. FESTIVE CELEBRATION DEALS"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date Range / Validity</label>
                <div className="admin-input-with-icon">
                  <Calendar size={16} className="input-icon" />
                  <input
                    className="form-control"
                    value={config.dateRange}
                    onChange={(e) => handleFieldChange('dateRange', e.target.value)}
                    placeholder="e.g. 15 Oct – 15 Nov"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Promotional Subtitle &amp; Description</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={config.desc}
                  onChange={(e) => handleFieldChange('desc', e.target.value)}
                  placeholder="Celebrate the festive glow with Kamothe's premier luxury salon."
                />
              </div>

              {/* Tag Chips List */}
              <label className="form-label" style={{ marginTop: '0.5rem' }}>
                Perks &amp; FREE Highlight Tags
              </label>
              <div className="admin-tags-chips-container">
                {config.tags.map((tag, idx) => (
                  <span key={idx} className="admin-tag-pill">
                    <span className="admin-tag-pill-text">{tag}</span>
                    <button
                      type="button"
                      className="admin-tag-pill-remove"
                      onClick={() => handleRemoveTag(idx)}
                      title={`Remove "${tag}"`}
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
                {config.tags.length === 0 && (
                  <span className="admin-no-tags-text">No tags added. Add one below.</span>
                )}
              </div>

              {/* Integrated Inline Tag Add Input Group */}
              <div className="admin-tag-input-group">
                <input
                  type="text"
                  className="form-control admin-tag-input"
                  placeholder="Type a tag &amp; press Enter (e.g. On Any Facial — D-Tan FREE)"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(e);
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline-gold admin-tag-add-btn"
                  onClick={handleAddTag}
                  disabled={!newTagInput.trim()}
                >
                  <Plus size={15} /> Add Tag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* INDIVIDUAL PACKAGE RECORD VIEW MODAL                           */}
      {/* ============================================================== */}
      {viewingCombo && (
        <div className="modal-overlay" onClick={() => setViewingCombo(null)}>
          <div
            className="modal-content admin-package-record-modal glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setViewingCombo(null)}
              aria-label="Close record"
            >
              <X size={20} />
            </button>

            <div className="admin-modal-title-bar">
              <div className="pkg-modal-badge-row">
                <span className="pkg-card-cat-badge">{viewingCombo.category || 'Beauty'}</span>
                <span className="pkg-card-price-badge">{viewingCombo.price}</span>
              </div>
              <h3 className="admin-modal-title" style={{ marginTop: '0.5rem' }}>
                {viewingCombo.name}
              </h3>
              <p className="admin-modal-subtitle">
                Individual Package Record &amp; Booking Configuration
              </p>
            </div>

            <div className="admin-modal-body pkg-dossier-body">
              <div className="pkg-dossier-section">
                <h4 className="dossier-label">Included Treatments &amp; Services:</h4>
                <div className="pkg-dossier-desc-box">
                  <p>{viewingCombo.desc || 'No specific treatment list provided.'}</p>
                </div>
              </div>

              <div className="pkg-dossier-meta-grid">
                <div className="pkg-dossier-meta-item">
                  <span className="meta-item-label">Package Category</span>
                  <strong className="meta-item-val">{viewingCombo.category || 'Beauty'}</strong>
                </div>
                <div className="pkg-dossier-meta-item">
                  <span className="meta-item-label">Display Price</span>
                  <strong className="meta-item-val text-gold">{viewingCombo.price}</strong>
                </div>
                <div className="pkg-dossier-meta-item">
                  <span className="meta-item-label">Online Booking</span>
                  <strong className="meta-item-val" style={{ color: '#22c55e' }}>
                    <Check size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    1-Click Auto Select Active
                  </strong>
                </div>
                <div className="pkg-dossier-meta-item">
                  <span className="meta-item-label">Sync Status</span>
                  <strong className="meta-item-val">Synced to Google Sheet</strong>
                </div>
              </div>

              <div className="admin-modal-actions" style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setViewingCombo(null)}
                >
                  Close Record
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const toDelete = viewingCombo;
                    setViewingCombo(null);
                    handleDeleteComboClick(toDelete);
                  }}
                  style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.35)' }}
                >
                  <Trash2 size={15} /> Delete Package
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const toEdit = viewingCombo;
                    setViewingCombo(null);
                    openEditCombo(toEdit);
                  }}
                >
                  <Edit2 size={15} /> Edit Package Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Combo Dialog Modal */}
      {isAddComboOpen && (
        <div className="modal-overlay" onClick={closeComboModal}>
          <div
            className="modal-content admin-combo-dialog-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={closeComboModal} aria-label="Close dialog">
              <X size={20} />
            </button>

            <div className="admin-modal-title-bar">
              <h3 className="admin-modal-title">
                {editingCombo ? 'Edit Combo Package' : 'Add New Combo Package'}
              </h3>
              <p className="admin-modal-subtitle">
                This package will appear in the festive offer section and can be booked in 1-click.
              </p>
            </div>

            <form onSubmit={handleSaveCombo} className="admin-modal-body">
              <div className="form-group">
                <label className="form-label">Package Name *</label>
                <input
                  className="form-control"
                  required
                  value={comboFormData.name}
                  onChange={(e) => setComboFormData({ ...comboFormData, name: e.target.value })}
                  placeholder="e.g. Garba Glow Combo"
                />
              </div>

              <div className="admin-form-row-2">
                <div className="form-group">
                  <label className="form-label">Display Price *</label>
                  <input
                    className="form-control"
                    required
                    value={comboFormData.price}
                    onChange={(e) => setComboFormData({ ...comboFormData, price: e.target.value })}
                    placeholder="e.g. ₹699 or From ₹499"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-control"
                    value={comboFormData.category}
                    onChange={(e) => setComboFormData({ ...comboFormData, category: e.target.value })}
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Included Treatments &amp; Description *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  required
                  value={comboFormData.desc}
                  onChange={(e) => setComboFormData({ ...comboFormData, desc: e.target.value })}
                  placeholder="e.g. Cleanup + Full Hand Wax + Eyebrows + Upper Lip + Forehead"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeComboModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={15} /> {editingCombo ? 'Update Package' : 'Add Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Combo Confirm Modal */}
      <ConfirmModal
        isOpen={!!comboToDelete}
        onClose={() => setComboToDelete(null)}
        onConfirm={handleConfirmDeleteCombo}
        title="Remove Combo Package?"
        message={`Are you sure you want to remove the "${comboToDelete?.name}" package?`}
        subtext="This package combo will no longer be visible or bookable on the client-facing website."
        confirmText="Yes, Remove Package"
        cancelText="Keep Package"
        variant="danger"
        itemName={comboToDelete?.name}
        itemDetails={
          comboToDelete
            ? [
                { label: 'Category', value: comboToDelete.category },
                { label: 'Price', value: comboToDelete.price },
                { label: 'Included Services', value: comboToDelete.desc },
              ].filter((d) => d.value)
            : []
        }
      />

      {/* Reset Offer Settings Confirm Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Offer Configuration?"
        message="Are you sure you want to reset all offer settings, titles, banners, and combo packages to factory defaults?"
        subtext="Any custom flyers, adjusted prices, and new packages will be reverted to the original Navratri setup."
        confirmText="Yes, Reset Configuration"
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  );
}
