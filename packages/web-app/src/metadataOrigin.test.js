import { readdirSync, readFileSync } from 'node:fs';
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

// Directories that hold installed, generated or scratch files, never source.
const SKIPPED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  'storybook-static',
  '.local',
  '.vite',
  'screenshots',
  'videos',
  'downloads'
]);

// Paths (relative to packages/web-app, with `/` separators) allowed to mention
// the www host, e.g. a doc explaining that www 301s to the apex. Keep it empty
// unless a legitimate mention exists; do not disable the guard instead.
const ALLOWED_FILES = [];

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

const listFiles = directory =>
  readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory()) {
      return SKIPPED_DIRECTORIES.has(entry.name)
        ? []
        : listFiles(path.join(directory, entry.name));
    }
    return entry.isFile() ? [path.join(directory, entry.name)] : [];
  });

// Latin-1 maps every byte to one character, so binary files need no extension
// list: the host is plain ASCII and cannot appear by accident inside them.
const mentionsWwwHost = file =>
  readFileSync(file).toString('latin1').toLowerCase().includes(WWW_HOST);

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
});

/**
 * Package-wide: no file under packages/web-app mentions the redirecting host.
 * Encodes: a future change cannot slip `www` into metadata (templates, config,
 * generated-page helpers). The match is deliberately broader than metadata: any
 * textual mention, case-insensitive, fails, so a legitimate one is listed in
 * ALLOWED_FILES rather than the guard being disabled.
 * Covers: every file under packages/web-app outside SKIPPED_DIRECTORIES
 * (including index.html). Does not cover the rest of the repository.
 */
describe('files under packages/web-app', () => {
  it('should not mention the www host', () => {
    const files = listFiles(WEB_APP_ROOT);
    expect(files.length).toBeGreaterThan(0);

    const offenders = files
      .map(file => path.relative(WEB_APP_ROOT, file).split(path.sep).join('/'))
      .filter(relative => !ALLOWED_FILES.includes(relative))
      .filter(relative => mentionsWwwHost(path.join(WEB_APP_ROOT, relative)));

    expect(
      offenders,
      `${WWW_HOST} redirects to the apex; use ${APEX_ORIGIN} (issue #1501)`
    ).toEqual([]);
  });
});
