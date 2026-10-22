/**
 * Customer Directory & CRM Service
 * --------------------------------
 * Manages client profiles, addresses, services availed, references,
 * makeover images, reviews/feedback, and stylist remarks.
 */

const STORAGE_KEY = 'azora_customer_directory';

export const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    fullName: 'Ananya Mehta',
    phone: '9820123456',
    email: 'ananya.mehta@example.com',
    address: 'Flat 402, Skyline Residency, Sector 8, Kamothe',
    service: 'Bridal Makeover Suite & Hydra Glow Facial',
    reference: 'Instagram',
    visitDate: '2026-10-18',
    rating: 5,
    feedback: 'Preeti did my bridal makeup and it was absolutely stunning! She was gentle, patient, and understood my exact look. Everyone gave compliments!',
    remarks: 'Skin is sensitive to glycolic acid. Used O3+ botanical pack with excellent glow. Preferred warm copper balayage dimension.',
    images: [],
    createdAt: '2026-10-18T11:30:00.000Z',
    updatedAt: '2026-10-18T11:30:00.000Z',
  },
  {
    id: 'cust-2',
    fullName: 'Vaishali Jadhav',
    phone: '9769345678',
    email: '',
    address: 'Plot 12, Sector 19, Kamothe, Navi Mumbai',
    service: 'Navratri Beauty Combo & Cat-Eye Gel Nails',
    reference: 'Friend / Family Referral',
    visitDate: '2026-10-20',
    rating: 5,
    feedback: 'Loved the nail art and the relaxing pedicure! The salon is very clean, hygienic, and peaceful. Will definitely come back regularly.',
    remarks: 'Cuticles are delicate. Used gentle almond soak and magnetic plum gel finish. Follow-up booked for hair spa next month.',
    images: [],
    createdAt: '2026-10-20T14:15:00.000Z',
    updatedAt: '2026-10-20T14:15:00.000Z',
  },
  {
    id: 'cust-3',
    fullName: 'Rahul Patel',
    phone: '9892554321',
    email: 'rahul.patel@workmail.com',
    address: 'Gharonda Complex, Sector 9, Kamothe',
    service: 'Men’s Scissor Haircut & D-Tan Clean-Up',
    reference: 'Google Search / Maps',
    visitDate: '2026-10-21',
    rating: 5,
    feedback: 'Top-tier grooming! Preeti has great styling sense. Very hygienic environment and prompt service.',
    remarks: 'Prefers classic scissor contouring rather than machine fade. Regular monthly grooming client.',
    images: [],
    createdAt: '2026-10-21T16:00:00.000Z',
    updatedAt: '2026-10-21T16:00:00.000Z',
  },
];

/**
 * Compresses an uploaded image file using Canvas to a reasonable size
 * and returns a lightweight base64 data URI string.
 */
export function compressCustomerImage(file, maxDimension = 1000, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Returns all saved customer profiles from localStorage.
 */
export function getCustomers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CUSTOMERS));
      return INITIAL_CUSTOMERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_CUSTOMERS;
  } catch (err) {
    console.error('Failed to parse customers from storage:', err);
    return INITIAL_CUSTOMERS;
  }
}

import {
  saveCustomerToSpreadsheet,
  deleteCustomerFromSpreadsheet,
  fetchCustomersFromSpreadsheet,
} from './spreadsheetService';

/**
 * Creates or updates a customer profile.
 * Saves locally immediately and asynchronously syncs to Google Sheets (Customers tab).
 */
export async function saveCustomer(customerData, adminPin) {
  try {
    const currentList = getCustomers();
    const now = new Date().toISOString();
    let updatedList;
    let savedRecord;

    if (customerData.id) {
      // Update existing
      updatedList = currentList.map((c) => {
        if (c.id === customerData.id) {
          savedRecord = {
            ...c,
            ...customerData,
            updatedAt: now,
          };
          return savedRecord;
        }
        return c;
      });
    } else {
      // Add new
      savedRecord = {
        id: `cust-${Date.now()}`,
        ...customerData,
        images: Array.isArray(customerData.images) ? customerData.images : [],
        createdAt: now,
        updatedAt: now,
      };
      updatedList = [savedRecord, ...currentList];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent('azora-customers-updated', { detail: updatedList }));

    let sheetResult = null;
    if (adminPin) {
      try {
        sheetResult = await saveCustomerToSpreadsheet(savedRecord, adminPin);
      } catch (sheetErr) {
        console.warn('Sheet sync for customer save noticed:', sheetErr);
      }
    }

    return { success: true, customer: savedRecord, customers: updatedList, sheetResult };
  } catch (err) {
    console.error('Failed to save customer:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Deletes a customer profile by ID.
 * Removes locally and synchronizes deletion with Google Sheets.
 */
export async function deleteCustomer(customerId, adminPin) {
  try {
    const currentList = getCustomers();
    const updatedList = currentList.filter((c) => c.id !== customerId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent('azora-customers-updated', { detail: updatedList }));

    if (adminPin) {
      try {
        await deleteCustomerFromSpreadsheet(customerId, adminPin);
      } catch (sheetErr) {
        console.warn('Sheet sync for customer deletion noticed:', sheetErr);
      }
    }

    return { success: true, customers: updatedList };
  } catch (err) {
    console.error('Failed to delete customer:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetches latest customer records from Google Sheet and merges with local storage.
 */
export async function syncCustomersWithSheet(adminPin) {
  if (!adminPin) return getCustomers();
  try {
    const sheetData = await fetchCustomersFromSpreadsheet(adminPin);
    if (Array.isArray(sheetData) && sheetData.length > 0) {
      // Merge unique by customer ID or phone
      const localList = getCustomers();
      const map = new Map();

      // Sheet is master
      sheetData.forEach((c) => {
        if (c.id) map.set(c.id, c);
        else if (c.phone) map.set(c.phone, c);
      });

      // Keep any local records not yet synced
      localList.forEach((c) => {
        if (c.id && !map.has(c.id)) {
          map.set(c.id, c);
        }
      });

      const merged = Array.from(map.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('azora-customers-updated', { detail: merged }));
      return merged;
    }
  } catch (err) {
    console.warn('Could not sync customers with sheet:', err);
  }
  return getCustomers();
}


/**
 * Searches and filters customers by query across name, phone, address, service, or remarks.
 */
export function filterCustomers(customers, query, filterCategory = 'all') {
  if (!Array.isArray(customers)) return [];
  const q = String(query || '').toLowerCase().trim();

  return customers.filter((c) => {
    // Category filter
    if (filterCategory === '5star' && c.rating !== 5) return false;
    if (filterCategory === 'hasImages' && (!Array.isArray(c.images) || c.images.length === 0)) return false;
    if (filterCategory === 'hasFeedback' && (!c.feedback || !c.feedback.trim())) return false;

    // Search query
    if (!q) return true;
    return (
      (c.fullName && c.fullName.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.service && c.service.toLowerCase().includes(q)) ||
      (c.reference && c.reference.toLowerCase().includes(q)) ||
      (c.remarks && c.remarks.toLowerCase().includes(q)) ||
      (c.feedback && c.feedback.toLowerCase().includes(q))
    );
  });
}
