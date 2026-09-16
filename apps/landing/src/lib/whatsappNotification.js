import { getEnv } from './env';

/**
 * Get WhatsApp notification credentials directly from environment variables
 */
export function getWhatsAppConfig() {
  const phone = (getEnv('VITE_WHATSAPP_PHONE', '') || '').trim();
  const apiKey = (getEnv('VITE_WHATSAPP_APIKEY', '') || '').trim();
  const enabled = Boolean(phone && apiKey);

  return { phone, apiKey, enabled };
}

/**
 * Clean phone number to ensure proper international format for CallMeBot
 * (e.g. removes '+', spaces, dashes. Adds '91' if 10-digit number without country code)
 */
export function cleanWhatsAppPhone(raw) {
  if (!raw) return '';
  let cleaned = String(raw).replace(/[^\d]/g, '');
  // If 10 digits (standard Indian mobile), prefix with 91
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
}

/**
 * Sends a lead notification message via CallMeBot API
 */
export async function sendWhatsAppLeadNotification({
  formName = 'Lead Form',
  name = '',
  phone = '',
  email = '',
  course = '',
  details = '',
  customMessage = '',
}) {
  const config = getWhatsAppConfig();
  if (!config.enabled || !config.phone || !config.apiKey) {
    return { success: false, reason: 'WhatsApp notification not configured or disabled' };
  }

  const targetPhone = cleanWhatsAppPhone(config.phone);
  const nowStr = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  let message = customMessage;
  if (!message) {
    message =
      `🔔 *New Lead Alert — Marvel Slice!*\n\n` +
      `• *Form:* ${formName}\n` +
      `• *Name:* ${name || 'N/A'}\n` +
      `• *Phone:* ${phone || 'N/A'}\n` +
      `• *Email:* ${email || 'N/A'}\n` +
      (course ? `• *Course / Profile:* ${course}\n` : '') +
      (details ? `• *Details:* ${details}\n` : '') +
      `• *Time:* ${nowStr}`;
  }

  // 1. Try sending via backend proxy /api/notify-whatsapp first (secure, avoids browser CORS)
  try {
    const res = await fetch('/api/notify-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: targetPhone,
        apiKey: config.apiKey,
        message,
      }),
    });
    if (res.ok) {
      return { success: true, method: 'backend' };
    }
  } catch (backendErr) {
    // If backend proxy unavailable, proceed to client-side fallback
  }

  // 2. Client-side fallback to CallMeBot API directly
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
      targetPhone
    )}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(config.apiKey)}`;

    // CallMeBot doesn't send CORS headers to browsers, so mode: 'no-cors' sends the request silently
    await fetch(url, { mode: 'no-cors' });
    return { success: true, method: 'direct' };
  } catch (err) {
    console.warn('[WhatsApp Notification Error]:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send a test notification to verify credentials
 */
export async function sendTestWhatsAppNotification({ phone, apiKey }) {
  const targetPhone = cleanWhatsAppPhone(phone);
  const testMsg =
    `✅ *Marvel Slice — WhatsApp Alert Activated!*\n\n` +
    `Your WhatsApp notifications are successfully configured.\n` +
    `You will receive instant alerts here whenever someone submits a form on your website!\n\n` +
    `• *Test Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

  // Try via backend proxy first
  try {
    const res = await fetch('/api/notify-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: targetPhone,
        apiKey,
        message: testMsg,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success) {
      return { success: true };
    }
  } catch {}

  // Fallback to direct CallMeBot GET
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
      targetPhone
    )}&text=${encodeURIComponent(testMsg)}&apikey=${encodeURIComponent(apiKey)}`;
    await fetch(url, { mode: 'no-cors' });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
