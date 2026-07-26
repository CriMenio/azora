export const SERVICES_CATALOG = [
  { id: 'haircut', name: 'Artisanal Hair Cut', price: 500, category: 'hair' },
  { id: 'hairspa', name: 'Nourishing Hair Spa', price: 1200, category: 'hair' },
  { id: 'haircoloring', name: 'Balayage & Hair Coloring', price: 2500, category: 'hair' },
  { id: 'facial', name: 'Radiance Gold Facial', price: 1500, category: 'beauty' },
  { id: 'waxing', name: 'Silk Touch Waxing (Full)', price: 1000, category: 'beauty' },
  { id: 'threading', name: 'Precision Threading (Brows)', price: 150, category: 'beauty' },
  { id: 'beardstyling', name: 'Classic Beard Styling & Shave', price: 300, category: 'grooming' },
  { id: 'manicure', name: 'Azora Signature Manicure', price: 600, category: 'grooming' },
  { id: 'pedicure', name: 'Restorative Pedicure Ritual', price: 800, category: 'grooming' },
];

export function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}
