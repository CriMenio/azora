import { SITE_IMAGES } from '../assets/siteImages';

const STORAGE_KEY = 'azora_offer_config';

export const DEFAULT_OFFER_CONFIG = {
  isActive: true,
  title: 'Navratri Special Offers',
  badge: 'Festive Celebration Deals',
  desc: 'Look Good · Feel Good · Celebrate You! Exclusive festive beauty combos, hair rituals, and luxury grooming packages at special celebration rates.',
  dateRange: '7th Oct – 25th Oct',
  tags: ['On Any Facial — D-Tan FREE', 'Hygienic & Safe', 'Expert Stylists'],
  image: SITE_IMAGES.offers,
  combos: [
    {
      id: 'offer-garba-glow',
      name: 'Garba Glow Combo',
      price: '₹699',
      numericPrice: 699,
      category: 'Beauty',
      desc: 'Cleanup + Full Hand Wax + Eyebrows + Upper Lip + Forehead',
    },
    {
      id: 'offer-beauty-combo',
      name: 'Navratri Beauty Combo',
      price: '₹1,499',
      numericPrice: 1499,
      category: 'Beauty',
      desc: 'Fruit Facial + Full Hand Wax + Half Leg Wax + Underarms',
    },
    {
      id: 'offer-hydra-glow',
      name: 'Navratri Hydra Glow',
      price: '₹1,699',
      numericPrice: 1699,
      category: 'Beauty',
      desc: 'Hydra Facial + D-Tan + Full Hand Wax + Half Leg Wax',
    },
    {
      id: 'offer-dandiya-nails',
      name: 'Dandiya Nails Special',
      price: '₹699',
      numericPrice: 699,
      category: 'Nails',
      desc: 'Gel Polish Hands + Gel Polish Feet + 2-Finger Nail Art',
    },
    {
      id: 'offer-hair-treatments',
      name: 'Festive Hair Treatments',
      price: 'From ₹499',
      numericPrice: 499,
      category: 'Hair',
      desc: 'Smoothening, Hair Botox, Global Color & Festive Makeovers',
    },
    {
      id: 'offer-mens-grooming',
      name: 'Men’s Festive Grooming',
      price: 'From ₹249',
      numericPrice: 249,
      category: 'Grooming',
      desc: 'Haircut + Beard, Grooming Combos & Clean Up + D-Tan',
    },
  ],
};

function getWebhookUrl() {
  const url = import.meta.env.VITE_SPREADSHEET_WEBHOOK_URL;
  return url?.trim() || '';
}

function isWebhookConfigured(url) {
  return url && url !== 'YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL_HERE' && url.trim() !== '';
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
    return {
      ...DEFAULT_OFFER_CONFIG,
      ...parsed,
      combos: Array.isArray(parsed.combos) && parsed.combos.length > 0 
        ? parsed.combos 
        : DEFAULT_OFFER_CONFIG.combos,
      tags: Array.isArray(parsed.tags) ? parsed.tags : DEFAULT_OFFER_CONFIG.tags,
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
        combos: data.combos.length > 0 ? data.combos : DEFAULT_OFFER_CONFIG.combos,
        tags: Array.isArray(data.tags) ? data.tags : DEFAULT_OFFER_CONFIG.tags,
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

    const payload = {
      formType: 'saveOffer',
      pin: adminPin,
      isActive: config.isActive !== false,
      title: config.title || '',
      badge: config.badge || '',
      desc: config.desc || '',
      dateRange: config.dateRange || '',
      tags: Array.isArray(config.tags) ? config.tags : [],
      image: config.image || '',
      combos: Array.isArray(config.combos) ? config.combos : [],
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
  return config.combos.map((combo) => ({
    id: combo.id,
    name: `${combo.name} (${combo.price})`,
    rawName: combo.name,
    price: combo.numericPrice || 0,
    displayPrice: combo.price,
    category: 'offer',
    bookingCategory: 'Special Offers',
    duration: '60 mins',
    popular: true,
    desc: combo.desc || '',
    isOffer: true,
  }));
}
