export const BOOKING_CATEGORIES = [
  { key: 'Hair', label: 'Hair Care' },
  { key: 'Nails', label: 'Nails & Nail Art' },
  { key: 'Beauty', label: 'Beauty & Skin' },
  { key: 'Grooming', label: 'Grooming & Wellness' },
];

export const SERVICES_CATALOG = [
  {
    id: 'haircoloring',
    name: 'Rich Hair Color & Blow-Dry',
    price: 2500,
    category: 'hair',
    bookingCategory: 'Hair',
    duration: '120 mins',
    popular: true,
    desc: 'Deep burgundy or custom tones with layered finish and a glossy signature blow-dry.',
  },
  {
    id: 'blowdry',
    name: 'Signature Blow-Dry & Styling',
    price: 800,
    category: 'hair',
    bookingCategory: 'Hair',
    duration: '45 mins',
    popular: true,
    desc: 'Professional round-brush blow-dry with volume, shine, and layered styling.',
  },
  {
    id: 'haircut',
    name: 'Layered Haircut & Style',
    price: 500,
    category: 'hair',
    bookingCategory: 'Hair',
    duration: '45 mins',
    popular: true,
    desc: 'Precision cut with face-framing layers, wash, and finished styling.',
  },
  {
    id: 'hairspa',
    name: 'Nourishing Hair Spa',
    price: 1200,
    category: 'hair',
    bookingCategory: 'Hair',
    duration: '60 mins',
    desc: 'Deep conditioning mask and scalp massage for smooth, healthy hair.',
  },
  {
    id: 'manicure',
    name: 'Elegant French Manicure',
    price: 700,
    category: 'nails',
    bookingCategory: 'Nails',
    duration: '50 mins',
    popular: true,
    desc: 'Almond-shaped nails with nude base and precise French tips.',
  },
  {
    id: 'nailart',
    name: 'Creative Nail Art',
    price: 900,
    category: 'nails',
    bookingCategory: 'Nails',
    duration: '60 mins',
    popular: true,
    desc: 'Hand-painted colourful designs with bold patterns on each nail.',
  },
  {
    id: 'cateyenails',
    name: 'Cat-Eye Gel Manicure',
    price: 850,
    category: 'nails',
    bookingCategory: 'Nails',
    duration: '55 mins',
    popular: true,
    desc: 'Magnetic gel polish with a shimmering cat-eye finish and gold accents.',
  },
  {
    id: 'gelmanicure',
    name: 'Dual-Tone Gel Manicure',
    price: 800,
    category: 'nails',
    bookingCategory: 'Nails',
    duration: '50 mins',
    desc: 'Elegant almond nails with dual-tone gel and a premium glossy finish.',
  },
  {
    id: 'facial',
    name: 'Radiance Gold Facial',
    price: 1500,
    category: 'beauty',
    bookingCategory: 'Beauty',
    duration: '60 mins',
    desc: 'Deep cleansing, facial massage, and hydrating gold mask treatment.',
  },
  {
    id: 'waxing',
    name: 'Silk Touch Waxing (Full)',
    price: 1000,
    category: 'beauty',
    bookingCategory: 'Beauty',
    duration: '45 mins',
    desc: 'Gentle full-body waxing with soothing post-wax care.',
  },
  {
    id: 'threading',
    name: 'Precision Threading (Brows)',
    price: 150,
    category: 'beauty',
    bookingCategory: 'Beauty',
    duration: '15 mins',
    desc: 'Clean brow shaping and facial line definition.',
  },
  {
    id: 'pedicure',
    name: 'Restorative Pedicure',
    price: 800,
    category: 'grooming',
    bookingCategory: 'Grooming',
    duration: '50 mins',
    desc: 'Foot soak, scrub, nail care, and relaxing massage.',
  },
  {
    id: 'beardstyling',
    name: 'Beard Styling & Grooming',
    price: 300,
    category: 'grooming',
    bookingCategory: 'Grooming',
    duration: '30 mins',
    desc: 'Beard trim, shape, and hot-towel finish.',
  },
];

export function getBookingServices() {
  return [...SERVICES_CATALOG].sort((a, b) => {
    if (a.bookingCategory !== b.bookingCategory) {
      const order = BOOKING_CATEGORIES.map((c) => c.key);
      return order.indexOf(a.bookingCategory) - order.indexOf(b.bookingCategory);
    }
    if (Boolean(a.popular) !== Boolean(b.popular)) {
      return a.popular ? -1 : 1;
    }
    return 0;
  });
}

export function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}
