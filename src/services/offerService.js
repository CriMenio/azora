import { SITE_IMAGES } from '../assets/siteImages';

const STORAGE_KEY = 'azora_offer_config';

/**
 * Default Special Promotional Banners (exact format as the husband surprise card)
 */
export const DEFAULT_SPECIAL_OFFERS = [
  {
    id: 'sp-face-dtan',
    category: 'Beauty',
    pill: 'Special Festive Offer!',
    tag: '100% Free D-Tan',
    icon: 'gift',
    title: 'Complimentary Face D-Tan on Us! ✨',
    desc: 'Book any Facial or Cleanup treatment, and receive a FREE Face D-Tan treatment absolutely complimentary.',
    quote: '“Double the festive radiance, zero extra charge!”',
    btnText: 'Claim on WhatsApp',
    whatsappMsg: 'Hi Azora Salon, I would like to book a Cleanup or Facial and claim the Free Face D-Tan offer!',
    isActive: true,
  },
  {
    id: 'sp-nail-art',
    category: 'Nails',
    pill: 'Festive Nail Bar Special!',
    tag: 'Free Nail Art Included',
    icon: 'sparkles',
    title: 'Free 2-Finger Nail Art with Extensions! 💅',
    desc: 'Get FREE 2-Finger Nail Art with Nail Extensions & Gel Extensions only. Plus Cat Eye Gel Polish included with any Nail Service.',
    quote: '“Sparkle with customized festival nail artistry!”',
    btnText: 'Claim on WhatsApp',
    whatsappMsg: 'Hi Azora Salon, I would like to book Nail Extensions and claim the Free 2-Finger Nail Art!',
    isActive: true,
  },
  {
    id: 'sp-mani-pedi',
    category: 'Nails',
    pill: 'Hands & Feet Therapy!',
    tag: 'Flat 10% OFF',
    icon: 'crown',
    title: 'Manicure from ₹599 & Flat 10% OFF Pedicures! 🌸',
    desc: 'Pamper your hands and feet with luxury crystal exfoliation and deep hydration therapies.',
    quote: '“Step into celebration season feeling relaxed and polished!”',
    btnText: 'Claim on WhatsApp',
    whatsappMsg: 'Hi Azora Salon, I would like to book a Pedicure with Flat 10% OFF!',
    isActive: true,
  },
  {
    id: 'sp-husband-dtan',
    category: 'Grooming',
    pill: 'Special Festive Surprise!',
    tag: '100% Free Grooming',
    icon: 'heart',
    title: 'Ladies, Bring Your Husbands Along! 💖',
    desc: 'If he is paying your festive bill, we’ll treat him to a FREE D-Tan Treatment on us!',
    quote: '“Because his tan doesn’t deserve the spotlight on your special festive day!”',
    btnText: 'Claim on WhatsApp',
    whatsappMsg: 'Hi Azora Salon, I would like to book a festive appointment and claim the Free D-Tan for my husband!',
    isActive: true,
  },
];

/**
 * Diwali Special Offers - extracted directly from the salon flyer template
 */
