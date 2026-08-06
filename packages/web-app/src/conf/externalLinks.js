import { AVAILABLE_LANGUAGES } from './config';
import { capitalize } from '../utils/strings';

function generateLinks(link, defaultLang) {
  const resultArray = {};
  Object.keys(AVAILABLE_LANGUAGES).forEach(value => {
    resultArray[value] = link.replaceAll('%s', capitalize(value));
  });
  resultArray['*'] = link.replaceAll('%s', capitalize(defaultLang));
  return resultArray;
}

export const bbsLink = {
  '*': 'https://www.ssslib.ch/bbs/'
};

export const wikicavesLink = {
  '*': 'http://www.wikicaves.org/'
};

export const contributorsLink = {
  '*': 'https://wiki.grottocenter.org/wiki/Grottocenter:Contributors'
};

export const facebookLink = {
  '*': 'https://www.facebook.com/Grottocenter'
};

export const githubLink = {
  '*': 'https://github.com/Grottocenter'
};

export const createGitHubIssueForClientLinks = {
  '*': 'https://github.com/Grottocenter/grottocenter-front/issues/new?assignees=&labels=Type%3A+Bug&template=bug_report.md&title='
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
  fr: 'https://fr.wikicaves.org/contact',
  '*': 'https://en.wikicaves.org/contact'
};

export const fseLinks = {
  fr: 'https://eurospeleo.eu/fr/',
  '*': 'https://eurospeleo.eu/en/'
};
export const uisLinks = {
  '*': 'https://uis-speleo.org/'
};
export const wikiLinks = {
  fr: 'https://wiki.grottocenter.org/wiki/Grottocenter:Fr/Main_Page_/_Accueil',
  en: 'https://wiki.grottocenter.org/wiki/Grottocenter:En/Main_Page_/_Accueil',
  '*': 'https://wiki.grottocenter.org'
};
export const userguideLinks = {
  ar: 'https://wiki.grottocenter.org/wiki/Grottocenter:Ar/User_Guide',
  bg: 'https://wiki.grottocenter.org/wiki/Grottocenter:Bg/User_Guide',
  ca: 'https://wiki.grottocenter.org/wiki/Grottocenter:Ca/User_Guide',
  de: 'https://wiki.grottocenter.org/wiki/Grottocenter:De/User_Guide',
  el: 'https://wiki.grottocenter.org/wiki/Grottocenter:El/User_Guide',
  en: 'https://wiki.grottocenter.org/wiki/Grottocenter:En/User_Guide',
  es: 'https://wiki.grottocenter.org/wiki/Grottocenter:Es/User_Guide',
  fr: 'https://wiki.grottocenter.org/wiki/Grottocenter:Fr/User_Guide',
  he: 'https://wiki.grottocenter.org/wiki/Grottocenter:He/User_Guide',
  id: 'https://wiki.grottocenter.org/wiki/Grottocenter:Id/User_Guide',
  it: 'https://wiki.grottocenter.org/wiki/Grottocenter:It/User_Guide',
  ja: 'https://wiki.grottocenter.org/wiki/Grottocenter:Ja/User_Guide',
  nl: 'https://wiki.grottocenter.org/wiki/Grottocenter:Nl/User_Guide',
  pt: 'https://wiki.grottocenter.org/wiki/Grottocenter:Pt/User_Guide',
  '*': 'https://wiki.grottocenter.org/wiki/Grottocenter:En/User_Guide'
};
export const wikiBatsLinks = {
  fr: 'https://wiki.grottocenter.org/wiki/Grottocenter:Fr/bats',
  '*': 'https://wiki.grottocenter.org/wiki/Grottocenter:En/bats'
};
export const caveConservationLinks = {
  fr: 'https://wiki.grottocenter.org/wiki/Grottocenter:Fr/Cave_conservation',
  '*': 'https://wiki.grottocenter.org/wiki/Grottocenter:En/Cave_conservation'
};
export const biLinks = {
  '*': import.meta.env.VITE_BI_URL || 'https://bi.grottocenter.org'
};
export const wikiBBSLinks = {
  fr: 'https://wiki.grottocenter.org/wiki/Grottocenter:Fr/bbs',
  en: 'https://wiki.grottocenter.org/wiki/Grottocenter:En/bbs',
  '*': 'https://wiki.grottocenter.org/wiki/Grottocenter:En/bbs'
};

export const wikiBBSChaptersLinks = {
  fr: 'https://wiki.grottocenter.org/wiki/Grottocenter:Fr/Code_for_chapters',
  en: 'https://wiki.grottocenter.org/wiki/Grottocenter:En/Code_for_chapters',
  '*': 'https://wiki.grottocenter.org/wiki/Grottocenter:En/Code_for_chapters'
};
export const legalLinks = generateLinks(
  'https://wiki.grottocenter.org/wiki/Grottocenter:%s/Legal_and_Privacy_Statement',
  'en'
);

export const contributeLinks = {
  fr: 'https://fr.wikicaves.org/contribute-participer',
  '*': 'https://en.wikicaves.org/contribute-participer'
};

export const wikiApiLinks = {
  fr: 'https://fr.wikipedia.org/wiki/Interface_de_programmation',
  '*': 'https://en.wikipedia.org/wiki/Application_programming_interface'
};
// ===== Blogger

export const bloggerLinks = {
  fr: 'https://blog-fr.grottocenter.org/',
  '*': 'https://blog-en.grottocenter.org/'
};

export const oaiLinks = {
  '*': import.meta.env.VITE_OAI_URL || '#'
};

export const z3950Links = {
  '*': import.meta.env.VITE_Z3950_URL || '#'
};

export const uptimeLinks = {
  '*': 'https://wikicaves.betteruptime.com'
};

export const donateLink =
  'https://www.helloasso.com/associations/wikicaves/formulaires/1';

export const karstlinkLinks = {
  '*': 'https://ontology.uis-speleo.org/'
};
