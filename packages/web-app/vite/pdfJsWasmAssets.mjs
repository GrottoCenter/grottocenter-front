import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';

const require = createRequire(import.meta.url);
const PDFJS_PACKAGE_PATH = require.resolve('pdfjs-dist/package.json');
const PDFJS_ROOT = dirname(PDFJS_PACKAGE_PATH);
const PDFJS_WASM_DIRECTORY = join(PDFJS_ROOT, 'wasm');
const PDFJS_PACKAGE = JSON.parse(await readFile(PDFJS_PACKAGE_PATH, 'utf8'));
const PDFJS_WASM_PUBLIC_PATH = `assets/pdfjs/${PDFJS_PACKAGE.version}/wasm`;

const CONTENT_TYPES = {
  '.js': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm'
};

const getPublicPrefix = base => {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${PDFJS_WASM_PUBLIC_PATH}/`;
};

const getRequestPath = requestUrl => {
  try {
    return decodeURIComponent(
      new URL(requestUrl, 'http://vite.local').pathname
    );
  } catch (_error) {
    return null;
  }
};

/**
 * Publishes the PDF.js image decoders without copying vendor binaries into the
 * repository. PDF.js appends fixed filenames such as `jbig2.wasm` to one base
 * URL, so normal hashed `?url` imports cannot represent this directory.
 */
const pdfJsWasmAssets = () => {
  let base = '/';

  return {
    name: 'pdfjs-wasm-assets',
    configResolved: config => {
      base = config.base;
    },
    configureServer: server => {
      server.middlewares.use(async (request, response, next) => {
        const requestPath = getRequestPath(request.url);
        const publicPrefix = getPublicPrefix(base);
        if (!requestPath?.startsWith(publicPrefix)) {
          next();
          return;
        }

        const fileName = requestPath.slice(publicPrefix.length);
        // PDF.js requests flat, package-owned filenames. Reject separators so
        // this development-only file server can never escape the wasm folder.
        if (!fileName || fileName.includes('/') || fileName.includes('\\')) {
          next();
          return;
        }

        try {
          const source = await readFile(join(PDFJS_WASM_DIRECTORY, fileName));
          response.statusCode = 200;
          response.setHeader(
            'Content-Type',
            CONTENT_TYPES[extname(fileName)] ?? 'text/plain; charset=utf-8'
          );
          response.setHeader('Cache-Control', 'no-cache');
          response.end(source);
        } catch (error) {
          if (error.code === 'ENOENT') {
            next();
            return;
          }
          server.config.logger.error(
            `Unable to serve PDF.js asset ${fileName}: ${error.message}`
          );
          response.statusCode = 500;
          response.end();
        }
      });
    },
    generateBundle: async function generateBundle() {
      const entries = await readdir(PDFJS_WASM_DIRECTORY, {
        withFileTypes: true
      });
      await Promise.all(
        entries
          .filter(entry => entry.isFile())
          .map(async entry => {
            this.emitFile({
              type: 'asset',
              fileName: `${PDFJS_WASM_PUBLIC_PATH}/${entry.name}`,
              source: await readFile(join(PDFJS_WASM_DIRECTORY, entry.name))
            });
          })
      );
    }
  };
};

export default pdfJsWasmAssets;