export const DIWALI_OFFER_CONFIG = {
  version: 2,
  isActive: true,
  title: 'Diwali Special Offers',
  badge: 'Diwali SPECIAL OFFERS',
  desc: 'Look Beautiful • Feel Confident • Celebrate Brightly! Exclusive festive beauty combos, waxing services, nail art extensions, and luxury grooming packages at celebration rates.',
  dateRange: 'Diwali Festive Celebration',
  tags: [
    'FREE Face D-Tan with any Cleanup or Facial',
    'FREE 2-Finger Nail Art with Extensions',
    'Flat 10% OFF on any Pedicure',
    'Cat Eye Gel Polish with any Nail Service',
    'Hygienic & Sanitized Salon',
    'Senior Stylist Preeti',
  ],
  image: SITE_IMAGES.offers,
  specialOffers: DEFAULT_SPECIAL_OFFERS,
  combos: [
    // 1. BEAUTY COMBOS
    {
      id: 'offer-o3-facial-rica-wax',
      name: '1. O3+ Facial + Rica Waxing Combo',
      price: '₹2,199',
      numericPrice: 2199,
      category: 'Beauty',
      desc: 'O3+ Facial + Face D-Tan + Full Hand Rica Wax + Underarm Wax',
      badge: 'Festive Deal',
    },
    {
      id: 'offer-o3-cleanup-normal-wax',
      name: '2. O3+ Cleanup + Normal Waxing Combo',
      price: '₹1,399',
      numericPrice: 1399,
      category: 'Beauty',
      desc: 'O3+ Cleanup + Face D-Tan + Full Hand Wax + Half Leg Wax + Underarm Wax',
      badge: 'Popular Combo',
    },

    // 2. WAXING SERVICES
    {
      id: 'offer-normal-waxing-combo',
      name: 'Normal Waxing Combo',
      price: '₹499',
      numericPrice: 499,
      category: 'Waxing',
      desc: 'Full Hand Wax + Half Leg Wax + Underarm Wax + Eyebrows',
      badge: 'Best Value',
    },
    {
      id: 'offer-full-rica-wax-combo',
      name: 'Full Rica Wax Combo',
      price: '₹699',
      numericPrice: 699,
      category: 'Waxing',
      desc: 'Full Hand Rica Wax + Half Leg Rica Wax + Underarm Wax + Eyebrows',
      badge: 'Rica Special',
    },

    // 3. NAILS & PEDICURE
    {
      id: 'offer-hand-gel-polish',
      name: 'Hand Gel Polish',
      price: '₹399',
      numericPrice: 399,
      category: 'Nails',
      desc: 'Hand Gel Polish Finishing with Cat Eye Gel Polish option',
    },
    {
      id: 'offer-feet-gel-polish',
      name: 'Feet Gel Polish',
      price: '₹399',
      numericPrice: 399,
      category: 'Nails',
      desc: 'Feet Gel Polish Finishing with Long-Lasting Shine',
    },
    {
      id: 'offer-hand-feet-combo',
      name: 'Hand + Feet Gel Polish Combo',
      price: '₹699',
      numericPrice: 699,
      category: 'Nails',
      desc: 'Hand Gel Polish + Feet Gel Polish (Cat Eye Included)',
      badge: 'Combo Deal',
    },
    {
      id: 'offer-nail-extensions',
      name: 'Nail Extensions',
      price: '₹1,299',
      numericPrice: 1299,
      category: 'Nails',
      desc: 'Full Nail Extensions + FREE 2-Finger Nail Art included',
      badge: 'FREE Nail Art',
    },
    {
      id: 'offer-gel-extensions',
      name: 'Gel Extensions',
      price: '₹1,299',
      numericPrice: 1299,
      category: 'Nails',
      desc: 'Full Gel Extensions + FREE 2-Finger Nail Art included',
      badge: 'FREE Nail Art',
    },

    // 4. HAIR SPA COMBO
    {
      id: 'offer-hair-spa-combo',
      name: 'Hair Spa Combo',
      price: '₹999',
      numericPrice: 999,
      category: 'Hair',
      desc: 'Hair Spa + Any Haircut + Hair Wash + Blow Dry',
      badge: 'Hair Favorite',
    },

    // 5. HAIR TREATMENTS
    {
      id: 'offer-global-hair-colour',
      name: '1. Global Hair Colour + Haircut',
      price: '₹1,999',
      numericPrice: 1999,
      category: 'Hair',
      desc: 'Global Hair Colour + Signature Haircut & Styling',
    },
    {
      id: 'offer-global-highlights',
      name: '2. Global Highlights + Haircut',
      price: '₹2,199',
      numericPrice: 2199,
      category: 'Hair',
      desc: 'Global Multi-Dimensional Highlights + Haircut',
    },
    {
      id: 'offer-hair-keratin',
      name: '3. Hair Keratin + Haircut',
      price: '₹2,499',
      numericPrice: 2499,
      category: 'Hair',
      desc: 'Deep Keratin Protein Reconstruction + Haircut',
      badge: 'Popular',
    },
    {
      id: 'offer-hair-smoothing',
      name: '4. Hair Smoothing',
      price: '₹2,999',
      numericPrice: 2999,
      category: 'Hair',
      desc: 'Professional Hair Smoothing Treatment for frizz-free silkiness',
    },
    {
      id: 'offer-hair-botox',
      name: '5. Hair Botox',
      price: '₹3,499',
      numericPrice: 3499,
      category: 'Hair',
      desc: 'Luxury Hair Botox Therapy for intense hydration and shine',
      badge: 'Luxury',
    },

    // 6. MEN'S DIWALI GROOMING
    {
      id: 'offer-mens-grooming-combo',
      name: 'Grooming Combo (Men)',
      price: '₹299',
      numericPrice: 299,
      category: 'Grooming',
      desc: 'Haircut + Beard Trim',
    },
    {
      id: 'offer-mens-relaxation-combo',
      name: 'Relaxation Combo (Men)',
      price: '₹499',
      numericPrice: 499,
      category: 'Grooming',
      desc: 'Hair Wash + Head Massage + Hair Setting',
    },
    {
      id: 'offer-mens-grooming-plus',
      name: 'Men’s Grooming Plus',
      price: '₹699',
      numericPrice: 699,
      category: 'Grooming',
      desc: 'Haircut + Beard + D-Tan Treatment',
      badge: 'All-in-One',
    },
  ],
};

