import { AVAILABLE_LANGUAGES } from './config';

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

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

export const twitterLink = {
  '*': 'https://twitter.com/grottocenter'
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
  fr: 'http://fr.wikicaves.org/contact',
  '*': 'http://en.wikicaves.org/contact'
};

export const fseLinks = {
  fr: 'http://eurospeleo.eu/fr/',
  '*': 'http://eurospeleo.eu/en/'
};
export const wikiLinks = {
  fr: 'https://wiki.grottocenter.org/wiki/GrottoCenter:Fr/Main_Page_/_Accueil',
  en: 'https://wiki.grottocenter.org/wiki/GrottoCenter:En/Main_Page_/_Accueil',
  '*': 'https://wiki.grottocenter.org'
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

export const wikiApiLinks = {
  fr: 'https://fr.wikipedia.org/wiki/Interface_de_programmation',
  '*': 'https://en.wikipedia.org/wiki/Application_programming_interface'
};
// ===== Blogger

export const bloggerLinks = {
  fr: 'http://blog-fr.grottocenter.org/',
  '*': 'http://blog-en.grottocenter.org/'
};
