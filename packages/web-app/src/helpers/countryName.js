/**
 * Get the localized country name using the translation framework
 * @param {Object} country - Country object from API
 * @param {Function} formatMessage - React Intl formatMessage function
 * @param {string} locale - Current locale (e.g., 'en', 'fr', 'es')
 * @param {string} fallback - Fallback name if translation not found
 * @returns {string} Localized country name
 */
const getLocalizedCountryName = (country, formatMessage, locale, fallback = '') => {
  if (!country) return fallback;

  // Handle simplified country object (e.g., from subscriptions API)
  if (country.name && !country.enName && !country.nativeName) {
    return formatMessage({ id: country.name, defaultMessage: country.name });
  }

  const translationKey = country.enName && country.enName !== '?' ? country.enName : country.en_name || country.nativeName;
  if (!translationKey) return fallback;

  const langName = country[`${locale}Name`] || country[`${locale}_name`];
  const defaultMessage = langName && langName !== '?' ? langName : translationKey;

  return formatMessage({ id: translationKey, defaultMessage });
};

export default getLocalizedCountryName;
