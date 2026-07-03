import isEmail from 'validator/lib/isEmail';

export const AVAILABLE_LANGUAGES = {
  ar: { nativeName: 'عربية', id: 'ara', part1: 'ar', refName: 'Arabic', direction: 'rtl' },
  bg: { nativeName: 'Български', id: 'bul', part1: 'bg', refName: 'Bulgarian' },
  ca: { nativeName: 'Català', id: 'cat', part1: 'ca', refName: 'Catalan' },
  de: { nativeName: 'Deutsch', id: 'deu', part1: 'de', refName: 'German' },
  el: {
    nativeName: 'Ελληνικός',
    id: 'ell',
    part1: 'el',
    refName: 'Modern Greek (1453-)'
  },
  en: { nativeName: 'English', id: 'eng', part1: 'en', refName: 'English' },
  es: { nativeName: 'Español', id: 'spa', part1: 'es', refName: 'Spanish' },
  fr: { nativeName: 'Français', id: 'fra', part1: 'fr', refName: 'French' },
  he: { nativeName: 'עברי', id: 'heb', part1: 'he', refName: 'Hebrew', direction: 'rtl' },
  id: {
    nativeName: 'Indonesia',
    id: 'ind',
    part1: 'id',
    refName: 'Indonesian'
  },
  it: { nativeName: 'Italiano', id: 'ita', part1: 'it', refName: 'Italian' },
  ja: { nativeName: '日本語', id: 'jpn', part1: 'ja', refName: 'Japanese' },
  nl: { nativeName: 'Nederlands', id: 'nld', part1: 'nl', refName: 'Dutch' },
  pt: {
    nativeName: 'Português',
    id: 'por',
    part1: 'pt',
    refName: 'Portuguese'
  },
  ro: { nativeName: 'Română', id: 'ron', part1: 'ro', refName: 'Romanian' }
  // If you change root keys on this object, don't forget to also update the intlBootstrap allLanguages list in public/index.html
};

export const DEFAULT_LANGUAGE = AVAILABLE_LANGUAGES.en;

export const ADVANCED_SEARCH_TYPES = {
  DOCUMENTS: 'documents',
  ENTRANCES: 'entrances',
  MASSIFS: 'massifs',
  ORGANIZATIONS: 'organizations',
  CAVES: 'caves',
  PERSONS: 'persons'
};

export const bloggerIcons = {
  fr: 'blogger-Fr.svg',
  '*': 'blogger-En.svg'
};

// ===== Misc config values
export const isValidEmail = email => isEmail(email ?? '');
export const PASSWORD_MIN_LENGTH = 12;

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/~`]/;

export const checkPasswordRules = password => ({
  minLength: password.length >= PASSWORD_MIN_LENGTH,
  hasUppercase: /[A-Z]/.test(password),
  hasLowercase: /[a-z]/.test(password),
  hasDigit: /[0-9]/.test(password),
  hasSpecial: SPECIAL_CHAR_REGEX.test(password)
});

export const isPasswordValid = password =>
  Object.values(checkPasswordRules(password)).every(Boolean);

export const DYNAMIC_NUMBER_RELOAD_INTERVAL = 900000;
export const DYNAMIC_NEWS_RELOAD_INTERVAL = 3600000;

export const breadcrumpKeys = {
  add: 'Add',
  admin: 'Administration',
  api: 'API',
  bbs: 'BBS',
  documents: 'Documents',
  entries: 'Entries',
  faq: 'FAQ',
  'import-csv': 'Import',
  organizations: 'Organizations',
  manage: 'Manage',
  map: 'Map',
  massifs: 'Massifs',
  search: 'Search',
  swagger: 'Browse API',
  users: 'Users'
};

export const defaultCoord = { lat: 0, lng: 0 };
export const defaultZoom = 2;
export const focusZoom = 13;
export const sideMenuWidth = '215px';
export const logoGC = '/images/logo.svg';

export const authTokenName = 'grottocenter_token';

export const MAX_SIZE_OF_UPLOADED_FILES = 2000 * 1000000; // in bytes (2 Go)
export const MAX_ORGANIZATION_LOGO_SIZE_IN_BYTES = 10485760; // in bytes (10MB)

export const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search';

export const AUTOCOMPLETE_DEBOUNCE_DELAY = 300; // in milliseconds
export const AUTOCOMPLETE_MIN_CHARACTERS = 2;

// Radius (in kilometres) used to look for existing entrances near the
// coordinates entered in the entrance creation form, to warn about potential
// duplicates. Change this single value to widen/narrow the detection area.
export const DUPLICATE_DETECTION_RADIUS_KM = 1;

// Below this map zoom level the duplicate-detection markers are hidden: at
// world/continent scale they are meaningless noise (and would trigger a fetch
// on every pan). focusZoom (13) is well above it, so markers show as soon as a
// coordinate is entered or the map is zoomed in.
export const DUPLICATE_DETECTION_MIN_ZOOM = 11;
