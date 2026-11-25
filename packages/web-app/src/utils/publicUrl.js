// Every preview is served under /pr/<number>/ (see vite/previewBase.mjs), the
// production build under /. Vite exposes that prefix as BASE_URL, always with a
// trailing slash. Root-absolute URLs written by hand ('/images/…', '/lang/…')
// would escape the prefix and hit another preview, so build them through here.
export const withBase = (path = '') =>
  `${import.meta.env.BASE_URL}${String(path).replace(/^\/+/, '')}`;

// Suffix naming the caches that belong to this build: empty for production, so
// its cache names stay exactly as they were, `-pr-<number>` for a preview.
export const getCacheSuffix = (base = import.meta.env.BASE_URL) => {
  const match = /^\/pr\/(\d+)\/$/.exec(base);
  return match ? `-pr-${match[1]}` : '';
};
