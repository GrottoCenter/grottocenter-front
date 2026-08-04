import ccBy from '@/assets/icons/cc/cc-by.svg';
import ccBySa from '@/assets/icons/cc/cc-by-sa.svg';
import ccByNc from '@/assets/icons/cc/cc-by-nc.svg';
import ccByNd from '@/assets/icons/cc/cc-by-nd.svg';
import ccByNcSa from '@/assets/icons/cc/cc-by-nc-sa.svg';
import ccByNcNd from '@/assets/icons/cc/cc-by-nc-nd.svg';
import ccZero from '@/assets/icons/cc/cc-zero.svg';

// Official Creative Commons composite badges (Wikimedia Commons), keyed by the
// dash-joined clause list. Every CC combination the API can return has a badge,
// so a Creative Commons license always renders as a badge (never the fallback).
export const CC_BADGES = {
  BY: ccBy,
  'BY-SA': ccBySa,
  'BY-NC': ccByNc,
  'BY-ND': ccByNd,
  'BY-NC-SA': ccByNcSa,
  'BY-NC-ND': ccByNcNd,
  ZERO: ccZero
};

// Plain-language description of each CC clause — what actually helps a user
// choose, the badge alone being jargon. Keyed by clause token; values are i18n
// message ids.
export const CC_CLAUSE_DESCRIPTIONS = {
  BY: 'Credit the author',
  NC: 'Non-commercial use only',
  SA: 'Share under the same terms',
  ND: 'No modifications allowed',
  ZERO: 'No rights reserved (public domain)'
};

// Plain-language description for the non-CC licenses. Falls back to the license
// `text` from the API for anything not listed here. Keyed by license name.
// Values are the English descriptions AND the i18n message ids at the same
// time — every value here must exist as a key in the language JSON files,
// otherwise the fallback renders the raw English literal even when the rest
// of the UI is translated.
export const NON_CC_DESCRIPTIONS = {
  ODBL: 'Open database, share alike',
  'ODC-BY': 'Open database, attribution required',
  'Licence Ouverte': 'French State open license'
};

// Non-CC licenses that also have an official badge image. Anything not listed
// here falls back to the Balance icon + name in LicenseBadge. Paths point to
// `public/` assets and stay as plain URLs (no import) so the map remains a
// pure data structure the tests can assert against without bundling assets.
export const NON_CC_BADGES = {
  ODBL: '/images/odbl.png',
  'Licence Ouverte': '/images/licence-ouverte.svg'
};

// Returns the ordered list of CC clause tokens for a license name, or null when
// the license is not a Creative Commons one (including empty / nullish input —
// callers can hand off unvalidated API values without extra guards). Tolerant
// to both spellings the API uses ("CC-BY-SA" and "CC BY NC").
export const parseCcClauses = name => {
  if (typeof name !== 'string' || !name) return null;
  const tokens = name
    .toUpperCase()
    .split(/[\s-]+/)
    .filter(Boolean);
  const first = tokens[0];
  if (first !== 'CC' && first !== 'CC0') return null;
  if (first === 'CC0' || tokens[1] === '0' || tokens.includes('ZERO'))
    return ['ZERO'];
  return tokens.slice(1).filter(token => CC_CLAUSE_DESCRIPTIONS[token]);
};

const getLicenseName = license =>
  typeof license === 'string' ? license : (license?.name ?? '');

// Single source of truth for everything the LicenseTag components need from a
// license (string name or full object). Avoids repeating the string/object and
// CC-parsing logic in each component.
export const getLicenseParts = license => {
  const obj = typeof license === 'object' && license ? license : null;
  const name = getLicenseName(license);
  const clauses = name ? parseCcClauses(name) : null;
  const isCc = clauses !== null;
  const ccBadge = isCc ? CC_BADGES[clauses.join('-')] : undefined;
  return {
    name,
    text: obj?.text,
    url: obj?.url,
    isCc,
    clauses,
    badgeSrc: ccBadge ?? NON_CC_BADGES[name]
  };
};
