/**
 * Gallery Service
 * ---------------
 * Handles uploading images to Google Drive via Apps Script webhook
 * and fetching dynamic gallery items stored in Google Sheets.
 */

function getWebhookUrl() {
  const url = import.meta.env.VITE_SPREADSHEET_WEBHOOK_URL;
  return url?.trim() || '';
}

function isWebhookConfigured(url) {
  return url && url !== 'YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL_HERE' && url.trim() !== '';
}

/**
 * Compress an image File using Canvas and return raw base64 (no data URL prefix).
 * Max dimension: 1200px. Output: JPEG at 80% quality.
 * This keeps the base64 payload well under Apps Script's body size limits.
 */
function compressImage(file, maxDimension = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Scale down if needed
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

      // Get base64 without the data URL prefix
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });
}


/**
 * Uploads an image file to Google Drive via Apps Script.
 * Returns { success, url, fileId, error }
 */
export async function uploadGalleryImage({ file, title, desc, type, adminPin }) {
  const webhookUrl = getWebhookUrl();
  if (!isWebhookConfigured(webhookUrl)) {
    return { success: false, error: 'Spreadsheet Webhook URL is not configured' };
  }

  try {
    // Compress before encoding — keeps base64 payload small enough for Apps Script
    const base64Data = await compressImage(file);

    const payload = {
      formType: 'galleryUpload',
      pin: adminPin,
      fileName: file.name.replace(/\.[^.]+$/, '') + '.jpg',
      mimeType: 'image/jpeg', // canvas always outputs JPEG
      base64Data,
      title: title || file.name,
      desc: desc || '',
      type: type || 'hair',
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { success: false, error: 'Invalid response from Google Apps Script' };
    }

    if (parsed.status === 'success' && parsed.url) {
      return { success: true, url: parsed.url, fileId: parsed.fileId };
    }

    return { success: false, error: parsed.error || parsed.message || 'Upload failed' };
  } catch (error) {
    console.error('Gallery upload failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Returns a robust, publicly accessible thumbnail URL for Google Drive files
 * that bypasses Google hotlinking and referrer blocks.
 */
export function getDriveImageUrl(image, fileId, size = 1200) {
  if (!image && !fileId) return '';
  const resolvedId = fileId || image?.match(/\/d\/([^/?#]+)/)?.[1] || image?.match(/[?&]id=([^&#]+)/)?.[1];
  if (resolvedId) {
    return `https://drive.google.com/thumbnail?id=${resolvedId}&sz=w${size}`;
  }
  return image || '';
}

/**
 * Fetches all gallery items from the Gallery sheet.
 * Returns an array of { id, type, title, desc, image, fileId, uploadedAt }
 */
export async function fetchGalleryItems() {
  const webhookUrl = getWebhookUrl();
  if (!isWebhookConfigured(webhookUrl)) {
    return [];
  }

  try {
    const response = await fetch(`${webhookUrl}?action=gallery`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];
    return data.map((item) => {
      const fileId = item.fileId || item.image?.match(/\/d\/([^/?#]+)/)?.[1] || '';
      return {
        ...item,
        fileId,
        image: getDriveImageUrl(item.image, fileId, 1200),
        rawImage: item.image,
      };
    });
  } catch (error) {
    console.error('Failed to fetch gallery items:', error);
    return [];
  }
}

/**
 * Deletes a gallery image from Drive and removes from Gallery sheet.
 * Returns { success, error }
 */
export async function deleteGalleryImage({ fileId, rowIndex, adminPin }) {
  const webhookUrl = getWebhookUrl();
  if (!isWebhookConfigured(webhookUrl)) {
    return { success: false, error: 'Spreadsheet Webhook URL is not configured' };
  }

  try {
    const payload = {
      formType: 'galleryDelete',
      pin: adminPin,
      fileId,
      rowIndex,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { success: false, error: 'Invalid response from Google Apps Script' };
    }

    if (parsed.status === 'success') {
      return { success: true };
    }

    return { success: false, error: parsed.error || parsed.message || 'Delete failed' };
  } catch (error) {
    console.error('Gallery delete failed:', error);
    return { success: false, error: error.message };
  }
}
