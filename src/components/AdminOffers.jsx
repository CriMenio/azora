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
  Gift,
  Heart,
  Scissors,
  Crown,
  Flame,
  Maximize2,
  LayoutTemplate,
  Award,
  ShieldCheck,
} from 'lucide-react';
import {
  getOfferConfig,
  saveOfferConfig,
  resetOfferConfig,
  saveOfferToSpreadsheet,
  fetchOfferFromSpreadsheet,
  DEFAULT_OFFER_CONFIG,
  DIWALI_OFFER_CONFIG,
  DEFAULT_SPECIAL_OFFERS,
  resolveOfferBannerImage,
} from '../services/offerService';
import { SITE_IMAGES } from '../assets/siteImages';
import { uploadGalleryImage } from '../services/galleryService';
import ConfirmModal from './ConfirmModal';

const CATEGORY_OPTIONS = [
  'Beauty',
  'Waxing',
  'Nails',
  'Hair',
  'Grooming',
  'Facial',
  'Clean-Up',
  'Makeup',
];

const BIFURCATION_META = {
  Beauty: {
    title: 'Beauty Combos',
    subtitle: 'O3+ Facials, Glow Cleanups & Waxing Combos with Complimentary Face D-Tan',
    icon: Award,
  },
  Waxing: {
    title: 'Waxing Services',
    subtitle: 'Hygienic Normal & Italian Rica Waxing combos with precision eyebrow styling',
    icon: ShieldCheck,
  },
  Nails: {
    title: 'Nails & Pedicure',
    subtitle: 'Gel Polish, Acrylic & Gel Extensions with Free 2-Finger Art & Cat Eye Polish',
    icon: Sparkles,
  },
  Hair: {
    title: 'Hair Spa & Treatments',
    subtitle: 'Nourishing Hair Spa, Global Colours, Highlights, Keratin, Smoothing & Botox',
    icon: Scissors,
  },
  Grooming: {
    title: "Men's Diwali Grooming",
    subtitle: 'Diwali festive haircuts, beard styling, head massage & special D-Tan packages',
    icon: Heart,
  },
  Facial: {
    title: 'Facial & Skin Care',
    subtitle: 'Luxury facials and deep skin rejuvenation',
    icon: Crown,
  },
  'Clean-Up': {
    title: 'Express Clean-Ups',
    subtitle: 'Deep cleansing and skin exfoliation',
    icon: Sparkles,
  },
  Makeup: {
    title: 'Festive & Party Makeup',
    subtitle: 'Celebration makeup and hair styling',
    icon: Flame,
  },
};

function getSpecialBannerCategory(banner) {
  if (banner.category && banner.category.trim()) return banner.category.trim();
  const text = `${banner.title || ''} ${banner.desc || ''} ${banner.pill || ''} ${banner.tag || ''}`.toLowerCase();
  if (text.includes('husband') || text.includes('groom') || text.includes('men')) return 'Grooming';
  if (text.includes('nail') || text.includes('pedicure') || text.includes('manicure')) return 'Nails';
  if (text.includes('hair') || text.includes('botox') || text.includes('keratin') || text.includes('spa')) return 'Hair';
  if (text.includes('wax')) return 'Waxing';
  return 'Beauty';
}

const COMMON_TREATMENT_CHIPS = [
  'Face D-Tan',
  'Eyebrows',
  'Full Hand Wax',
  'Half Leg Wax',
  'Underarm Wax',
  'Rica Wax',
  'Haircut',
  'Hair Wash',
  'Blow Dry',
  'Hair Spa',
  'Beard Trim',
  'Head Massage',
  '2-Finger Nail Art',
  'Cat Eye Gel Polish',
  'O3+ Facial',
  'O3+ Cleanup',
  'Hair Keratin',
  'Hair Botox',
];

const ICON_OPTIONS = [
  { id: 'heart', label: 'Heart (Couple / Love)', icon: Heart },
  { id: 'gift', label: 'Gift Box (Free Offer)', icon: Gift },
  { id: 'sparkles', label: 'Sparkles (Glow / Magic)', icon: Sparkles },
  { id: 'scissors', label: 'Scissors (Styling / Hair)', icon: Scissors },
  { id: 'crown', label: 'Crown (Luxury / VIP)', icon: Crown },
  { id: 'flame', label: 'Flame (Hot Deal)', icon: Flame },
  { id: 'tag', label: 'Tag (Special Discount)', icon: Tag },
];

function getBannerIconComponent(iconName) {
  switch (String(iconName || '').toLowerCase()) {
    case 'gift':
      return Gift;
    case 'sparkles':
      return Sparkles;
    case 'scissors':
      return Scissors;
    case 'crown':
      return Crown;
    case 'tag':
      return Tag;
    case 'flame':
      return Flame;
    case 'heart':
    default:
      return Heart;
  }
}

