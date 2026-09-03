/**
 * Utility functions for Indian phone number parsing and formatting (5-5 split format).
 * E.g., "+91 63809 57390", "+91 80882 18609".
 */

/**
 * Formats a phone number into "+91 XXXXX XXXXX" (5-5 digit split)
 * Handles raw 10 digits, +91 prefixed, 0 prefixed, or custom strings.
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  const str = String(phone).trim();
  if (!str) return '';

  // Extract all digit characters
  const digits = str.replace(/\D/g, '');

  // If 12 digits starting with '91' (e.g., 916380957390)
  if (digits.length === 12 && digits.startsWith('91')) {
    const p1 = digits.slice(2, 7);
    const p2 = digits.slice(7, 12);
    return `+91 ${p1} ${p2}`;
  }

  // If 11 digits starting with '0' (e.g., 06380957390)
  if (digits.length === 11 && digits.startsWith('0')) {
    const p1 = digits.slice(1, 6);
    const p2 = digits.slice(6, 11);
    return `+91 ${p1} ${p2}`;
  }

  // If exactly 10 digits (e.g., 6380957390)
  if (digits.length === 10) {
    const p1 = digits.slice(0, 5);
    const p2 = digits.slice(5, 10);
    return `+91 ${p1} ${p2}`;
  }

  // If 10+ digits with non-standard prefix
  if (digits.length > 10) {
    const main10 = digits.slice(-10);
    const p1 = main10.slice(0, 5);
    const p2 = main10.slice(5, 10);
    return `+91 ${p1} ${p2}`;
  }

  // If less than 10 digits but at least 6 digits, split into 2 equal parts
  if (digits.length >= 6) {
    const mid = Math.ceil(digits.length / 2);
    return `+91 ${digits.slice(0, mid)} ${digits.slice(mid)}`;
  }

  return str;
}

/**
 * Splits a phone string by delimiters (',', '/', '|', '\n') and formats each number.
 */
export function extractPhoneNumbers(phoneStr) {
  if (!phoneStr) return [];
  const parts = String(phoneStr)
    .split(/[,/|\n]+/)
    .map(p => p.trim())
    .filter(Boolean);

  return parts.map(formatPhoneNumber).filter(Boolean);
}

/**
 * Cleans phone number for href tel: protocol (e.g. "tel:+916380957390")
 */
export function cleanTelHref(phone) {
  if (!phone) return '#';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `tel:+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `tel:+${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `tel:+91${digits.slice(1)}`;
  return `tel:+91${digits.slice(-10)}`;
}
