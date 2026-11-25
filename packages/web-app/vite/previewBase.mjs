// A pull-request preview is served at https://staging.grottocenter.org/pr/<n>/
// and every one of its resources must live under that prefix, so that several
// previews coexist on one origin without sharing a service worker or a cache.
// CI passes the number as VITE_PREVIEW_PR; production and local builds leave it
// unset and keep serving from `/`.

const PR_NUMBER = /^[1-9]\d{0,5}$/;

export const resolvePreviewBase = previewPr => {
  if (previewPr === undefined || previewPr === null || previewPr === '') {
    return '/';
  }
  const value = String(previewPr).trim();
  if (!PR_NUMBER.test(value)) {
    throw new Error(
      `VITE_PREVIEW_PR must be a pull request number (1 to 6 digits), got "${previewPr}"`
    );
  }
  return `/pr/${value}/`;
};

// Suffix for cache names: empty for `/`, so production names are unchanged.
export const resolveCacheSuffix = base => {
  const match = /^\/pr\/(\d+)\/$/.exec(base);
  return match ? `-pr-${match[1]}` : '';
};
