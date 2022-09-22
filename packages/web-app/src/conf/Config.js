import _ from 'underscore.string';

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
};

export const DEFAULT_LANGUAGE = AVAILABLE_LANGUAGES.en;

export const ADVANCED_SEARCH_TYPES = {
  DOCUMENTS: 'documents',
  ENTRANCES: 'entrances',
  MASSIFS: 'massifs',
  ORGANIZATIONS: 'grottos'
};

function generateLinks(link, defaultLang) {
  const resultArray = {};
  Object.keys(AVAILABLE_LANGUAGES).forEach(value => {
    resultArray[value] = _.replaceAll(link, '%s', _.capitalize(value));
  });
  resultArray['*'] = _.replaceAll(link, '%s', _.capitalize(defaultLang));
  return resultArray;
}

// ===== Misc links
export const bbsLink = {
  '*': 'https://www.ssslib.ch/bbs/'
};

export const wikicavesLink = {
  '*': 'http://www.wikicaves.org/'
};

export const contributorsLink = {
  '*': 'https://wiki.grottocenter.org/wiki/GrottoCenter:Contributors'
};

export const facebookLink = {
  '*': 'https://www.facebook.com/GrottoCenter'
};

export const twitterLink = {
  '*': 'https://twitter.com/grottocenter'
};

export const githubLink = {
  '*': 'https://github.com/GrottoCenter'
};

export const licenceLinks = {
  fr: 'https://creativecommons.org/licenses/by-sa/3.0/fr/',
  es: 'https://creativecommons.org/licenses/by-sa/3.0/deed.es_ES',
  ca: 'https://creativecommons.org/licenses/by-sa/3.0/deed.ca',
  de: 'https://creativecommons.org/licenses/by-sa/3.0/deed.de',
  pt: 'https://creativecommons.org/licenses/by-sa/3.0/deed.pt_PT',
  nl: 'https://creativecommons.org/licenses/by-sa/3.0/deed.nl',
  it: 'https://creativecommons.org/licenses/by-sa/3.0/deed.it',
  '*': 'https://creativecommons.org/licenses/by-sa/3.0/'
};

export const licensesODBLink = {
  '*': 'https://opendatacommons.org/licenses/odbl/'
};

export const contactLinks = {
  fr: ' http://fr.wikicaves.org/contact',
  '*': 'http://en.wikicaves.org/contact'
};

export const fseLinks = {
  fr: 'http://eurospeleo.eu/fr/',
  '*': 'http://eurospeleo.eu/en/'
};

export const userguideLinks = {
  fr: 'https://wiki.grottocenter.org/wiki/GrottoCenter:Fr/User_Guide',
  '*': 'https://wiki.grottocenter.org/wiki/GrottoCenter:En/User_Guide'
};

export const wikiBatsLinks = generateLinks(
  'https://wiki.grottocenter.org/wiki/GrottoCenter:%s/bats',
  'en'
);
export const wikiBBSLinks = generateLinks(
  'https://wiki.grottocenter.org/wiki/GrottoCenter:%s/bbs',
  'en'
);
export const legalLinks = generateLinks(
  'https://wiki.grottocenter.org/wiki/GrottoCenter:%s/Legal_and_Privacy_Statement',
  'en'
);

export const pftGdLink =
  'https://docs.google.com/document/d/1SccuusPQcxrZJI3nvWcbUc2dgGyKc4ZJXqQzSPeE9Hg/edit?usp=sharing';

export const contributeLinks = {
  fr: 'http://fr.wikicaves.org/contribute-participer',
  '*': 'http://en.wikicaves.org/contribute-participer'
};

export const restApiLinks = {
  fr: 'https://fr.wikipedia.org/wiki/Representational_state_transfer',
  '*': 'https://en.wikipedia.org/wiki/Representational_state_transfer'
};

export const wikiApiLinks = {
  fr: 'https://fr.wikipedia.org/wiki/Interface_de_programmation',
  '*': 'https://en.wikipedia.org/wiki/Application_programming_interface'
};

// ===== Blogger
export const bloggerLinks = {
  fr: 'http://blog-fr.grottocenter.org/',
  '*': 'http://blog-en.grottocenter.org/'
};

export const bloggerIcons = {
  fr: 'blogger-Fr.svg',
  '*': 'blogger-En.svg'
};

// ===== Paypal
export const paypalId = 'TJEU7C2TZ356Y';
export const paypalLink = 'https://www.paypal.com/cgi-bin/webscr';
export const paypalImgLink =
  'https://www.paypalobjects.com/fr_FR/i/scr/pixel.gif';

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
