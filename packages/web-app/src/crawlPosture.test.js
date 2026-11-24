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
 * Covers: robots meta, `User-agent: *` group, and the allow-list of hubs.
 * See https://github.com/GrottoCenter/grottocenter-front/issues/1500
 */

const WEB_APP_ROOT = resolve(fileURLToPath(import.meta.url), '../..');

// The only paths robots.txt may allow: the hubs served by the edge Worker
// (GrottoCenter/grottocenter-api#1935). Exact match: deeper SPA-only paths such
// as /ui/countries/FR/entrances must stay out.
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

const getRobotsMetaContent = html => {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const robots = tags.find(tag => /\bname\s*=\s*["']robots["']/i.test(tag));
  const content = robots && robots.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
  return content ? content[1] : null;
};

const hasNoindex = html => {
  const content = getRobotsMetaContent(html);
  return (
    content !== null &&
    content
      .toLowerCase()
      .split(',')
      .map(directive => directive.trim())
      .includes('noindex')
  );
};

// Returns the rules of the group addressed to `User-agent: *`. Consecutive
// User-agent lines share one group, as in the robots.txt spec.
const getWildcardRules = robotsTxt => {
  const rules = [];
  let agents = [];
  let lastWasAgent = false;
  robotsTxt.split(/\r?\n/).forEach(rawLine => {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) return;
    const separator = line.indexOf(':');
    if (separator === -1) return;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (field === 'user-agent') {
      agents = lastWasAgent ? [...agents, value] : [value];
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if ((field === 'allow' || field === 'disallow') && agents.includes('*')) {
        rules.push({ field, value });
      }
    }
  });
  return rules;
};

const hasRootDisallow = robotsTxt =>
  getWildcardRules(robotsTxt).some(
    ({ field, value }) => field === 'disallow' && value === '/'
  );

const getUnexpectedAllows = robotsTxt =>
  getWildcardRules(robotsTxt)
    .filter(({ field }) => field === 'allow')
    .map(({ value }) => value)
    .filter(value => !ALLOWED_PATHS.includes(value));

describe('crawl posture: the SPA stays blocked', () => {
  it(`keeps noindex in the robots meta of index.html. ${DELIBERATE}`, () => {
    expect(hasNoindex(readWebAppFile('index.html'))).toBe(true);
  });

  it(`keeps "Disallow: /" in the User-agent: * group. ${DELIBERATE}`, () => {
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
