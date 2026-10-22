/**
 * Billing History Service
 * -----------------------
 * Tracks billing records locally and provides quick access to
 * invoice counts, recent bills, and billed amounts.
 */

const BILLS_STORAGE_KEY = 'azora_local_bills';

export const INITIAL_BILLS = [
  {
    billNo: 'AZR20261022001',
    clientName: 'Priya Sharma',
    clientPhone: '9820123456',
    clientEmail: 'priya.sharma@example.com',
    serviceDate: '2026-10-22',
    lineItems: [
      { id: 'item-1', name: 'Hydra Glow Facial', qty: 1, rate: 2499 },
      { id: 'item-2', name: 'Blowdry & Styling', qty: 1, rate: 799 },
    ],
    subtotal: 3298,
    discount: 300,
    total: 2998,
    notes: 'Preferred warm towel soothing finish.',
    createdAt: '2026-10-22T10:15:00.000Z',
  },
  {
    billNo: 'AZR20261021002',
    clientName: 'Vaishali Jadhav',
    clientPhone: '9769345678',
    clientEmail: '',
    serviceDate: '2026-10-21',
    lineItems: [
      { id: 'item-3', name: 'Navratri Beauty Combo', qty: 1, rate: 1999 },
      { id: 'item-4', name: 'Cat-Eye Gel Nails', qty: 1, rate: 1499 },
    ],
    subtotal: 3498,
    discount: 200,
    total: 3298,
    notes: 'Delicate cuticles, magnetic plum gel.',
    createdAt: '2026-10-21T15:30:00.000Z',
  },
  {
    billNo: 'AZR20261020001',
    clientName: 'Rahul Patel',
    clientPhone: '9892554321',
    clientEmail: 'rahul.patel@workmail.com',
    serviceDate: '2026-10-20',
    lineItems: [
      { id: 'item-5', name: 'Men’s Scissor Haircut', qty: 1, rate: 650 },
      { id: 'item-6', name: 'D-Tan Clean-Up', qty: 1, rate: 850 },
    ],
    subtotal: 1500,
    discount: 100,
    total: 1400,
    notes: 'Scissor cut only, no machine fade.',
    createdAt: '2026-10-20T16:20:00.000Z',
  },
  {
    billNo: 'AZR20261019001',
    clientName: 'Neha Kulkarni',
    clientPhone: '9833445566',
    clientEmail: 'neha.k@gmail.com',
    serviceDate: '2026-10-19',
    lineItems: [
      { id: 'item-7', name: 'Balayage Hair Color & Gloss', qty: 1, rate: 4500 },
      { id: 'item-8', name: 'Moroccan Oil Hair Spa', qty: 1, rate: 1800 },
    ],
    subtotal: 6300,
    discount: 500,
    total: 5800,
    notes: 'Warm honey blonde balayage with Olaplex.',
    createdAt: '2026-10-19T14:45:00.000Z',
  },
];

export function getLocalBills() {
  try {
    const raw = localStorage.getItem(BILLS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(INITIAL_BILLS));
      return INITIAL_BILLS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_BILLS;
  } catch (err) {
    console.error('Failed to parse billing history from storage:', err);
    return INITIAL_BILLS;
  }
}

export function saveLocalBill(billData) {
  try {
    const current = getLocalBills();
    // Check if bill with this billNo already exists
    const exists = current.some((b) => b.billNo === billData.billNo);
    let updated;
    if (exists) {
      updated = current.map((b) => (b.billNo === billData.billNo ? { ...b, ...billData } : b));
    } else {
      updated = [billData, ...current];
    }
    localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('azora-billing-updated', { detail: updated }));
    return { success: true, bills: updated };
  } catch (err) {
    console.error('Failed to save local bill:', err);
    return { success: false, error: err.message };
  }
}

export function deleteLocalBill(billNo) {
  try {
    const current = getLocalBills();
    const updated = current.filter((b) => b.billNo !== billNo);
    localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('azora-billing-updated', { detail: updated }));
    return { success: true, bills: updated };
  } catch (err) {
    console.error('Failed to delete local bill:', err);
    return { success: false, error: err.message };
  }
}
