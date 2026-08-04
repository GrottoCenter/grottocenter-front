import { AVAILABLE_LANGUAGES } from '../conf/config';

// "fr" → "fra"  (ISO 639-1 locale → ISO 639-3 language ID stored in DB)
export const localeToLanguageId = locale =>
  AVAILABLE_LANGUAGES[locale]?.id ?? null;

// "fra" → "fr"  (DB language ID → UI locale)
export const languageIdToLocale = languageId => {
  const entry = Object.entries(AVAILABLE_LANGUAGES).find(
    ([, v]) => v.id === languageId
  );
  return entry?.[0] ?? null;
};
