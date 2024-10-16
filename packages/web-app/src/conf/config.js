export const LEFT_TO_RIGHT = 'LTR';
export const RIGHT_TO_LEFT = 'RTL';

export const AVAILABLE_LANGUAGES = {
  ar: { nativeName: 'عربية', id: 'ara', part1: 'ar', refName: 'Arabic' },
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
  he: { nativeName: 'עברי', id: 'heb', part1: 'he', refName: 'Hebrew' },
  id: {
    nativeName: 'Indonesia',
    id: 'ind',
    part1: 'id',
    refName: 'Indonesian'
  },
  it: { nativeName: 'Italiano', id: 'ita', part1: 'it', refName: 'Italian' },
  ja: { nativeName: '日本語', id: 'jpn', part1: 'ja', refName: 'Japanse' },
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
  ORGANIZATIONS: 'grottos',
  CAVES: 'caves'
};

export const bloggerIcons = {
  fr: 'blogger-Fr.svg',
  '*': 'blogger-En.svg'
};

// ===== Misc config values
export const emailRegexp = /\S+@\S+/; // simple regexp TODO: use another one more robust
export const PASSWORD_MIN_LENGTH = 8;

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

export const defaultCoord = { lat: 47.5, lng: 19 }; // Budapest
export const defaultZoom = 6;
export const focusZoom = 13;
export const sideMenuWidth = '215px';
export const logoGC = '/images/logo.svg';

export const authTokenName = 'grottocenter_token';

export const MAX_SIZE_OF_UPLOADED_FILES = 2000 * 1000000; // in bytes (2 Go)
export const MAX_ORGANIZATION_LOGO_SIZE_IN_BYTES = 10485760; // in bytes (10MB)
