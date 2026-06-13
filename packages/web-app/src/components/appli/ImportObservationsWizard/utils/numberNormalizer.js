/**
 * Normalizes a locale-specific numeric string to a JavaScript number.
 *
 * @param {string} raw - The raw numeric string from the CSV cell
 * @param {'en' | 'fr'} locale - The number locale convention
 * @returns {number | null} - The parsed number, or null if invalid/empty
 */
export const normalizeNumber = (raw, locale) => {
  if (raw == null || raw.trim() === '') {
    return null;
  }

  let cleaned;

  if (locale === 'en') {
    // Dot decimal: commas are thousands separators
    cleaned = raw.replace(/,/g, '');
  } else {
    // Comma decimal (e.g. fr): dots and spaces are thousands separators,
    // comma is the decimal separator. Only one comma should exist in a valid
    // number — intentionally replacing only the first occurrence (no `g` flag).
    cleaned = raw.replace(/[.\s]/g, '').replace(/,/, '.');
  }

  const result = parseFloat(cleaned);

  if (!Number.isFinite(result)) {
    return null;
  }

  return result;
};