export default function AdminOffers({ adminPin }) {
  const [config, setConfig] = useState(getOfferConfig);
  const [activeTab, setActiveTab] = useState('offers'); // 'offers' | 'poster'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFlyerDock, setShowFlyerDock] = useState(false);
  const [isFlyerZoomOpen, setIsFlyerZoomOpen] = useState(false);

  // Record Modals
  const [viewingCombo, setViewingCombo] = useState(null);
  const [editingCombo, setEditingCombo] = useState(null);
  const [isAddComboOpen, setIsAddComboOpen] = useState(false);
  const [comboFormData, setComboFormData] = useState({
    id: '',
    name: '',
    price: '',
    numericPrice: '',
    category: 'Beauty',
    badge: '',
    desc: '',
  });
  const [comboToDelete, setComboToDelete] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLoadDiwaliConfirmOpen, setIsLoadDiwaliConfirmOpen] = useState(false);

  // Special Promotional Banners Modals (Horizontal card format)
  const [isSpecialBannerModalOpen, setIsSpecialBannerModalOpen] = useState(false);
  const [editingSpecialBanner, setEditingSpecialBanner] = useState(null);
  const [specialBannerToDelete, setSpecialBannerToDelete] = useState(null);
  const [specialBannerFormData, setSpecialBannerFormData] = useState({
    id: '',
    title: '',
    category: 'Beauty',
    pill: 'Special Festive Surprise!',
    tag: '100% Free Grooming',
    icon: 'heart',
    desc: '',
    quote: '',
    btnText: 'Claim on WhatsApp',
    whatsappMsg: '',
    isActive: true,
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
        title: config.title || 'Diwali Offer Banner',
        desc: config.desc || 'Festive Offer Poster',
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

  // 1-Click switch to uploaded Diwali template poster
  const handleSetDiwaliPoster = () => {
    setConfig((prev) => ({
      ...prev,
      image: 'DIWALI_TEMPLATE',
    }));
    setSaveSuccess(false);
    setHasUnsavedChanges(true);
  };

  // 1-Click Load all Diwali template offers
  const handleConfirmLoadDiwaliTemplate = () => {
    setIsLoadDiwaliConfirmOpen(false);
    setConfig(DIWALI_OFFER_CONFIG);
    saveOfferConfig(DIWALI_OFFER_CONFIG);
    setHasUnsavedChanges(true);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4500);
  };

  // Combos CRUD
  const openAddCombo = (defaultCat = null) => {
    setEditingCombo(null);
    const catToUse = defaultCat || (categoryFilter !== 'all' ? categoryFilter : 'Beauty');
    setComboFormData({
      id: '',
      name: '',
      price: '',
      numericPrice: '',
      category: catToUse,
      badge: '',
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
      badge: combo.badge || '',
      desc: combo.desc || '',
    });
    setIsAddComboOpen(true);
  };

  const closeComboModal = () => {
    setIsAddComboOpen(false);
    setEditingCombo(null);
  };

  const handleAppendChipToDesc = (chipText) => {
    setComboFormData((prev) => {
      const current = prev.desc.trim();
      const newDesc = current ? `${current} + ${chipText}` : chipText;
      return { ...prev, desc: newDesc };
    });
  };

  const handleSaveCombo = (e) => {
    e.preventDefault();
    if (!comboFormData.name.trim() || !comboFormData.price.trim()) return;

    const numericVal =
      parseInt(comboFormData.numericPrice, 10) ||
      parseInt((comboFormData.price || '').replace(/[^0-9]/g, ''), 10) ||
      999;

    const comboItem = {
      id: editingCombo?.id || `offer-${Date.now()}`,
      name: comboFormData.name.trim(),
      price: comboFormData.price.trim(),
      numericPrice: numericVal,
      category: comboFormData.category,
      badge: (comboFormData.badge || '').trim(),
      desc: comboFormData.desc.trim(),
    };

    if (editingCombo) {
      setConfig((prev) => ({
        ...prev,
        combos: prev.combos.map((c) => (c.id === editingCombo.id ? comboItem : c)),
      }));

      if (viewingCombo?.id === editingCombo.id) {
        setViewingCombo(comboItem);
      }
    } else {
      setConfig((prev) => ({
        ...prev,
        combos: [...prev.combos, comboItem],
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

  // Special Offer Banners (Wide horizontal format) CRUD
  const openAddSpecialBanner = (defaultCat = 'Beauty') => {
    setEditingSpecialBanner(null);
    const catToUse = defaultCat || (categoryFilter !== 'all' ? categoryFilter : 'Beauty');
    setSpecialBannerFormData({
      id: '',
      title: '',
      category: catToUse,
      pill: 'Special Festive Offer!',
      tag: '100% Free Offer',
      icon: 'gift',
      desc: '',
      quote: '',
      btnText: 'Claim on WhatsApp',
      whatsappMsg: '',
      isActive: true,
    });
    setIsSpecialBannerModalOpen(true);
  };

  const openEditSpecialBanner = (banner) => {
    setEditingSpecialBanner(banner);
    setSpecialBannerFormData({
      id: banner.id,
      title: banner.title || '',
      category: banner.category || getSpecialBannerCategory(banner),
      pill: banner.pill || 'Special Festive Surprise!',
      tag: banner.tag || '100% Free',
      icon: banner.icon || 'gift',
      desc: banner.desc || '',
      quote: banner.quote || '',
      btnText: banner.btnText || 'Claim on WhatsApp',
      whatsappMsg: banner.whatsappMsg || '',
      isActive: banner.isActive !== false,
    });
    setIsSpecialBannerModalOpen(true);
  };

  const handleToggleSpecialBannerActive = (bannerId) => {
    const currentList = Array.isArray(config.specialOffers) ? config.specialOffers : [];
    setConfig((prev) => ({
      ...prev,
      specialOffers: currentList.map((b) =>
        b.id === bannerId ? { ...b, isActive: b.isActive === false } : b
      ),
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveSpecialBanner = (e) => {
    e.preventDefault();
    if (!specialBannerFormData.title.trim() || !specialBannerFormData.desc.trim()) return;

    const bannerItem = {
      id: editingSpecialBanner?.id || `sp-${Date.now()}`,
      title: specialBannerFormData.title.trim(),
      category: specialBannerFormData.category || 'Beauty',
      pill: specialBannerFormData.pill.trim(),
      tag: specialBannerFormData.tag.trim(),
      icon: specialBannerFormData.icon || 'heart',
      desc: specialBannerFormData.desc.trim(),
      quote: specialBannerFormData.quote.trim(),
      btnText: specialBannerFormData.btnText.trim() || 'Claim on WhatsApp',
      whatsappMsg: specialBannerFormData.whatsappMsg.trim(),
      isActive: specialBannerFormData.isActive !== false,
    };

    const currentList = Array.isArray(config.specialOffers) ? config.specialOffers : [];

    if (editingSpecialBanner) {
      setConfig((prev) => ({
        ...prev,
        specialOffers: currentList.map((item) =>
          item.id === editingSpecialBanner.id ? bannerItem : item
        ),
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        specialOffers: [...currentList, bannerItem],
      }));
    }

    setHasUnsavedChanges(true);
    setIsSpecialBannerModalOpen(false);
    setEditingSpecialBanner(null);
  };

  const handleConfirmDeleteSpecialBanner = () => {
    if (!specialBannerToDelete) return;
    const currentList = Array.isArray(config.specialOffers) ? config.specialOffers : [];
    setConfig((prev) => ({
      ...prev,
      specialOffers: currentList.filter((item) => item.id !== specialBannerToDelete.id),
    }));
    setSpecialBannerToDelete(null);
    setHasUnsavedChanges(true);
  };

  const handleResetSpecialBannersToDefaults = () => {
    setConfig((prev) => ({
      ...prev,
      specialOffers: DEFAULT_SPECIAL_OFFERS,
    }));
    setHasUnsavedChanges(true);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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

  const bannerImageUrl = resolveOfferBannerImage(config.image);
  const currentSpecialOffers = Array.isArray(config.specialOffers) ? config.specialOffers : [];

  // Group packages and special banners by category bifurcation for ONE unified section
  const bifurcatedSections = useMemo(() => {
    const orderedCatIds = ['Beauty', 'Waxing', 'Nails', 'Hair', 'Grooming'];

    const allPresentCatIds = new Set();
    (config.combos || []).forEach((c) => allPresentCatIds.add(c.category || 'Beauty'));
    currentSpecialOffers.forEach((s) => allPresentCatIds.add(getSpecialBannerCategory(s)));

    const finalCatIds = [
      ...orderedCatIds.filter((id) => allPresentCatIds.has(id)),
      ...Array.from(allPresentCatIds).filter((id) => !orderedCatIds.includes(id)),
    ];

    const targetCatIds =
      categoryFilter === 'all'
        ? finalCatIds
        : finalCatIds.filter((id) => id.toLowerCase() === categoryFilter.toLowerCase());

    const q = searchQuery.toLowerCase().trim();

    return targetCatIds.map((catId) => {
      const meta = BIFURCATION_META[catId] || {
        title: `${catId} Offers`,
        subtitle: `Offers and deals in ${catId}`,
        icon: Sparkles,
      };

      const sectionCombos = (config.combos || []).filter((c) => {
        const matchCat = (c.category || 'Beauty').toLowerCase() === catId.toLowerCase();
        if (!matchCat) return false;
        if (!q) return true;
        return (
          (c.name || '').toLowerCase().includes(q) ||
          (c.desc || '').toLowerCase().includes(q) ||
          (c.price || '').toLowerCase().includes(q) ||
          (c.badge || '').toLowerCase().includes(q)
        );
      });

      const sectionSpecials = currentSpecialOffers.filter((s) => {
        const matchCat = getSpecialBannerCategory(s).toLowerCase() === catId.toLowerCase();
        if (!matchCat) return false;
        if (!q) return true;
        return (
          (s.title || '').toLowerCase().includes(q) ||
          (s.desc || '').toLowerCase().includes(q) ||
          (s.pill || '').toLowerCase().includes(q) ||
          (s.tag || '').toLowerCase().includes(q)
        );
      });

      return {
        id: catId,
        ...meta,
        combos: sectionCombos,
        specialOffers: sectionSpecials,
        totalCount: sectionCombos.length + sectionSpecials.length,
      };
    });
  }, [config.combos, config.specialOffers, categoryFilter, searchQuery]);

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
              Manage festive poster flyers, special promotional highlight banners, and bookable packages organized cleanly in ONE unified section by category bifurcation.
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

          {/* Toggle Flyer Reference Panel */}
          <button
            type="button"
            className={`btn ${showFlyerDock ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowFlyerDock(!showFlyerDock)}
            title="Toggle flyer reference panel to view poster while editing offers"
          >
            <ImageIcon size={15} />
            <span>{showFlyerDock ? 'Hide Flyer Pane' : 'Flyer Reference'}</span>
          </button>

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

      {/* Quick Import Banner: Diwali Special Offers Template */}
      <div className="admin-flyer-quick-import-banner glass-panel">
        <div className="admin-flyer-banner-content">
          <div className="admin-flyer-banner-icon">
            <LayoutTemplate size={22} />
          </div>
          <div className="admin-flyer-banner-text">
            <h4>Diwali Special Offers Flyer Template</h4>
            <p>
              Pre-loaded with Beauty Combos, Waxing Services, Nails, Hair Treatments, and Men's Grooming extracted directly from the Azora flyer.
            </p>
          </div>
        </div>
        <div className="admin-flyer-banner-actions">
          <button
            type="button"
            className="btn btn-outline-gold btn-sm"
            onClick={() => setIsFlyerZoomOpen(true)}
            title="Inspect full flyer"
          >
            <Maximize2 size={14} /> View Flyer
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsLoadDiwaliConfirmOpen(true)}
            title="Load all 18 Diwali packages and highlight banners into current configuration"
          >
            <Sparkles size={14} /> Load Diwali Template (All Deals &amp; Specials)
          </button>
        </div>
      </div>

      {/* Segmented Navigation Tabs: Unified Offers vs Poster Settings */}
      <div className="admin-offers-nav-tabs glass-panel">
        <button
          type="button"
          className={`admin-offers-nav-tab ${activeTab === 'offers' ? 'active' : ''}`}
          onClick={() => setActiveTab('offers')}
        >
          <Layers size={16} />
          <span>All Offers &amp; Packages (By Category)</span>
          <span className="admin-tab-count-pill">{config.combos.length + currentSpecialOffers.length}</span>
        </button>

        <button
          type="button"
          className={`admin-offers-nav-tab ${activeTab === 'poster' ? 'active' : ''}`}
          onClick={() => setActiveTab('poster')}
        >
          <ImageIcon size={16} />
          <span>Festive Poster &amp; Campaign Settings</span>
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
          <span>All offer changes, packages and special banners saved to Google Sheet &amp; Live Website!</span>
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
      {/* TAB 1: ONE UNIFIED SECTION — ALL OFFERS BIFURCATED BY CATEGORY */}
      {/* ============================================================== */}
      {activeTab === 'offers' && (
        <div className={showFlyerDock ? 'admin-offers-split-container' : ''}>
          <div className="admin-offers-records-section">
            {/* Top Quick Stats */}
            <div className="admin-offers-stats-row">
              <div className="admin-mini-stat-card glass-panel">
                <span className="mini-stat-label">Total Combos Available</span>
                <strong className="mini-stat-val text-gold">{config.combos.length}</strong>
                <span className="mini-stat-sub">1-Click bookable on site</span>
              </div>
              <div className="admin-mini-stat-card glass-panel">
                <span className="mini-stat-label">Special Promotional Banners</span>
                <strong className="mini-stat-val text-gold">
                  {currentSpecialOffers.filter((b) => b.isActive !== false).length}
                </strong>
                <span className="mini-stat-sub">Integrated inside categories</span>
              </div>
              <div className="admin-mini-stat-card glass-panel">
                <span className="mini-stat-label">Bifurcated Categories</span>
                <strong className="mini-stat-val text-gold">{bifurcatedSections.length}</strong>
                <span className="mini-stat-sub">Organized matching flyer</span>
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

            {/* Unified Toolbar: Search, Category Filter Pills & Add Actions */}
            <div className="admin-offers-toolbar glass-panel" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
              <div className="admin-offers-search-wrap" style={{ flex: '1 1 260px' }}>
                <Search size={16} className="admin-offers-search-icon" aria-hidden="true" />
                <input
                  type="search"
                  className="form-control admin-offers-search-input"
                  placeholder="Search offers by title, treatment, badge or price..."
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

              <div className="admin-offers-category-pills" style={{ flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`admin-filter-pill ${categoryFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('all')}
                >
                  All Offers ({config.combos.length + currentSpecialOffers.length})
                </button>
                {CATEGORY_OPTIONS.map((cat) => {
                  const comboCount = config.combos.filter((c) => (c.category || 'Beauty') === cat).length;
                  const specialCount = currentSpecialOffers.filter((s) => getSpecialBannerCategory(s) === cat).length;
                  const count = comboCount + specialCount;
                  if (count === 0 && categoryFilter !== cat) return null;
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

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => openAddSpecialBanner(categoryFilter !== 'all' ? categoryFilter : 'Beauty')}
                  title="Add a full-width promotional highlight banner"
                >
                  <Gift size={14} /> <span>+ Special Banner</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-sm admin-add-package-btn"
                  onClick={() => openAddCombo(categoryFilter !== 'all' ? categoryFilter : 'Beauty')}
                >
                  <Plus size={15} /> <span>+ Add Package</span>
                </button>
              </div>
            </div>

            {/* Bifurcated Category Sections */}
            {bifurcatedSections.length === 0 ? (
              <div className="admin-empty-combos glass-panel">
                <Sparkles size={36} className="text-gold" style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
                <h3>No Offers Found</h3>
                <p>
                  {searchQuery
                    ? `No offers or packages match "${searchQuery}".`
                    : 'No offers created in this category yet.'}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => openAddCombo(categoryFilter !== 'all' ? categoryFilter : 'Beauty')}
                  >
                    <Plus size={15} /> Create Package
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleResetSpecialBannersToDefaults}
                  >
                    <Sparkles size={14} /> Restore Default Specials
                  </button>
                </div>
              </div>
            ) : (
              bifurcatedSections.map((section) => {
                const SectionIcon = section.icon;

                return (
                  <div
                    key={section.id}
                    className="admin-category-bifurcation-block glass-panel"
                    style={{
                      marginBottom: '2rem',
                      padding: '1.5rem',
                      borderRadius: '16px',
                      border: '1px solid var(--color-border)',
                      background: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    {/* Category Header */}
                    <div className="azora-bifurcation-header" style={{ marginBottom: '1.25rem' }}>
                      <div className="azora-bifurcation-title-wrap">
                        <div className="azora-bifurcation-icon">
                          <SectionIcon size={20} />
                        </div>
                        <div>
                          <h3 className="azora-bifurcation-title" style={{ fontSize: '1.25rem' }}>
                            {section.title}
                          </h3>
                          <p className="azora-bifurcation-subtitle">{section.subtitle}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="azora-bifurcation-count">
                          {section.combos.length} {section.combos.length === 1 ? 'Combo' : 'Combos'}
                          {section.specialOffers.length > 0 && ` • ${section.specialOffers.length} Special`}
                        </span>

                        <button
                          type="button"
                          className="btn btn-outline-gold btn-sm"
                          onClick={() => openAddSpecialBanner(section.id)}
                          title={`Add a special promotional highlight banner in ${section.title}`}
                        >
                          <Gift size={13} /> <span>+ Special Banner</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => openAddCombo(section.id)}
                          title={`Add a package in ${section.title}`}
                        >
                          <Plus size={13} /> <span>+ Add Package</span>
                        </button>
                      </div>
                    </div>

                    {/* Category Special Promotional Banners (if any) */}
                    {section.specialOffers.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '0.75rem',
                            fontSize: '0.86rem',
                            color: 'var(--color-gold)',
                            fontWeight: 600,
                          }}
                        >
                          <Gift size={15} /> <span>Special Promotional Banners in {section.title}:</span>
                        </div>
                        {section.specialOffers.map((banner) => {
                          const IconComp = getBannerIconComponent(banner.icon);
                          const isLive = banner.isActive !== false;
                          return (
                            <div key={banner.id} className="admin-special-banner-card-wrap" style={{ marginBottom: '0.85rem' }}>
                              <div
                                className="azora-surprise-card glass-panel"
                                style={{
                                  opacity: isLive ? 1 : 0.65,
                                  borderBottomLeftRadius: 0,
                                  borderBottomRightRadius: 0,
                                  filter: isLive ? 'none' : 'grayscale(0.3)',
                                }}
                              >
                                <div className="azora-surprise-badge-row">
                                  {banner.pill && (
                                    <span className="azora-surprise-pill">
                                      <Gift size={13} /> {banner.pill}
                                    </span>
                                  )}
                                  {banner.tag && (
                                    <span className="azora-surprise-tag">{banner.tag}</span>
                                  )}
                                </div>

                                <div className="azora-surprise-content">
                                  <div className="azora-surprise-avatar">
                                    <IconComp size={24} className="text-gold" />
                                  </div>
                                  <div className="azora-surprise-details">
                                    <h4 className="azora-surprise-heading">{banner.title}</h4>
                                    <p className="azora-surprise-desc">
                                      {banner.desc}{' '}
                                      {banner.quote && (
                                        <span className="azora-surprise-quote">{banner.quote}</span>
                                      )}
                                    </p>
                                  </div>
                                  <div className="azora-surprise-btn-wrap">
                                    <span
                                      className="btn btn-outline-gold azora-claim-surprise-btn"
                                      style={{ pointerEvents: 'none' }}
                                    >
                                      <Sparkles size={14} /> {banner.btnText || 'Claim on WhatsApp'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="admin-special-banner-actions-bar">
                                <div className="admin-special-banner-status">
                                  <label
                                    className="admin-offers-toggle"
                                    style={{ margin: 0 }}
                                    title="Toggle visibility of this banner on customer website"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isLive}
                                      onChange={() => handleToggleSpecialBannerActive(banner.id)}
                                    />
                                    <span className="admin-offers-toggle-slider" />
                                  </label>
                                  <span style={{ color: isLive ? '#22c55e' : '#94a3b8' }}>
                                    {isLive ? '● Live on Customer Screen' : '○ Hidden from Customer Screen'}
                                  </span>
                                </div>

                                <div className="admin-special-banner-btns">
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => openEditSpecialBanner(banner)}
                                  >
                                    <Edit2 size={13} /> Edit Banner
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)' }}
                                    onClick={() => setSpecialBannerToDelete(banner)}
                                    title="Delete this banner"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Category Combos & Packages Grid */}
                    {section.combos.length > 0 ? (
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '0.75rem',
                            fontSize: '0.86rem',
                            color: 'var(--color-text-muted)',
                            fontWeight: 600,
                          }}
                        >
                          <Layers size={15} /> <span>Bookable Packages in {section.title}:</span>
                        </div>
                        <div className="admin-packages-records-grid">
                          {section.combos.map((combo) => (
                            <div
                              key={combo.id}
                              className="admin-package-record-card glass-panel"
                              onClick={() => setViewingCombo(combo)}
                              title="Click to open package record"
                            >
                              <div className="pkg-card-top">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  <span className="pkg-card-cat-badge">{combo.category || section.id}</span>
                                  {combo.badge && (
                                    <span className="pkg-card-custom-badge">
                                      <Sparkles size={11} /> {combo.badge}
                                    </span>
                                  )}
                                </div>
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
                      </div>
                    ) : (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '1.25rem',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: '10px',
                          border: '1px dashed var(--color-border)',
                        }}
                      >
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                          No combo packages in {section.title} yet. Click "+ Add Package" above to create one.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Sticky Side Flyer Reference Dock (When toggled ON) */}
          {showFlyerDock && (
            <aside className="admin-flyer-dock-card glass-panel">
              <div className="admin-card-header-clean" style={{ marginBottom: '0.75rem' }}>
                <h3 className="admin-offers-card-title" style={{ fontSize: '0.95rem' }}>
                  <ImageIcon size={16} className="text-gold" /> Flyer Template Dock
                </h3>
                <button
                  type="button"
                  className="modal-close"
                  style={{ position: 'static' }}
                  onClick={() => setShowFlyerDock(false)}
                  title="Close flyer dock"
                >
                  <X size={16} />
                </button>
              </div>

              <div
                className="admin-flyer-dock-img-wrap"
                onClick={() => setIsFlyerZoomOpen(true)}
                title="Click to view high-resolution flyer full screen"
              >
                <img
                  src={bannerImageUrl}
                  alt="Flyer Reference"
                  className="admin-flyer-dock-img"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = SITE_IMAGES.offers;
                  }}
                />
                <div className="admin-flyer-dock-zoom-hint">
                  <Maximize2 size={12} /> Click to Enlarge
                </div>
              </div>

              <div className="admin-flyer-dock-meta">
                <div><strong>Poster Title:</strong> {config.title || 'Diwali Special Offers'}</div>
                <div><strong>Validity:</strong> {config.dateRange || 'Festive Season'}</div>
              </div>

              <div className="admin-flyer-dock-actions">
                <button
                  type="button"
                  className="btn btn-outline-gold btn-sm"
                  onClick={() => openAddCombo()}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Plus size={14} /> Add Package from Flyer
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveTab('poster')}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <UploadCloud size={14} /> Change Poster Image
                </button>
              </div>
            </aside>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: FESTIVAL POSTER & CAMPAIGN SETTINGS                     */}
      {/* ============================================================== */}
      {activeTab === 'poster' && (
        <div>
          <div className="admin-offers-grid">
            {/* Left Column: Template Banner Poster */}
            <div className="admin-offers-col">
              <div className="admin-offers-card glass-panel">
                <div className="admin-card-header-clean">
                  <h3 className="admin-offers-card-title">
                    <ImageIcon size={18} className="text-gold" /> Offer Template Poster
                  </h3>
                  <span className="admin-card-subtitle">Display banner flyer for the customer offer screen</span>
                </div>

                <div className="admin-offers-banner-preview-box">
                  <img
                    src={bannerImageUrl}
                    alt={config.title}
                    className="admin-offers-banner-preview-img"
                    onClick={() => setIsFlyerZoomOpen(true)}
                    style={{ cursor: 'pointer' }}
                    title="Click image to zoom full screen"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = SITE_IMAGES.offers;
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

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-outline-gold admin-upload-banner-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      style={{ flex: 1 }}
                    >
                      <UploadCloud size={16} />
                      <span>{uploadingImage ? 'Uploading to Drive...' : 'Upload New Poster'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleSetDiwaliPoster}
                      title="Use official uploaded Diwali poster template"
                    >
                      <Sparkles size={15} /> Use Diwali Template Poster
                    </button>
                  </div>

                  <div className="admin-offers-image-url-field">
                    <label className="form-label">Or Direct Image / Google Drive URL:</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://drive.google.com/uc?id=... or /images/..."
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
                    placeholder="e.g. Diwali Special Offers"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Promotional Badge Tag</label>
                  <input
                    className="form-control"
                    value={config.badge}
                    onChange={(e) => handleFieldChange('badge', e.target.value)}
                    placeholder="e.g. Diwali SPECIAL OFFERS"
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
                      placeholder="e.g. Diwali Festive Celebration"
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
                    placeholder="Look Beautiful • Feel Confident • Celebrate Brightly!"
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
                    placeholder="Type a tag &amp; press Enter (e.g. FREE Face D-Tan with any Facial)"
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
                {viewingCombo.badge && (
                  <span className="pkg-card-custom-badge">
                    <Sparkles size={11} /> {viewingCombo.badge}
                  </span>
                )}
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

      {/* ============================================================== */}
      {/* ADD / EDIT COMBO DIALOG MODAL                                  */}
      {/* ============================================================== */}
      {isAddComboOpen && (
        <div className="modal-overlay" onClick={closeComboModal}>
          <div
            className="modal-content admin-combo-dialog-modal glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px' }}
          >
            <button className="modal-close" onClick={closeComboModal} aria-label="Close dialog">
              <X size={20} />
            </button>

            <div className="admin-modal-title-bar">
              <h3 className="admin-modal-title">
                {editingCombo ? 'Edit Combo Package' : 'Add New Combo Package'}
              </h3>
              <p className="admin-modal-subtitle">
                This package will appear on the festive offer screen and can be booked in 1-click by clients.
              </p>
            </div>

              <form id="combo-package-form" onSubmit={handleSaveCombo} className="admin-modal-body">
                <div className="form-group">
                  <label className="form-label">Package Name *</label>
                  <input
                    className="form-control"
                    required
                    value={comboFormData.name}
                    onChange={(e) => setComboFormData({ ...comboFormData, name: e.target.value })}
                    placeholder="e.g. 1. O3+ Facial + Rica Waxing Combo or Normal Waxing Combo"
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
                      placeholder="e.g. ₹2,199 or ₹499"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category *</label>
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

                <div className="form-group">
                  <label className="form-label">Optional Highlight Badge / Perk Tag</label>
                  <input
                    className="form-control"
                    value={comboFormData.badge}
                    onChange={(e) => setComboFormData({ ...comboFormData, badge: e.target.value })}
                    placeholder="e.g. Festive Deal, Best Value, FREE Nail Art, Popular"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Included Treatments &amp; Description *</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    required
                    value={comboFormData.desc}
                    onChange={(e) => setComboFormData({ ...comboFormData, desc: e.target.value })}
                    placeholder="e.g. O3+ Facial + Face D-Tan + Full Hand Rica Wax + Underarm Wax"
                    style={{ minHeight: '80px', resize: 'vertical' }}
                  />

                  {/* Quick Inserter Chips for Fast Package Creation */}
                  <span className="admin-quick-insert-label">Quick insert common treatments:</span>
                  <div className="admin-quick-insert-chips">
                    {COMMON_TREATMENT_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        className="admin-quick-insert-chip"
                        onClick={() => handleAppendChipToDesc(chip)}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </form>

            {/* Pinned Action Buttons Footer - Always Visible */}
            <div className="admin-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={closeComboModal}>
                Cancel
              </button>
              <button
                type="submit"
                form="combo-package-form"
                className="btn btn-primary"
                style={{ minWidth: '150px' }}
              >
                <Save size={16} /> <span>{editingCombo ? 'Save Changes' : 'Save Package'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD / EDIT SPECIAL OFFER BANNER DIALOG MODAL                   */}
      {/* ============================================================== */}
      {isSpecialBannerModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSpecialBannerModalOpen(false)}>
          <div
            className="modal-content admin-combo-dialog-modal glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '680px' }}
          >
            <button
              className="modal-close"
              onClick={() => setIsSpecialBannerModalOpen(false)}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            <div className="admin-modal-title-bar">
              <h3 className="admin-modal-title">
                {editingSpecialBanner ? 'Edit Special Offer Banner' : 'Add New Special Offer Banner'}
              </h3>
              <p className="admin-modal-subtitle">
                This banner displays in the full-width luxury format with avatar icon, pills, and WhatsApp action in its category bifurcation.
              </p>
            </div>

              <form id="special-banner-form" onSubmit={handleSaveSpecialBanner} className="admin-modal-body">
                <div className="form-group">
                  <label className="form-label">Banner Heading / Title *</label>
                  <input
                    className="form-control"
                    required
                    value={specialBannerFormData.title}
                    onChange={(e) => setSpecialBannerFormData({ ...specialBannerFormData, title: e.target.value })}
                    placeholder="e.g. Ladies, Bring Your Husbands Along! 💖 or Complimentary Face D-Tan on Us! ✨"
                  />
                </div>

                <div className="admin-form-row-2">
                  <div className="form-group">
                    <label className="form-label">Category Section *</label>
                    <select
                      className="form-control"
                      value={specialBannerFormData.category}
                      onChange={(e) => setSpecialBannerFormData({ ...specialBannerFormData, category: e.target.value })}
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Icon Avatar</label>
                    <select
                      className="form-control"
                      value={specialBannerFormData.icon}
                      onChange={(e) => setSpecialBannerFormData({ ...specialBannerFormData, icon: e.target.value })}
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-form-row-2">
                  <div className="form-group">
                    <label className="form-label">Top-Left Pill Text</label>
                    <input
                      className="form-control"
                      value={specialBannerFormData.pill}
                      onChange={(e) => setSpecialBannerFormData({ ...specialBannerFormData, pill: e.target.value })}
                      placeholder="e.g. Special Festive Surprise!"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Top-Right Tag Text</label>
                    <input
                      className="form-control"
                      value={specialBannerFormData.tag}
                      onChange={(e) => setSpecialBannerFormData({ ...specialBannerFormData, tag: e.target.value })}
                      placeholder="e.g. 100% Free Grooming or 100% Free D-Tan"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Offer Description Text *</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    required
                    value={specialBannerFormData.desc}
                    onChange={(e) => setSpecialBannerFormData({ ...specialBannerFormData, desc: e.target.value })}
                    placeholder="e.g. If he is paying your festive bill, we’ll treat him to a FREE D-Tan Treatment on us!"
                  />
                </div>

                <div className="admin-form-row-2">
                  <div className="form-group">
                    <label className="form-label">Optional Subtitle / Italic Quote</label>
                    <input
                      className="form-control"
                      value={specialBannerFormData.quote}
                      onChange={(e) => setSpecialBannerFormData({ ...specialBannerFormData, quote: e.target.value })}
                      placeholder="e.g. “Because his tan doesn’t deserve the spotlight on your special festive day!”"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Button Action Text</label>
                    <input
                      className="form-control"
                      value={specialBannerFormData.btnText}
                      onChange={(e) => setSpecialBannerFormData({ ...specialBannerFormData, btnText: e.target.value })}
                      placeholder="e.g. Claim on WhatsApp"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Custom WhatsApp Pre-filled Text (Optional)</label>
                  <input
                    className="form-control"
                    value={specialBannerFormData.whatsappMsg}
                    onChange={(e) => setSpecialBannerFormData({ ...specialBannerFormData, whatsappMsg: e.target.value })}
                    placeholder="e.g. Hi Azora Salon, I would like to book an appointment and claim this special offer!"
                  />
                </div>

                {/* Live Preview Box inside Modal */}
                <div style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
                  <span className="admin-quick-insert-label">Live Preview:</span>
                  <div className="azora-surprise-card glass-panel" style={{ padding: '1.25rem', marginTop: '0.45rem' }}>
                    <div className="azora-surprise-badge-row">
                      <span className="azora-surprise-pill">
                        <Gift size={13} /> {specialBannerFormData.pill || 'Special Offer'}
                      </span>
                      <span className="azora-surprise-tag">{specialBannerFormData.tag || 'Special'}</span>
                    </div>
                    <div className="azora-surprise-content">
                      <div className="azora-surprise-avatar">
                        {React.createElement(getBannerIconComponent(specialBannerFormData.icon), { size: 24, className: 'text-gold' })}
                      </div>
                      <div className="azora-surprise-details">
                        <h4 className="azora-surprise-heading" style={{ fontSize: '1.1rem' }}>
                          {specialBannerFormData.title || 'Special Offer Heading'}
                        </h4>
                        <p className="azora-surprise-desc" style={{ fontSize: '0.86rem' }}>
                          {specialBannerFormData.desc || 'Offer description goes here.'}{' '}
                          {specialBannerFormData.quote && (
                            <span className="azora-surprise-quote">{specialBannerFormData.quote}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </form>

            {/* Pinned Action Buttons Footer - Always Visible */}
            <div className="admin-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsSpecialBannerModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="special-banner-form"
                className="btn btn-primary"
                style={{ minWidth: '160px' }}
              >
                <Save size={16} /> <span>{editingSpecialBanner ? 'Save Changes' : 'Save Banner'}</span>
              </button>
            </div>
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

      {/* Delete Special Banner Confirm Modal */}
      <ConfirmModal
        isOpen={!!specialBannerToDelete}
        onClose={() => setSpecialBannerToDelete(null)}
        onConfirm={handleConfirmDeleteSpecialBanner}
        title="Delete Special Offer Banner?"
        message={`Are you sure you want to delete the "${specialBannerToDelete?.title}" banner?`}
        subtext="This banner will be permanently removed from the offer screen."
        confirmText="Yes, Delete Banner"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Load Diwali Template Confirm Modal */}
      <ConfirmModal
        isOpen={isLoadDiwaliConfirmOpen}
        onClose={() => setIsLoadDiwaliConfirmOpen(false)}
        onConfirm={handleConfirmLoadDiwaliTemplate}
        title="Load Diwali Special Offers Template?"
        message="This will populate all 18 Diwali combo packages, pricing, flyer image, and highlight banners from the salon flyer."
        subtext="You can freely review, edit prices, add new deals, and save to Google Sheet afterward."
        confirmText="Yes, Load Diwali Template"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Reset Offer Settings Confirm Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Offer Configuration?"
        message="Are you sure you want to reset all offer settings, titles, banners, and combo packages to factory defaults?"
        subtext="Any custom flyers, adjusted prices, and new packages will be reverted."
        confirmText="Yes, Reset Configuration"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Fullscreen High-Res Flyer Zoom Modal */}
      {isFlyerZoomOpen && (
        <div className="azora-offer-modal-overlay" onClick={() => setIsFlyerZoomOpen(false)}>
          <div className="azora-offer-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="azora-offer-modal-close"
              onClick={() => setIsFlyerZoomOpen(false)}
              aria-label="Close zoom"
            >
              <X size={26} />
            </button>
            <img
              src={bannerImageUrl}
              alt={config.title}
              className="azora-offer-modal-img"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = SITE_IMAGES.offers;
              }}
            />
            <div className="azora-offer-modal-footer">
              <div>
                <span className="azora-offer-modal-title">{config.title || 'Diwali Special Offers'}</span>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  Azora Family Salon Flyer Reference
                </p>
              </div>
              <div className="azora-offer-modal-btns">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setIsFlyerZoomOpen(false);
                    openAddCombo();
                  }}
                >
                  <Plus size={15} /> Add Package From Flyer
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsFlyerZoomOpen(false)}
                >
                  Close Zoom
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
