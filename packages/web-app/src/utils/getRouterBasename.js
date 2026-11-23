const PREVIEW_BASE_PATH = /^\/pr\/\d+(?=\/|$)/;

const getRouterBasename = pathname =>
  PREVIEW_BASE_PATH.exec(pathname)?.[0] ?? '';

// Strips the router basename from an absolute browser pathname, returning the
// path that React Router sees. Callers that need a router-relative path should
// use this instead of slicing getRouterBasename() themselves.
export const getRouterRelativePathname = pathname =>
  pathname.slice(getRouterBasename(pathname).length) || '/';

export default getRouterBasename;