export const DEFAULT_OFFER_CONFIG = DIWALI_OFFER_CONFIG;

function getWebhookUrl() {
  const url = import.meta.env.VITE_SPREADSHEET_WEBHOOK_URL;
  return url?.trim() || '';
}

function isWebhookConfigured(url) {
  return url && url !== 'YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL_HERE' && url.trim() !== '';
}

/**
 * Resolves an offer image URL to ensure it renders reliably in both dev and production.
 */
export function resolveOfferBannerImage(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return SITE_IMAGES.offers;
  }

  const trimmed = imageUrl.trim();

  // Empty, placeholder, or dev-only local path that doesn't exist in production dist bundle
  if (
    !trimmed ||
    trimmed === 'DEFAULT' ||
    trimmed === 'DIWALI_TEMPLATE' ||
    trimmed.startsWith('/src/') ||
    trimmed.startsWith('src/') ||
    trimmed.includes('diwali-offers.jpg')
  ) {
    return SITE_IMAGES.offers;
  }

  if (trimmed === 'NAVRATRI_TEMPLATE' || trimmed.includes('navratri-offers.jpg')) {
    return SITE_IMAGES.offersNavratri || SITE_IMAGES.offers;
  }

  // Base64 data URLs or production hashed asset URLs
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('/assets/')) {
    return trimmed;
  }

  // Direct public path
  if (trimmed.startsWith('/images/')) {
    return trimmed;
  }

  // Convert Google Drive share links to reliable direct thumbnail stream
  const driveMatch =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1200`;
  }

  return trimmed;
}

/**
 * Returns the currently active offer configuration from localStorage,
 * falling back to DEFAULT_OFFER_CONFIG.
 */
export function getOfferConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_OFFER_CONFIG;
    const parsed = JSON.parse(raw);

    // Auto-migrate if local storage still has old Navratri title
    if (!parsed.version || parsed.version < 2) {
      if (parsed.title === 'Navratri Special Offers') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_OFFER_CONFIG));
        return DEFAULT_OFFER_CONFIG;
      }
    }

    const specialOffers =
      Array.isArray(parsed.specialOffers) && parsed.specialOffers.length > 0
        ? parsed.specialOffers.map((sp) => ({
            ...sp,
            category: sp.category || (/husband|groom/i.test(sp.title + sp.desc) ? 'Grooming' : /nail|pedicure|manicure/i.test(sp.title + sp.desc) ? 'Nails' : /hair/i.test(sp.title + sp.desc) ? 'Hair' : 'Beauty'),
          }))
        : DEFAULT_SPECIAL_OFFERS;

    return {
      ...DEFAULT_OFFER_CONFIG,
      ...parsed,
      image: resolveOfferBannerImage(parsed.image),
      combos: Array.isArray(parsed.combos) && parsed.combos.length > 0 
        ? parsed.combos 
        : DEFAULT_OFFER_CONFIG.combos,
      tags: Array.isArray(parsed.tags) ? parsed.tags : DEFAULT_OFFER_CONFIG.tags,
      specialOffers: specialOffers,
    };
  } catch (e) {
    console.error('Failed to parse offer config:', e);
    return DEFAULT_OFFER_CONFIG;
  }
}

/**
 * Fetches the latest offers directly from Google Sheet ("Offers" tab).
 * Syncs with localStorage and broadcasts update event.
 */
export async function fetchOfferFromSpreadsheet() {
  const webhookUrl = getWebhookUrl();
  if (!isWebhookConfigured(webhookUrl)) return null;

  try {
    const url = `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}action=offers`;
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.title && Array.isArray(data.combos)) {
      const merged = {
        ...DEFAULT_OFFER_CONFIG,
        ...data,
        image: resolveOfferBannerImage(data.image),
        combos: data.combos.length > 0 ? data.combos : DEFAULT_OFFER_CONFIG.combos,
        tags: Array.isArray(data.tags) ? data.tags : DEFAULT_OFFER_CONFIG.tags,
        specialOffers: Array.isArray(data.specialOffers) && data.specialOffers.length > 0
          ? data.specialOffers
          : DEFAULT_OFFER_CONFIG.specialOffers,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('azora-offer-updated', { detail: merged }));
      return merged;
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch offers from Google Sheet:', err);
    return null;
  }
}

/**
 * Saves offer config and optional poster to Google Sheet ("Offers" tab) via Apps Script.
 */
export async function saveOfferToSpreadsheet(config, adminPin, base64Poster = null) {
  // Always persist locally first for instant reactivity
  saveOfferConfig(config);

  const webhookUrl = getWebhookUrl();
  if (!isWebhookConfigured(webhookUrl)) {
    return { success: true, localOnly: true, message: 'Saved locally in browser' };
  }

  try {
    let posterBase64 = base64Poster;
    let mimeType = 'image/jpeg';
    if (!posterBase64 && config.image && typeof config.image === 'string' && config.image.startsWith('data:image/')) {
      const match = config.image.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        posterBase64 = match[2];
      }
    }

    // Never save dev-only relative paths to Google Sheet
    let imageToSave = config.image || '';
    if (
      imageToSave === SITE_IMAGES.offers ||
      imageToSave.startsWith('/src/') ||
      imageToSave.startsWith('src/') ||
      imageToSave.includes('diwali-offers.jpg') ||
      imageToSave.includes('navratri-offers.jpg')
    ) {
      imageToSave = '';
    } else {
      imageToSave = resolveOfferBannerImage(imageToSave);
    }

    const payload = {
      formType: 'saveOffer',
      pin: adminPin,
      isActive: config.isActive !== false,
      title: config.title || '',
      badge: config.badge || '',
      desc: config.desc || '',
      dateRange: config.dateRange || '',
      tags: Array.isArray(config.tags) ? config.tags : [],
      image: imageToSave,
      combos: Array.isArray(config.combos) ? config.combos : [],
      specialOffers: Array.isArray(config.specialOffers) ? config.specialOffers : [],
      base64Poster: posterBase64 || undefined,
      mimeType: mimeType,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { success: false, error: 'Invalid response from Google Sheets webhook' };
    }

    if (parsed.status === 'success') {
      if (parsed.config) {
        saveOfferConfig(parsed.config);
      }
      return { success: true, message: 'Saved to Google Sheet successfully', config: parsed.config || config };
    }

    const rawError = parsed.error || parsed.message || 'Failed to save to Google Sheet';
    if (String(rawError).includes('Unsupported or missing formType')) {
      return {
        success: false,
        error: 'Apps Script needs to be updated. Open your Google Sheet → Extensions → Apps Script, paste the updated google-apps-script/Code.gs, and Deploy a New Version.',
      };
    }

    return { success: false, error: rawError };
  } catch (err) {
    console.error('Failed to save offers to Google Sheet:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Persists updated offer configuration and emits a broadcast event.
 */
export function saveOfferConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('azora-offer-updated', { detail: config }));
    return { success: true };
  } catch (e) {
    console.error('Failed to save offer config:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Resets offer configuration back to factory defaults.
 */
export function resetOfferConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('azora-offer-updated', { detail: DEFAULT_OFFER_CONFIG }));
    return { success: true, config: DEFAULT_OFFER_CONFIG };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Converts active offer combos into service items matching the booking modal structure.
 */
export function getOfferCombosAsServices() {
  const config = getOfferConfig();
  if (!config.isActive || !Array.isArray(config.combos)) return [];
  return config.combos.map((combo, idx) => ({
    id: combo.id || `offer-combo-${idx}-${(combo.name || 'deal').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: combo.name || combo.desc || 'Special Offer Combo',
    rawName: combo.name || combo.desc || 'Special Offer Combo',
    price: combo.numericPrice || parseInt(String(combo.price || '').replace(/[^0-9]/g, ''), 10) || 0,
    displayPrice: combo.price || 'Special Deal',
    category: 'offer',
    bookingCategory: 'Special Offers',
    duration: '60 mins',
    popular: true,
    desc: combo.desc || combo.name || '',
    isOffer: true,
  }));
}
