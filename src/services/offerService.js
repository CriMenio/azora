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
