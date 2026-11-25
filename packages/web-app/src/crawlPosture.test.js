import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Crawl posture guard.
 *
 * The SPA is deliberately kept out of search indexes. Crawlable pages come
 * from the API's generated bot surface, built from a disclosure whitelist; the
 * SPA renders whatever the API returns (including coordinates), so opening it
 * to crawlers would bypass those gates.
 *
 * Two files carry the block: `index.html` (robots meta, the fail-safe for any
 * crawler the edge Worker does not recognise) and `public/robots.txt`.
 *
 * Encodes: the block is a decision, not a default; loosening it must be a
 * visible, reviewed change to this test as well.
 * Covers: robots / crawler-specific metas, every robots.txt group (each must
 * keep `Disallow: /`, and a `User-agent: *` group must exist), and the
 * allow-list of hubs.
 * See https://github.com/GrottoCenter/grottocenter-front/issues/1500
 */

const WEB_APP_ROOT = resolve(fileURLToPath(import.meta.url), '../..');

// The only `Allow` lines robots.txt may contain: the hubs served by the edge
// Worker (GrottoCenter/grottocenter-api#1935). The test compares the text of
// each line exactly, but crawlers apply `Allow` as a path PREFIX, so each line
// also reaches everything beneath it (`/ui/caves/` covers every cave detail
// page; `/ui/countries` covers `/ui/countries/FR/entrances`). That reach is
// intended: the edge Worker serves a generated page to verified crawlers at
// those addresses, and anything it does not serve falls back to the SPA shell,
// which stays `noindex`. Entrances, persons and the rest of `/ui/` stay
// disallowed.
const ALLOWED_PATHS = [
  '/ui/caves/',
  '/ui/massifs/',
  '/ui/organizations/',
  '/ui/countries'
];

const ISSUE_URL =
  'https://github.com/GrottoCenter/grottocenter-front/issues/1500';
const DELIBERATE = `The SPA crawl block is deliberate, see ${ISSUE_URL}.`;

const readWebAppFile = relativePath =>
  readFileSync(resolve(WEB_APP_ROOT, relativePath), 'utf8');

// Every meta addressed to robots or to a named crawler (`robots`, `googlebot`,
// `bingbot`, ...), as { name, content }.
const getCrawlerMetas = html =>
  (html.match(/<meta\b[^>]*>/gi) || [])
    .map(tag => ({
      name: (tag.match(/\bname\s*=\s*["']([^"']*)["']/i) || [])[1],
      content: (tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i) || [])[1] || ''
    }))
    .filter(({ name }) => name && /^robots$|bot/i.test(name));

const metaHasNoindex = ({ content }) =>
  content
    .toLowerCase()
    .split(',')
    .map(directive => directive.trim())
    .includes('noindex');

// A crawler obeys only the most specific meta addressed to it, so the generic
// `robots` meta must exist and every crawler-specific one must say noindex too.
const hasNoindex = html => {
  const metas = getCrawlerMetas(html);
  return (
    metas.some(({ name }) => name.toLowerCase() === 'robots') &&
    metas.every(metaHasNoindex)
  );
};

