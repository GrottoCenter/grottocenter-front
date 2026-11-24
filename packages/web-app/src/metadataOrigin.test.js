import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const WEB_APP_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const APEX_ORIGIN = 'https://grottocenter.org';
// Built by concatenation so this file does not trip its own scan below.
const WWW_HOST = ['www', 'grottocenter', 'org'].join('.');
const BINARY_EXTENSIONS = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|eot|pdf)$/i;

const readIndexHtml = () =>
  new DOMParser().parseFromString(
    readFileSync(path.join(WEB_APP_ROOT, 'index.html'), 'utf8'),
    'text/html'
  );

const metaContent = (doc, selector) =>
  doc.querySelector(selector)?.getAttribute('content');

const isApexUrl = value =>
  typeof value === 'string' &&
  (value === APEX_ORIGIN || value.startsWith(`${APEX_ORIGIN}/`));

/**
 * Apex origin: social metadata names the apex, never the redirecting host.
 * Encodes: `www` 301s to the apex, so link unfurlers and feed readers must
 * only ever be pointed at https://grottocenter.org.
 * Covers: og:url, og:image and twitter:image in index.html.
 * Deliberately not a static <link rel="canonical">: one literal canonical on
 * every SPA route would declare every route to be the homepage.
 */
describe('index.html metadata origin', () => {
  it.each([
    ['og:url', 'meta[property="og:url"]'],
    ['og:image', 'meta[property="og:image"]'],
    ['twitter:image', 'meta[name="twitter:image"]']
  ])('should use the apex origin for %s', (_name, selector) => {
    const doc = readIndexHtml();
    const content = metaContent(doc, selector);

    expect(content, `${selector} is missing from index.html`).toBeTruthy();
    expect(
      isApexUrl(content),
      `${selector} must start with ${APEX_ORIGIN}; www redirects to the apex ` +
        `and must not be used in metadata (see issue #1501). Got: ${content}`
    ).toBe(true);
  });

  it('should not use the www host in any metadata value', () => {
    const doc = readIndexHtml();
    const values = [...doc.querySelectorAll('meta[content], link[href]')].map(
      el => el.getAttribute('content') ?? el.getAttribute('href')
    );

    expect(values.filter(value => value.includes(WWW_HOST))).toEqual([]);
  });
});

/**
 * Repo-wide: no tracked file reintroduces the redirecting host.
 * Encodes: a future change cannot slip `www` into metadata anywhere under
 * packages/web-app/ (templates, config, generated-page helpers).
 */
describe('tracked files under packages/web-app', () => {
  it('should not reference the www host', () => {
    const tracked = execFileSync('git', ['ls-files', '-z', '--', '.'], {
      cwd: WEB_APP_ROOT,
      encoding: 'utf8'
    })
      .split('\0')
      .filter(Boolean)
      .filter(file => !BINARY_EXTENSIONS.test(file));

    expect(tracked.length).toBeGreaterThan(0);

    const offenders = tracked.filter(file => {
      try {
        return readFileSync(path.join(WEB_APP_ROOT, file), 'utf8').includes(
          WWW_HOST
        );
      } catch {
        // Deleted in the working tree but still listed by git: nothing to scan.
        return false;
      }
    });

    expect(
      offenders,
      `${WWW_HOST} redirects to the apex; use ${APEX_ORIGIN} (issue #1501)`
    ).toEqual([]);
  });
});
