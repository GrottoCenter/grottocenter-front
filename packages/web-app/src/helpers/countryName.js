const cache = {};
const getDisplayNames = locale => {
  if (!cache[locale]) {
    cache[locale] = new Intl.DisplayNames([locale, 'en'], { type: 'region' });
  }
  return cache[locale];
};

const getLocalizedCountryName = (iso2, locale, fallback = '') => {
  if (!iso2) return fallback;
  try {
    return getDisplayNames(locale).of(iso2.toUpperCase()) || fallback;
  } catch {
    return fallback;
  }
};

export default getLocalizedCountryName;
