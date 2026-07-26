import { syncLocalBillSequence } from './billNumberService';

function getWebhookUrl() {
  const url = import.meta.env.VITE_SPREADSHEET_WEBHOOK_URL;
  return url?.trim() || '';
}

function isWebhookConfigured(url) {
  return url && url !== 'YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL_HERE' && url.trim() !== '';
}

/**
 * POST to Google Apps Script and read the JSON response.
 * Uses text/plain to avoid CORS preflight issues with GAS web apps.
 */
async function postToSpreadsheet(data) {
  const webhookUrl = getWebhookUrl();

  if (!isWebhookConfigured(webhookUrl)) {
    return { success: false, error: 'Spreadsheet Webhook URL is not configured' };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(data),
    });

    const text = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { success: false, error: 'Invalid response from Google Sheet' };
    }

    if (parsed.status === 'success') {
      return { success: true, message: parsed.message };
    }

    if (parsed.error) {
      return { success: false, error: parsed.error };
    }

    return { success: false, error: parsed.message || 'Failed to save to Google Sheet' };
  } catch (error) {
    console.error('Failed to save data to spreadsheet:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Submits form data to the Google Sheets Webhook URL.
 * Supports Contact, Booking, Feedback, and Billing forms.
 */
export async function saveToSpreadsheet(data) {
  return postToSpreadsheet(data);
}

/**
 * Fetches the next sequential bill number (AZRYYYYMMDD###) from the Billing sheet.
 */
export async function getNextBillNumber(serviceDate) {
  const webhookUrl = getWebhookUrl();

  if (!isWebhookConfigured(webhookUrl)) {
    throw new Error('Spreadsheet webhook is not configured');
  }

  const dateParam = String(serviceDate).replace(/-/g, '');
  const url = `${webhookUrl}?action=nextBillNo&date=${encodeURIComponent(dateParam)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch bill number (HTTP ${response.status})`);
  }

  const data = await response.json();

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.nextBillNo) {
    throw new Error('Billing sheet did not return a bill number. Update your Google Apps Script.');
  }

  syncLocalBillSequence(data.nextBillNo);
  return data.nextBillNo;
}

/**
 * Saves a billing record to the Billing sheet in Google Sheets.
 */
export async function saveBillingToSpreadsheet(bill) {
  const payload = {
    formType: 'billing',
    billNo: bill.billNo,
    serviceDate: bill.serviceDate,
    clientName: bill.clientName,
    clientPhone: bill.clientPhone,
    clientEmail: bill.clientEmail || '',
    services: bill.lineItems.map((item) => `${item.name} x${item.qty} @ ${item.rate}`).join('; '),
    subtotal: bill.subtotal,
    discount: bill.discount,
    total: bill.total,
    notes: bill.notes || '',
    createdAt: new Date().toISOString(),
  };

  const result = await saveToSpreadsheet(payload);

  if (result.success) {
    syncLocalBillSequence(bill.billNo);
  }

  return result;
}

/**
 * Fetches dynamic testimonials from the Google Sheets Webapp.
 */
export async function getTestimonials() {
  const webhookUrl = getWebhookUrl();

  if (!isWebhookConfigured(webhookUrl)) {
    console.warn('Google Sheets Webhook URL is not configured. Falling back to default static testimonials.');
    return null;
  }

  try {
    const response = await fetch(`${webhookUrl}?action=testimonials`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (data && data.error) {
      console.error('Apps Script returned an error when fetching testimonials:', data.error);
      return null;
    }

    return Array.isArray(data) ? data : null;
  } catch (error) {
    console.error('Failed to fetch testimonials from spreadsheet webhook:', error);
    return null;
  }
}
