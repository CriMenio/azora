/** Bill number prefix and format: AZR + YYYYMMDD + 3-digit sequence (e.g. AZR20260726001) */
export const BILL_NUMBER_PREFIX = 'AZR';

export function toBillDateKey(serviceDate) {
  return String(serviceDate || '').replace(/-/g, '');
}

export function getBillNumberPrefix(serviceDate) {
  const dateKey = toBillDateKey(serviceDate);
  if (!/^\d{8}$/.test(dateKey)) {
    throw new Error('Invalid service date for bill number');
  }
  return `${BILL_NUMBER_PREFIX}${dateKey}`;
}

export function buildBillNumber(serviceDate, sequence) {
  const prefix = getBillNumberPrefix(serviceDate);
  return `${prefix}${String(sequence).padStart(3, '0')}`;
}

export function parseBillNumber(billNo) {
  const match = String(billNo || '').match(/^AZR(\d{8})(\d{3})$/);
  if (!match) return null;
  return {
    dateKey: match[1],
    sequence: parseInt(match[2], 10),
    serviceDate: `${match[1].slice(0, 4)}-${match[1].slice(4, 6)}-${match[1].slice(6, 8)}`,
  };
}

/**
 * Client-side fallback when sheet lookup is unavailable.
 * Uses localStorage to keep sequence per day.
 */
export function getLocalNextBillNumber(serviceDate) {
  const prefix = getBillNumberPrefix(serviceDate);
  const storageKey = `azora_bill_seq_${prefix}`;
  const current = parseInt(localStorage.getItem(storageKey) || '0', 10);
  const next = current + 1;
  localStorage.setItem(storageKey, String(next));
  return buildBillNumber(serviceDate, next);
}

export function syncLocalBillSequence(billNo) {
  const parsed = parseBillNumber(billNo);
  if (!parsed) return;
  const prefix = `${BILL_NUMBER_PREFIX}${parsed.dateKey}`;
  const storageKey = `azora_bill_seq_${prefix}`;
  const current = parseInt(localStorage.getItem(storageKey) || '0', 10);
  if (parsed.sequence > current) {
    localStorage.setItem(storageKey, String(parsed.sequence));
  }
}