// Returns every group as { agents, rules }. Consecutive User-agent lines share
// one group, as in the robots.txt spec. A crawler obeys only the most specific
// group naming it and ignores `*` then, so every group is checked, not just `*`.
const getGroups = robotsTxt => {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  robotsTxt.split(/\r?\n/).forEach(rawLine => {
    const line = rawLine.replace(/#.*$/, '').trim();
    const separator = line.indexOf(':');
    if (separator === -1) return;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (field === 'user-agent') {
      if (!lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value);
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (current && (field === 'allow' || field === 'disallow')) {
        current.rules.push({ field, value });
      }
    }
  });
  return groups;
};

const hasWildcardGroup = robotsTxt =>
  getGroups(robotsTxt).some(({ agents }) => agents.includes('*'));

// Groups that do not disallow the whole site.
const getGroupsWithoutRootDisallow = robotsTxt =>
  getGroups(robotsTxt).filter(
    ({ rules }) =>
      !rules.some(({ field, value }) => field === 'disallow' && value === '/')
  );

const getUnexpectedAllows = robotsTxt =>
  getGroups(robotsTxt)
    .flatMap(({ rules }) => rules)
    .filter(({ field }) => field === 'allow')
    .map(({ value }) => value)
    .filter(value => !ALLOWED_PATHS.includes(value));

const hasRootDisallow = robotsTxt =>
  hasWildcardGroup(robotsTxt) &&
  getGroupsWithoutRootDisallow(robotsTxt).length === 0;

describe('crawl posture: the SPA stays blocked', () => {
  it(`keeps noindex in the robots meta of index.html. ${DELIBERATE}`, () => {
    expect(hasNoindex(readWebAppFile('index.html'))).toBe(true);
  });

  it(`keeps "Disallow: /" in every group, including User-agent: *. ${DELIBERATE}`, () => {
    expect(hasRootDisallow(readWebAppFile('public/robots.txt'))).toBe(true);
  });

  it(`allows nothing beyond the generated hubs. ${DELIBERATE}`, () => {
    expect(getUnexpectedAllows(readWebAppFile('public/robots.txt'))).toEqual(
      []
    );
  });
});

/**
 * Negative cases: prove the checks above can actually fail, so the guard is
 * not vacuously green.
 */
describe('crawl posture: the guard detects loosening', () => {
  const meta = content =>
    `<head><meta name="robots" content="${content}" /></head>`;

  it('rejects index, follow', () => {
    expect(hasNoindex(meta('index, follow'))).toBe(false);
  });

  it('rejects a missing robots meta', () => {
    expect(
      hasNoindex('<head><meta name="viewport" content="x" /></head>')
    ).toBe(false);
  });

  it('rejects "noindex" appearing only inside another directive', () => {
    expect(hasNoindex(meta('notnoindexed'))).toBe(false);
  });

  it('accepts noindex among other directives, whatever the order or case', () => {
    expect(hasNoindex(meta('NoFollow, NOINDEX'))).toBe(true);
  });

  it('rejects a removed Disallow: /', () => {
    expect(hasRootDisallow('User-agent: *\nDisallow:\n')).toBe(false);
  });

  it('rejects a Disallow: / that belongs to another user agent', () => {
    expect(
      hasRootDisallow('User-agent: Googlebot\nDisallow: /\n\nUser-agent: *\n')
    ).toBe(false);
  });

  it('rejects a named group that allows everything, even if * disallows', () => {
    const robots =
      'User-agent: Googlebot\nAllow: /\n\nUser-agent: *\nDisallow: /\n';
    expect(hasRootDisallow(robots)).toBe(false);
    expect(getUnexpectedAllows(robots)).toEqual(['/']);
  });

  it('rejects a named group with an empty Disallow, even if * disallows', () => {
    expect(
      hasRootDisallow(
        'User-agent: Googlebot\nDisallow:\n\nUser-agent: *\nDisallow: /\n'
      )
    ).toBe(false);
  });

  it('rejects a robots.txt with no User-agent: * group', () => {
    expect(hasRootDisallow('User-agent: Googlebot\nDisallow: /\n')).toBe(false);
  });

  it('flags hub allows placed in a named group the same way', () => {
    expect(
      getUnexpectedAllows(
        'User-agent: Bingbot\nDisallow: /\nAllow: /ui/entrances/\n'
      )
    ).toEqual(['/ui/entrances/']);
  });

  it('rejects a crawler-specific meta that allows indexing', () => {
    expect(
      hasNoindex(
        `${meta('noindex, nofollow')}<meta name="googlebot" content="index" />`
      )
    ).toBe(false);
  });

  it('accepts crawler-specific metas that also say noindex', () => {
    expect(
      hasNoindex(
        `${meta('noindex, nofollow')}<meta name="googlebot" content="noindex" />`
      )
    ).toBe(true);
  });

  it('ignores unrelated metas such as viewport', () => {
    expect(
      hasNoindex(`${meta('noindex')}<meta name="viewport" content="width=1" />`)
    ).toBe(true);
  });

  it('accepts a Disallow: / shared by grouped user agents', () => {
    expect(
      hasRootDisallow('User-agent: Bingbot\nUser-agent: *\nDisallow: /\n')
    ).toBe(true);
  });

  it('flags an Allow outside the hub list', () => {
    const robots = [
      'User-agent: *',
      'Disallow: /',
      'Allow: /ui/caves/',
      'Allow: /ui/entrances/',
      'Allow: /ui/countries/FR/entrances',
      'Allow: /'
    ].join('\n');
    expect(getUnexpectedAllows(robots)).toEqual([
      '/ui/entrances/',
      '/ui/countries/FR/entrances',
      '/'
    ]);
  });

  it('accepts exactly the four hub allows', () => {
    const robots = `User-agent: *\nDisallow: /\n${ALLOWED_PATHS.map(
      path => `Allow: ${path}`
    ).join('\n')}\nSitemap: https://grottocenter.org/sitemap.xml\n`;
    expect(getUnexpectedAllows(robots)).toEqual([]);
    expect(hasRootDisallow(robots)).toBe(true);
  });

  it('ignores comments when reading rules', () => {
    expect(
      getUnexpectedAllows('User-agent: *\n# Allow: /ui/entrances/\nDisallow: /')
    ).toEqual([]);
  });
});
