import { toBlob } from 'html-to-image';
import html2canvas from 'html2canvas';

const CAPTURE_OPTIONS = {
  cacheBust: true,
  pixelRatio: 2,
  skipFonts: true,
};

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Failed to create image blob'));
      },
      'image/png',
      1
    );
  });
}

/**
 * Captures a DOM element as PNG blob. Tries html-to-image first, then html2canvas.
 */
export async function captureElementAsBlob(element, customOptions = {}) {
  if (!element) {
    throw new Error('Element not found');
  }

  const width = element.offsetWidth || element.scrollWidth;
  const height = element.offsetHeight || element.scrollHeight;

  if (!width || !height) {
    throw new Error('Receipt preview is not visible.');
  }

  let bg = customOptions.backgroundColor;
  if (!bg) {
    try {
      const computed = window.getComputedStyle(element).backgroundColor;
      if (computed && computed !== 'transparent' && computed !== 'rgba(0, 0, 0, 0)') {
        bg = computed;
      }
    } catch {
      // fallback
    }
  }
  if (!bg) {
    bg = '#141414';
  }

  const captureOptions = {
    ...CAPTURE_OPTIONS,
    backgroundColor: bg,
    width,
    height,
    ...customOptions,
    style: {
      transform: 'none',
      boxShadow: 'none',
      overflow: 'visible',
      backgroundColor: bg,
      ...(customOptions.style || {}),
    },
  };

  try {
    const blob = await toBlob(element, captureOptions);
    if (blob) return blob;
  } catch (error) {
    console.warn('html-to-image capture failed, falling back to html2canvas:', error);
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: bg,
      useCORS: true,
      logging: false,
      allowTaint: false,
      foreignObjectRendering: false,
      width,
      height,
    });

    try {
      return await canvasToBlob(canvas);
    } catch {
      return dataUrlToBlob(canvas.toDataURL('image/png'));
    }
  } catch (error) {
    console.error('html2canvas capture failed:', error);
    throw new Error('Unable to capture slip image. Please try again.');
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
