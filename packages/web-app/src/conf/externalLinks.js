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
  '*': 'https://wiki.grottocenter.org/wiki/GrottoCenter:Contributors'
};

export const facebookLink = {
  '*': 'https://www.facebook.com/GrottoCenter'
};

export const githubLink = {
  '*': 'https://github.com/GrottoCenter'
};

export const createGitHubIssueForClientLinks = {
  '*': 'https://github.com/GrottoCenter/grottocenter-front/issues/new?assignees=&labels=Type%3A+Bug&template=bug_report.md&title='
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
  fr: 'https://wiki.grottocenter.org/wiki/GrottoCenter:Fr/Main_Page_/_Accueil',
  en: 'https://wiki.grottocenter.org/wiki/GrottoCenter:En/Main_Page_/_Accueil',
  '*': 'https://wiki.grottocenter.org'
};
export const userguideLinks = {
  ar: 'https://wiki.grottocenter.org/wiki/GrottoCenter:Ar/User_Guide',
  bg: 'https://wiki.grottocenter.org/wiki/GrottoCenter:Bg/User_Guide',
  ca: 'https://wiki.grottocenter.org/wiki/GrottoCenter:Ca/User_Guide',
  de: 'https://wiki.grottocenter.org/wiki/GrottoCenter:De/User_Guide',
  el: 'https://wiki.grottocenter.org/wiki/GrottoCenter:El/User_Guide',
  en: 'https://wiki.grottocenter.org/wiki/GrottoCenter:En/User_Guide',
  es: 'https://wiki.grottocenter.org/wiki/GrottoCenter:Es/User_Guide',
  fr: 'https://wiki.grottocenter.org/wiki/GrottoCenter:Fr/User_Guide',
  he: 'https://wiki.grottocenter.org/wiki/GrottoCenter:He/User_Guide',
  id: 'https://wiki.grottocenter.org/wiki/GrottoCenter:Id/User_Guide',
  it: 'https://wiki.grottocenter.org/wiki/GrottoCenter:It/User_Guide',
  ja: 'https://wiki.grottocenter.org/wiki/GrottoCenter:Ja/User_Guide',
  nl: 'https://wiki.grottocenter.org/wiki/GrottoCenter:Nl/User_Guide',
  pt: 'https://wiki.grottocenter.org/wiki/GrottoCenter:Pt/User_Guide',
  '*': 'https://wiki.grottocenter.org/wiki/GrottoCenter:En/User_Guide'
};
export const wikiBatsLinks = generateLinks(
  'https://wiki.grottocenter.org/wiki/GrottoCenter:%s/bats',
  'en'
);
export const wikiBBSLinks = {
  fr: 'https://wiki.grottocenter.org/wiki/GrottoCenter:Fr/bbs',
  en: 'https://wiki.grottocenter.org/wiki/GrottoCenter:En/bbs',
  '*': 'https://wiki.grottocenter.org/wiki/GrottoCenter:En/bbs'
};

export const wikiBBSChaptersLinks = {
  fr: 'https://wiki.grottocenter.org/wiki/GrottoCenter:Fr/Code_for_chapters',
  en: 'https://wiki.grottocenter.org/wiki/GrottoCenter:En/Code_for_chapters',
  '*': 'https://wiki.grottocenter.org/wiki/GrottoCenter:En/Code_for_chapters'
};
export const legalLinks = generateLinks(
  'https://wiki.grottocenter.org/wiki/GrottoCenter:%s/Legal_and_Privacy_Statement',
  'en'
);

export const pftGdLink =
  'https://docs.google.com/document/d/1SccuusPQcxrZJI3nvWcbUc2dgGyKc4ZJXqQzSPeE9Hg/edit?usp=sharing';

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
  fr: 'http://blog-fr.grottocenter.org/',
  '*': 'https://blog-en.grottocenter.org/'
};

export const oaiLinks = {
  '*': process.env.REACT_APP_OAI_URL || '#'
};

export const z3950Links = {
  '*': process.env.REACT_APP_Z3950_URL || '#'
};

export const uptimeLinks = {
  '*': 'https://wikicaves.betteruptime.com'
};

export const donateLink =
  'https://www.helloasso.com/associations/wikicaves/formulaires/1';

export const karstlinkLinks = {
  '*': 'https://ontology.uis-speleo.org/'
};
