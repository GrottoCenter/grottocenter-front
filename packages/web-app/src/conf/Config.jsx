import _ from 'underscore.string';
import { isEmpty } from 'lodash';

export const apiVersion = 'v1';

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

export const FR_GC_BLOG = `${process.env.REACT_APP_API_URL}/api/rss/FR`;
export const EN_GC_BLOG = `${process.env.REACT_APP_API_URL}/api/rss/EN`;

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
export const rssLinks = generateLinks(
  'http://www.grottocenter.org/html/rss_%s.xml',
  'en'
);
export const legalLinks = generateLinks(
  'https://wiki.grottocenter.org/wiki/GrottoCenter:%s/Legal_and_Privacy_Statement',
  'en'
);

export const detailPageV2Links = {
  fr: 'http://www.grottocenter.org/html/file_Fr.php?lang=Fr',
  es: 'http://www.grottocenter.org/html/file_Es.php?lang=Es',
  ca: 'http://www.grottocenter.org/html/file_Ca.php?lang=Ca',
  de: 'http://www.grottocenter.org/html/file_De.php?lang=De',
  bg: 'http://www.grottocenter.org/html/file_Bg.php?lang=Bg',
  nl: 'http://www.grottocenter.org/html/file_Nl.php?lang=Nl',
  it: 'http://www.grottocenter.org/html/file_It.php?lang=It',
  '*': 'http://www.grottocenter.org/html/file_En.php?lang=En'
};

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
  documents: `${process.env.REACT_APP_API_URL}/api/${apiVersion}/documents/count`,
  entrances: `${process.env.REACT_APP_API_URL}/api/${apiVersion}/entrances/count`,
  officialPartners: `${process.env.REACT_APP_API_URL}/api/${apiVersion}/partners/count`,
  organizations: `${process.env.REACT_APP_API_URL}/api/${apiVersion}/organizations/count`,
  publicEntrances: `${process.env.REACT_APP_API_URL}/api/${apiVersion}/entrances/publicCount`,
  users: `${process.env.REACT_APP_API_URL}/api/${apiVersion}/cavers/users/count`
};

export const fetchConvert = `${process.env.REACT_APP_API_URL}/api/convert`;
export const findRandomEntryUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/entrances/findRandom`;
export const findForCarouselUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/partners/findForCarousel`;
export const getMapCavesUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/geoloc/caves`;
export const getMapCavesCoordinatesUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/geoloc/cavesCoordinates`;
export const getMapEntrancesUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/geoloc/entrances`;
export const getMapEntrancesCoordinatesUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/geoloc/entrancesCoordinates`;
export const getMapGrottosUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/geoloc/grottos`;
export const getCaversDocumentsUrl = caverId =>
  `${process.env.REACT_APP_API_URL}/api/${apiVersion}/cavers/${caverId}/documents`;
/**
 * @deprecated
 */
export const findMapBoundsUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/geoloc/TO_REMOVE`;
export const findMassifUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/massifs/`;
export const findOrganizationUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/organizations/`;
export const advancedsearchUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/advanced-search`;
export const quicksearchUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/search`;
export const subjectsUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/documents/subjects`;
export const subjectsSearchUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/documents/subjects/search/logical/or`;
export const getDocumentTypesUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/documents/types`;
export const getDocuments = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/documents`;
export const processDocumentIds = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/documents/validate`;
export const getDocumentDetailsUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/documents/`;
export const getEntryUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/entrances/`;
export const getCaveUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/caves/`;
export const getLanguagesUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/languages`;
export const postCaverUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/cavers`;
export const postDocumentUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/documents`;
export const putDocumentUrl = documentId =>
  `${process.env.REACT_APP_API_URL}/api/${apiVersion}/documents/${documentId}`;
export const postOrganizationUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/organizations`;
export const regionsSearchUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/regions/search/logical/or`;
export const identifierTypesUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/documents/identifierTypes`;
export const getAdminsUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/cavers/admins`;
export const getModeratorsUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/cavers/moderators`;
export const postCaverGroupsUrl = userId =>
  `${process.env.REACT_APP_API_URL}/api/${apiVersion}/cavers/${userId}/groups`;

// ===== Auth url
export const loginUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/login`;
export const logoutUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/logout`;
export const signUpUrl = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/signup`;

// ===== Grottocenter Client routes
export const swaggerLinkV1 = `${process.env.REACT_APP_API_URL}/ui/swagger/1`;
export const entryDetailPath = `${process.env.REACT_APP_API_URL}/api/${apiVersion}/entrances/`;

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
