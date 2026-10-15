import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import {
  getOfferConfig,
  saveOfferConfig,
  resetOfferConfig,
  DEFAULT_OFFER_CONFIG,
} from '../services/offerService';
import { uploadGalleryImage } from '../services/galleryService';

const CATEGORY_OPTIONS = ['Beauty', 'Hair', 'Nails', 'Grooming'];

export default function AdminOffers({ adminPin }) {
  const [config, setConfig] = useState(getOfferConfig);
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

  // Image Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef(null);

  // Tag Input State
  const [newTagInput, setNewTagInput] = useState('');

  // Save feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const handleOfferUpdated = (e) => {
      if (e.detail) setConfig(e.detail);
    };
    window.addEventListener('azora-offer-updated', handleOfferUpdated);
    return () => window.removeEventListener('azora-offer-updated', handleOfferUpdated);
  }, []);

  const handleFieldChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
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
        const reader = new FileReader();
        reader.onload = (e) => {
          setConfig((prev) => ({ ...prev, image: e.target.result }));
          setHasUnsavedChanges(true);
        };
        reader.readAsDataURL(file);
        setUploadStatus('success');
        setUploadMessage('Banner image updated locally!');
        setSaveSuccess(false);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        setConfig((prev) => ({ ...prev, image: e.target.result }));
        setHasUnsavedChanges(true);
      };
      reader.readAsDataURL(file);
      setUploadStatus('success');
      setUploadMessage('Banner image updated locally!');
    } finally {
      setUploadingImage(false);
      setTimeout(() => setUploadStatus(null), 3500);
    }
  };

  // Combo Management
  const openAddCombo = () => {
    setComboFormData({
      id: `offer-${Date.now()}`,
      name: '',
      price: '₹',
      numericPrice: '',
      category: 'Beauty',
      desc: '',
    });
    setEditingCombo(null);
    setIsAddComboOpen(true);
  };

  const openEditCombo = (combo) => {
    setComboFormData({
      id: combo.id,
      name: combo.name || '',
      price: combo.price || '',
      numericPrice: combo.numericPrice || '',
      category: combo.category || 'Beauty',
      desc: combo.desc || '',
    });
    setEditingCombo(combo);
    setIsAddComboOpen(true);
  };

  const closeComboModal = () => {
    setIsAddComboOpen(false);
    setEditingCombo(null);
  };

  const handleSaveCombo = (e) => {
    e.preventDefault();
    if (!comboFormData.name.trim() || !comboFormData.price.trim()) return;

    const numeric = parseInt(String(comboFormData.numericPrice || comboFormData.price).replace(/[^0-9]/g, ''), 10) || 0;

    const updatedCombo = {
      id: comboFormData.id || `offer-${Date.now()}`,
      name: comboFormData.name.trim(),
      price: comboFormData.price.trim(),
      numericPrice: numeric,
      category: comboFormData.category,
      desc: comboFormData.desc.trim(),
    };

    setConfig((prev) => {
      const existingIdx = prev.combos.findIndex((c) => c.id === updatedCombo.id);
      let newCombos;
      if (existingIdx >= 0) {
        newCombos = [...prev.combos];
        newCombos[existingIdx] = updatedCombo;
      } else {
        newCombos = [...prev.combos, updatedCombo];
      }
      return { ...prev, combos: newCombos };
    });

    closeComboModal();
    setSaveSuccess(false);
    setHasUnsavedChanges(true);
  };

  const handleDeleteCombo = (comboId) => {
    if (window.confirm('Are you sure you want to remove this combo package?')) {
      setConfig((prev) => ({
        ...prev,
        combos: prev.combos.filter((c) => c.id !== comboId),
      }));
      setSaveSuccess(false);
      setHasUnsavedChanges(true);
    }
  };

  // Save all config changes
  const handleSaveAll = () => {
    const res = saveOfferConfig(config);
    if (res.success) {
      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  // Reset to default
  const handleReset = () => {
    if (window.confirm('Reset offer settings to default Navratri configuration?')) {
      resetOfferConfig();
      setConfig(DEFAULT_OFFER_CONFIG);
      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

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
              Upload seasonal banner flyers, edit offer copy and highlight tags, and manage customer-bookable combo packages.
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
            onClick={handleReset}
            title="Reset to factory defaults"
          >
            <RotateCcw size={15} /> Reset
          </button>

          <button
            type="button"
            className={`btn btn-primary admin-offers-save-btn ${hasUnsavedChanges ? 'highlight-save' : ''}`}
            onClick={handleSaveAll}
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="admin-offers-alert admin-offers-alert--success">
          <CheckCircle size={18} />
          <span>All offer changes saved successfully! Updates are live on Home and Services screens.</span>
        </div>
      )}

      {/* Main 2-Column Form Grid */}
      <div className="admin-offers-grid">
        {/* Left Column: Template Banner & Content */}
        <div className="admin-offers-col">
          {/* Card: Template Banner Flyer */}
          <div className="admin-offers-card glass-panel">
            <div className="admin-card-header-clean">
              <h3 className="admin-offers-card-title">
                <ImageIcon size={18} className="text-gold" /> Offer Template Poster
              </h3>
              <span className="admin-card-subtitle">Display banner flyer for the offer section</span>
            </div>

            <div className="admin-offers-banner-preview-box">
              <img
                src={config.image}
                alt={config.title}
                className="admin-offers-banner-preview-img"
                referrerPolicy="no-referrer"
              />
              <span className="admin-banner-preview-overlay-tag">Active Template</span>
            </div>

            <div className="admin-offers-upload-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                style={{ display: 'none' }}
                onChange={(e) => handleBannerFile(e.target.files?.[0])}
              />
              <button
                type="button"
                className="btn btn-primary admin-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <><Loader size={15} className="ag-spin" /> Uploading...</>
                ) : (
                  <><UploadCloud size={16} /> Upload New Poster</>
                )}
              </button>

              <div className="admin-offers-url-input-wrap">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Or paste direct image / Google Drive URL"
                  value={config.image?.startsWith('data:') ? '' : config.image}
                  onChange={(e) => handleFieldChange('image', e.target.value)}
                />
              </div>
            </div>

            {uploadStatus && (
              <p className="ag-upload-status ag-upload-status--success" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                <CheckCircle size={15} /> {uploadMessage}
              </p>
            )}
          </div>

          {/* Card: Header, Description, Date & Tags */}
          <div className="admin-offers-card glass-panel">
            <div className="admin-card-header-clean">
              <h3 className="admin-offers-card-title">
                <Tag size={18} className="text-gold" /> Header, Description &amp; Tags
              </h3>
              <span className="admin-card-subtitle">Titles, festival validity dates, and promotional perk tags</span>
            </div>

            {/* Badge & Title in a 2-Column Row */}
            <div className="admin-form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Super-Title / Badge</label>
                <input
                  className="form-control"
                  value={config.badge}
                  onChange={(e) => handleFieldChange('badge', e.target.value)}
                  placeholder="e.g. Festive Celebration Deals"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Offer Title / Heading *</label>
                <input
                  className="form-control"
                  value={config.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="e.g. Navratri Special Offers"
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description *</label>
              <textarea
                className="form-control"
                rows={3}
                value={config.desc}
                onChange={(e) => handleFieldChange('desc', e.target.value)}
                placeholder="Description shown beneath the title..."
                style={{ minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            {/* Validity / Date Range */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <Calendar size={14} className="text-gold" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Offer Validity / Date Range
              </label>
              <input
                className="form-control"
                value={config.dateRange}
                onChange={(e) => handleFieldChange('dateRange', e.target.value)}
                placeholder="e.g. 7th Oct – 25th Oct"
              />
            </div>

            {/* Promotional Tags & Perks (Red Box Redesign) */}
            <div className="admin-tags-section">
              <div className="admin-field-header">
                <label className="form-label" style={{ marginBottom: 0 }}>
                  <Tag size={14} className="text-gold" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Promotional Tags &amp; Perks
                </label>
                <span className="admin-field-hint">{config.tags.length} active tags</span>
              </div>
              <p className="admin-input-subtext">Highlighted perk pills shown below the offer title on the website.</p>

              {/* Tag Chips List */}
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

        {/* Right Column: Combos & Packages Management */}
        <div className="admin-offers-col">
          <div className="admin-offers-card glass-panel">
            <div className="admin-card-header-clean admin-combos-header-row">
              <div>
                <h3 className="admin-offers-card-title">
                  <Sparkles size={18} className="text-gold" /> Featured Combos &amp; Packages
                  <span className="admin-count-pill">{config.combos.length}</span>
                </h3>
                <span className="admin-card-subtitle">
                  Clicking any package on the site auto-selects it and opens Step 2 directly for date selection.
                </span>
              </div>
              <button
                type="button"
                className="btn btn-primary admin-add-package-btn"
                onClick={openAddCombo}
              >
                <Plus size={16} /> Add Package
              </button>
            </div>

            <div className="admin-combos-list">
              {config.combos.map((combo) => (
                <div key={combo.id} className="admin-combo-item-card">
                  <div className="admin-combo-item-content">
                    <div className="admin-combo-item-top">
                      <strong className="admin-combo-item-name">{combo.name}</strong>
                      <span className="admin-combo-item-price">{combo.price}</span>
                      <span className="admin-combo-item-cat-badge">{combo.category || 'Beauty'}</span>
                    </div>
                    {combo.desc && (
                      <p className="admin-combo-item-desc">{combo.desc}</p>
                    )}
                  </div>

                  <div className="admin-combo-item-actions">
                    <button
                      type="button"
                      className="admin-combo-action-btn"
                      onClick={() => openEditCombo(combo)}
                      title="Edit package details"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      className="admin-combo-action-btn admin-combo-action-btn--delete"
                      onClick={() => handleDeleteCombo(combo.id)}
                      title="Remove package"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}

              {config.combos.length === 0 && (
                <div className="admin-empty-combos">
                  <p>No combo packages created yet.</p>
                  <button type="button" className="btn btn-outline-gold" onClick={openAddCombo}>
                    <Plus size={15} /> Create First Package
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Combo Dialog Modal */}
      {isAddComboOpen && (
        <div className="modal-overlay" onClick={closeComboModal}>
          <div className="modal-content admin-combo-dialog-modal" onClick={(e) => e.stopPropagation()}>
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
                      <option key={cat} value={cat}>{cat}</option>
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
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeComboModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  <Save size={15} /> {editingCombo ? 'Update Package' : 'Add Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
