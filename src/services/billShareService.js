import { formatCurrency } from '../data/servicesCatalog';
import { captureElementAsBlob, downloadBlob } from './imageCaptureService';

export function formatWhatsAppPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function buildBillWhatsAppMessage(bill) {
  const serviceLines = bill.lineItems
    .map((item) => `• ${item.name} x${item.qty} — ${formatCurrency(item.qty * item.rate)}`)
    .join('\n');

  return [
    '*Azora Salon — Payment Bill*',
    '-------------------------',
    `*Bill No:* ${bill.billNo}`,
    `*Date:* ${bill.serviceDate}`,
    `*Client:* ${bill.clientName}`,
    bill.clientPhone ? `*Phone:* ${bill.clientPhone}` : null,
    bill.clientEmail ? `*Email:* ${bill.clientEmail}` : null,
    '',
    '*Services:*',
    serviceLines,
    '',
    `*Subtotal:* ${formatCurrency(bill.subtotal)}`,
    bill.discount > 0 ? `*Discount:* -${formatCurrency(bill.discount)}` : null,
    `*Total Payable:* ${formatCurrency(bill.total)}`,
    bill.notes?.trim() ? `\n*Notes:* ${bill.notes.trim()}` : null,
    '',
    'Thank you for visiting Azora. We look forward to seeing you again!',
  ]
    .filter(Boolean)
    .join('\n');
}

export function openWhatsAppChat(phone, message = '') {
  const formattedPhone = formatWhatsAppPhone(phone);
  const whatsappUrl = message?.trim()
    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${formattedPhone}`;
  window.open(whatsappUrl, '_blank');
}

/**
 * Shares only the bill image to the customer (no text caption).
 */
export async function shareBillToCustomer(receiptElement, phone, billNo) {
  if (!receiptElement) throw new Error('Bill element not found');
  if (!phone?.trim()) throw new Error('Customer phone number is required');

  const blob = await captureElementAsBlob(receiptElement);
  const filename = `azora-bill-${billNo}.png`;
  const file = new File([blob], filename, { type: 'image/png' });

  const shareData = { files: [file], title: `Azora Bill ${billNo}` };

  if (navigator.canShare?.(shareData)) {
    await navigator.share(shareData);
    return { method: 'native-share' };
  }

  downloadBlob(blob, filename);
  openWhatsAppChat(phone);
  return { method: 'download-and-whatsapp' };
}

export async function downloadBillImage(receiptElement, billNo) {
  const blob = await captureElementAsBlob(receiptElement);
  downloadBlob(blob, `azora-bill-${billNo}.png`);
}
