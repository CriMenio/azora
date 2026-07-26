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

export function openWhatsAppChat(phone, message, attachHint = false) {
  const formattedPhone = formatWhatsAppPhone(phone);
  const finalMessage = attachHint
    ? `${message}\n\n_Please attach the downloaded bill image before sending._`
    : message;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(finalMessage)}`;
  window.open(whatsappUrl, '_blank');
}

/**
 * Sends bill image + message to a customer's WhatsApp number.
 */
export async function shareBillToCustomer(receiptElement, message, phone, billNo) {
  if (!receiptElement) throw new Error('Bill element not found');
  if (!phone?.trim()) throw new Error('Customer phone number is required');

  const blob = await captureElementAsBlob(receiptElement);
  const filename = `azora-bill-${billNo}.png`;
  const file = new File([blob], filename, { type: 'image/png' });

  if (navigator.canShare?.({ files: [file], text: message })) {
    await navigator.share({
      files: [file],
      text: message,
      title: `Azora Bill ${billNo}`,
    });
    return { method: 'native-share' };
  }

  downloadBlob(blob, filename);
  openWhatsAppChat(phone, message, true);
  return { method: 'download-and-whatsapp' };
}

export async function downloadBillImage(receiptElement, billNo) {
  const blob = await captureElementAsBlob(receiptElement);
  downloadBlob(blob, `azora-bill-${billNo}.png`);
}
