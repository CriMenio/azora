import { captureElementAsBlob, downloadBlob } from './imageCaptureService';

const WHATSAPP_NUMBER = '917021929588';

export function buildBookingWhatsAppMessage({
  bookingNo,
  name,
  phone,
  email,
  services,
  stylist,
  date,
  timeSlot,
  notes,
}) {
  return [
    '*New Appointment Booking*',
    '-------------------------',
    `*Appointment ID:* ${bookingNo}`,
    `*Client Name:* ${name}`,
    `*Phone:* ${phone}`,
    `*Email:* ${email}`,
    `*Services:* ${services}`,
    `*Stylist:* ${stylist}`,
    `*Date:* ${date}`,
    `*Time Slot:* ${timeSlot}`,
    notes?.trim() ? `*Notes:* ${notes.trim()}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

function openWhatsApp(message, attachHint = false) {
  const finalMessage = attachHint
    ? `${message}\n\n_Please attach the downloaded receipt image before sending._`
    : message;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(finalMessage)}`;
  window.open(whatsappUrl, '_blank');
}

/**
 * Captures a receipt element as PNG and shares via Web Share API or download + WhatsApp.
 */
export async function shareReceiptToWhatsApp(receiptElement, message, bookingNo) {
  if (!receiptElement) {
    throw new Error('Receipt element not found');
  }

  const blob = await captureElementAsBlob(receiptElement, {
    backgroundColor: '#141414',
  });
  const filename = `azora-appointment-${bookingNo}.png`;
  const file = new File([blob], filename, { type: 'image/png' });

  if (navigator.canShare?.({ files: [file], text: message })) {
    await navigator.share({
      files: [file],
      text: message,
      title: `Azora Appointment ${bookingNo}`,
    });
    return { method: 'native-share' };
  }

  downloadBlob(blob, filename);
  openWhatsApp(message, true);
  return { method: 'download-and-whatsapp' };
}
