import _ from 'underscore.string';
import { isEmpty } from 'lodash';

const apiVersion = 'v1';
const API_URL = process.env.REACT_APP_API_URL;
export const LEFT_TO_RIGHT = 'LTR';
export const RIGHT_TO_LEFT = 'RTL';

export const DEFAULT_LANGUAGE = 'en';

export const AVAILABLE_LANGUAGES = {
  ar: 'عربية',
  bg: 'Български',
  ca: 'Català',
  de: 'Deutsch',
  el: 'Ελληνικός',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  he: 'עברי',
  id: 'Indonesia',
  it: 'Italiano',
  ja: '日本語',
  nl: 'Nederlands',
  pt: 'Português',
  ro: 'R<omână'
};

export const FR_GC_BLOG = `${API_URL}/api/rss/FR`;
export const EN_GC_BLOG = `${API_URL}/api/rss/EN`;

function generateLinks(link, defaultLang) {
  const resultArray = {};
  if (
    typeof AVAILABLE_LANGUAGES === 'undefined' ||
    isEmpty(AVAILABLE_LANGUAGES)
  ) {
    resultArray[0] = { en: 'English' };
  } else {
    Object.keys(AVAILABLE_LANGUAGES).forEach(value => {
      resultArray[value] = _.replaceAll(link, '%s', _.capitalize(value));
    });
    resultArray['*'] = _.replaceAll(link, '%s', _.capitalize(defaultLang));
  }
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

// ===== Grottocenter API routes

export const dynamicNumbersUrl = {
  documents: `${API_URL}/api/${apiVersion}/documents/count`,
  entrances: `${API_URL}/api/${apiVersion}/entrances/count`,
  officialPartners: `${API_URL}/api/${apiVersion}/partners/count`,
  organizations: `${API_URL}/api/${apiVersion}/organizations/count`,
  publicEntrances: `${API_URL}/api/${apiVersion}/entrances/publicCount`,
  users: `${API_URL}/api/${apiVersion}/cavers/users/count`
};

export const fetchConvert = `${API_URL}/api/convert`;
export const findRandomEntryUrl = `${API_URL}/api/${apiVersion}/entrances/findRandom`;
export const findForCarouselUrl = `${API_URL}/api/${apiVersion}/partners/findForCarousel`;
export const getMapCavesUrl = `${API_URL}/api/${apiVersion}/geoloc/caves`;
export const getMapCavesCoordinatesUrl = `${API_URL}/api/${apiVersion}/geoloc/cavesCoordinates`;
export const getMapEntrancesUrl = `${API_URL}/api/${apiVersion}/geoloc/entrances`;
export const getMapEntrancesCoordinatesUrl = `${API_URL}/api/${apiVersion}/geoloc/entrancesCoordinates`;
export const getMapGrottosUrl = `${API_URL}/api/${apiVersion}/geoloc/grottos`;
export const getCaversDocumentsUrl = caverId =>
  `${API_URL}/api/${apiVersion}/cavers/${caverId}/documents`;
export const postCreateEntranceUrl = `${API_URL}/api/${apiVersion}/entrances`;
export const postCreateCaveUrl = `${API_URL}/api/${apiVersion}/caves`;
export const findMassifUrl = `${API_URL}/api/${apiVersion}/massifs/`;
export const findOrganizationUrl = `${API_URL}/api/${apiVersion}/organizations/`;
export const advancedsearchUrl = `${API_URL}/api/${apiVersion}/advanced-search`;
export const quicksearchUrl = `${API_URL}/api/${apiVersion}/search`;
export const subjectsUrl = `${API_URL}/api/${apiVersion}/documents/subjects`;
export const subjectsSearchUrl = `${API_URL}/api/${apiVersion}/documents/subjects/search/logical/or`;
export const getDocumentTypesUrl = `${API_URL}/api/${apiVersion}/documents/types`;
export const getDocuments = `${API_URL}/api/${apiVersion}/documents`;
export const getDocumentChildren = documentId =>
  `${API_URL}/api/${apiVersion}/documents/${documentId}/children`;
export const processDocumentIds = `${API_URL}/api/${apiVersion}/documents/validate`;
export const getDocumentDetailsUrl = `${API_URL}/api/${apiVersion}/documents/`;
export const getEntryUrl = `${API_URL}/api/${apiVersion}/entrances/`;
export const getCaveUrl = `${API_URL}/api/${apiVersion}/caves/`;
export const getLanguagesUrl = `${API_URL}/api/${apiVersion}/languages`;
export const postCaverUrl = `${API_URL}/api/${apiVersion}/cavers`;
export const postDocumentUrl = `${API_URL}/api/${apiVersion}/documents`;
export const putDocumentUrl = documentId =>
  `${API_URL}/api/${apiVersion}/documents/${documentId}`;
export const postOrganizationUrl = `${API_URL}/api/${apiVersion}/organizations`;
export const regionsSearchUrl = `${API_URL}/api/${apiVersion}/regions/search/logical/or`;
export const identifierTypesUrl = `${API_URL}/api/${apiVersion}/documents/identifierTypes`;
export const getAdminsUrl = `${API_URL}/api/${apiVersion}/cavers/admins`;
export const getModeratorsUrl = `${API_URL}/api/${apiVersion}/cavers/moderators`;
export const postCaverGroupsUrl = userId =>
  `${API_URL}/api/${apiVersion}/cavers/${userId}/groups`;
export const getLicensesUrl = `${API_URL}/api/v1/licenses`;
export const getFileFormatsUrl = `${API_URL}/api/v1/file-formats`;
export const entryDetailPath = `${API_URL}/api/${apiVersion}/entrances/`;
export const putEntryWithNewEntitiesUrl = entryId =>
  `${API_URL}/api/${apiVersion}/entrances/${entryId}/new-entities`;
export const putDocumentyWithNewEntitiesUrl = docId =>
  `${API_URL}/api/${apiVersion}/documents/${docId}/new-entities`;

// ===== ImportCSV url
export const checkRowsEntrancesUrl = `${API_URL}/api/${apiVersion}/entrances/check-rows`;
export const checkRowsDocumentsUrl = `${API_URL}/api/${apiVersion}/documents/check-rows`;
export const importRowsEntrancesUrl = `${API_URL}/api/${apiVersion}/entrances/import-rows`;
export const importRowsDocumentsUrl = `${API_URL}/api/${apiVersion}/documents/import-rows`;

// ===== Auth url
export const changePasswordUrl = `${API_URL}/api/${apiVersion}/account/password`;
export const loginUrl = `${API_URL}/api/${apiVersion}/login`;
export const logoutUrl = `${API_URL}/api/${apiVersion}/logout`;
export const signUpUrl = `${API_URL}/api/${apiVersion}/signup`;
export const forgotPassword = `${API_URL}/api/${apiVersion}/forgotPassword`;

// ===== Duplicates urls
export const createNewEntranceFromDuplicate = id =>
  `${API_URL}/api/${apiVersion}/entrances/from-duplicate/${id}`;
export const createNewDocumentFromDuplicate = id =>
  `${API_URL}/api/${apiVersion}/documents/from-duplicate/${id}`;

export const getDuplicatesDocumentUrl = `${API_URL}/api/${apiVersion}/document-duplicates`;
export const getDuplicatesEntranceUrl = `${API_URL}/api/${apiVersion}/entrance-duplicates`;
export const getDuplicateDocumentUrl = duplicateId =>
  `${API_URL}/api/${apiVersion}/document-duplicates/${duplicateId}`;
export const getDuplicateEntranceUrl = duplicateId =>
  `${API_URL}/api/${apiVersion}/entrance-duplicates/${duplicateId}`;

export const deleteDuplicatesDocumentUrl = `${API_URL}/api/${apiVersion}/document-duplicates`;
export const deleteDuplicatesEntranceUrl = `${API_URL}/api/${apiVersion}/entrance-duplicates`;
export const deleteDuplicateDocumentUrl = id =>
  `${API_URL}/api/${apiVersion}/document-duplicates/${id}`;
export const deleteDuplicateEntranceUrl = id =>
  `${API_URL}/api/${apiVersion}/entrance-duplicates/${id}`;

// ===== Grottocenter Client routes
export const swaggerLinkV1 = `${API_URL}/ui/swagger/1`;

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

export const defaultCoord = { lat: 0, lng: 0 };
export const defaultZoom = 3;
export const focusZoom = 13;
export const sideMenuWidth = '215px';
export const logoGC = '/images/logo.svg';

export const authTokenName = 'grottocenter_token';
