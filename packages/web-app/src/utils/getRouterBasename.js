const PREVIEW_BASE_PATH = /^\/pr\/\d+(?=\/|$)/;

const getRouterBasename = pathname =>
  PREVIEW_BASE_PATH.exec(pathname)?.[0] || '/';

export default getRouterBasename;
