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

// Untracked scratch and generated locations, so the walk sees what CI sees.
// Generic names are matched at any depth; everything else is anchored to its
// real location (relative to packages/web-app) so a tracked directory that
// happens to share a name, such as public/screenshots, is still scanned.
const SKIPPED_NAMES = new Set(['node_modules', '.vite', '.nyc_output']);
const SKIPPED_PATHS = new Set([
  'dist',
  'build',
  'coverage',
  'storybook-static',
  'cypress/downloads',
  'cypress/screenshots',
  'cypress/videos'
]);
// Git-ignored local files: `*.local` (files such as `.env.local`, or
// directories such as `.local/`), `*.log` and `.eslintcache`. Never skip by
// prefix: the tracked `.env` holds the app's hosts and must stay scanned.
const isLocalFile = name =>
  name.endsWith('.local') || name.endsWith('.log') || name === '.eslintcache';

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

const toRelative = file =>
  path.relative(WEB_APP_ROOT, file).split(path.sep).join('/');

const isSkipped = (name, file) =>
  SKIPPED_NAMES.has(name) ||
  isLocalFile(name) ||
  SKIPPED_PATHS.has(toRelative(file));

const listFiles = directory =>
  readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const child = path.join(directory, entry.name);
    if (isSkipped(entry.name, child)) return [];
    if (entry.isDirectory()) return listFiles(child);
    return entry.isFile() ? [child] : [];
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
 * Covers: every file under packages/web-app outside the skipped scratch and
 * git-ignored local locations (including index.html). Does not cover the rest
 * of the repository. Other untracked files are scanned too, so a failure that
 * only happens on one machine means cleaning that file, not extending
 * ALLOWED_FILES.
 */
describe('files under packages/web-app', () => {
  it('should not mention the www host', () => {
    const files = listFiles(WEB_APP_ROOT);
    expect(files.length).toBeGreaterThan(0);

    const offenders = files
      .map(file => toRelative(file))
      .filter(relative => !ALLOWED_FILES.includes(relative))
      .filter(relative => mentionsWwwHost(path.join(WEB_APP_ROOT, relative)));

    expect(
      offenders,
      `${WWW_HOST} redirects to the apex; use ${APEX_ORIGIN} (issue #1501)`
    ).toEqual([]);
  });
});
