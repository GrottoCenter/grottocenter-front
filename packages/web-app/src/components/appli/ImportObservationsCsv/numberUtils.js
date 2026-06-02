/**
 * Normalize a raw string value to a JavaScript number, handling locale-specific
 * decimal and thousands separators.
 *
 * @param {string} raw - The raw string from the CSV cell
 * @param {string} locale - 'en' or 'fr'
 * @returns {number|null} - Parsed number or null if invalid
 */
export const normalizeNumber = (raw, locale = 'en') => {
  if (raw == null || raw.trim() === '') return null;
  const trimmed = raw.trim();

  let normalized;
  if (locale === 'fr') {
    // French: spaces are thousands separators, comma is decimal
    normalized = trimmed
      .replace(/[\s\u00A0]/g, '') // remove spaces and non-breaking spaces
      .replace(/\./g, '') // remove dot thousands separators
      .replace(',', '.'); // replace comma decimal with dot
  } else {
    // English: commas are thousands separators, dot is decimal
    normalized = trimmed.replace(/,/g, '');
  }

  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
};

/**
 * Convert a display-unit value to SI using the quantity kind's conversion factors.
 * SI = (displayValue - offset) / factor
 *
 * For Temperature: displayValue is °C, SI is K
 *   K = (°C - (-273.15)) / 1 = °C + 273.15
 *
 * For RelativeHumidity: displayValue is %, SI is fraction
 *   fraction = (% - 0) / 100
 *
 * @param {number} displayValue - Value in the display unit
 * @param {object} quantityKind - Quantity kind object with siToDisplayFactor and siToDisplayOffset
 * @returns {number} - Value in SI units
 */
export const toSI = (displayValue, quantityKind) => {
  const { siToDisplayFactor, siToDisplayOffset } = quantityKind;
  // displayValue = siValue * factor + offset
  // => siValue = (displayValue - offset) / factor
  return (displayValue - siToDisplayOffset) / siToDisplayFactor;
};
