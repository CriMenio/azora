/**
 * Submits form data to the Google Sheets Webhook URL.
 * Supports both Contact Inquiries and Appointment Bookings.
 * 
 * @param {Object} data - The payload to send (must contain 'formType')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveToSpreadsheet(data) {
  const webhookUrl = import.meta.env.VITE_SPREADSHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbxLObZR6FDA1BmUBWxr3r1DyTyTWT3KYJCCi9skdKMC2Jsr-6FxHLrKzIdXMsRO2FTL/exec';
  
  if (!webhookUrl || webhookUrl === 'YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL_HERE' || webhookUrl.trim() === '') {
    console.warn('Google Sheets Webhook URL is not configured. Form data will not be saved to spreadsheet:', data);
    return { success: false, error: 'Spreadsheet Webhook URL is not configured' };
  }

  try {
    // We use mode: 'no-cors' since Google Apps Script redirects requests
    // and browser security would block standard CORS responses on the client side.
    // 'no-cors' ensures the POST request reaches Google Sheets successfully.
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to save data to spreadsheet:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches dynamic testimonials from the Google Sheets Webapp.
 * 
 * @returns {Promise<Array<{name: string, role: string, quote: string, stars: number, avatar: string}> | null>}
 */
export async function getTestimonials() {
  const webhookUrl = import.meta.env.VITE_SPREADSHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbxLObZR6FDA1BmUBWxr3r1DyTyTWT3KYJCCi9skdKMC2Jsr-6FxHLrKzIdXMsRO2FTL/exec';
  
  if (!webhookUrl || webhookUrl === 'YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL_HERE' || webhookUrl.trim() === '') {
    console.warn('Google Sheets Webhook URL is not configured. Falling back to default static testimonials.');
    return null;
  }

  try {
    const response = await fetch(webhookUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Check if the response contains an error object returned by Apps Script
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

